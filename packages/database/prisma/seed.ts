// Local development seed data only. Hyderabad-first, clearly fictional
// people — never real personal information. Run via `pnpm db:seed`.
//
// ride_requests / ride_offers have PostGIS `geometry(Point,4326)` columns
// that Prisma Client treats as Unsupported and cannot write directly, so
// those two tables are inserted with raw SQL (ST_SetSRID/ST_MakePoint);
// everything else goes through the normal Prisma Client API.

import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { ROLE_PERMISSIONS, type AdminRole } from '@shareride/types'

const prisma = new PrismaClient()

const ADMIN_ROLE_NAMES: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  OPERATIONS_ADMIN: 'Operations Admin',
  VERIFICATION_ADMIN: 'Verification Admin',
  SAFETY_ADMIN: 'Safety Admin',
  SUPPORT_ADMIN: 'Support Admin',
  FINANCE_ADMIN: 'Finance Admin',
  CONTENT_ADMIN: 'Content Admin',
  READ_ONLY_ADMIN: 'Read Only Admin',
}

const HYDERABAD = { lat: 17.385, lng: 78.4867 }

const AREAS: Record<string, { lat: number; lng: number }> = {
  Madhapur: { lat: 17.4483, lng: 78.3915 },
  Gachibowli: { lat: 17.4401, lng: 78.3489 },
  'HITEC City': { lat: 17.4435, lng: 78.3772 },
  Kondapur: { lat: 17.4615, lng: 78.3627 },
  'Financial District': { lat: 17.4136, lng: 78.3418 },
  'Jubilee Hills': { lat: 17.4325, lng: 78.4071 },
  'Banjara Hills': { lat: 17.4156, lng: 78.4347 },
  Secunderabad: { lat: 17.4399, lng: 78.4983 },
  Kukatpally: { lat: 17.4849, lng: 78.4138 },
  Miyapur: { lat: 17.4966, lng: 78.3616 },
  Ameerpet: { lat: 17.4374, lng: 78.4487 },
  'LB Nagar': { lat: 17.3466, lng: 78.5531 },
  Uppal: { lat: 17.3995, lng: 78.5591 },
  Shamshabad: { lat: 17.2403, lng: 78.4294 },
}

async function main() {
  console.log('Seeding ShareRide dev data (Hyderabad)…')

  const city = await prisma.city.upsert({
    where: { name_state: { name: 'Hyderabad', state: 'Telangana' } },
    update: {},
    create: { name: 'Hyderabad', state: 'Telangana', country: 'India' },
  })

  for (const name of Object.keys(AREAS)) {
    await prisma.area.upsert({
      where: { id: `${city.id}-${name}` },
      update: {},
      create: { id: `${city.id}-${name}`, cityId: city.id, name },
    })
  }

  const [driverArjun, driverPriya, passengerSneha, passengerAditya] = await Promise.all([
    prisma.user.upsert({
      where: { phone: '+919000000001' },
      update: {},
      create: {
        phone: '+919000000001',
        fullName: 'Arjun Reddy (demo driver)',
        roles: ['DRIVER'],
        driverProfile: {
          create: { bio: 'Daily commuter, Madhapur to Gachibowli.', languages: ['Telugu', 'Hindi', 'English'], yearsActive: 3, verificationStatus: 'APPROVED', rating: 4.9, totalTrips: 247 },
        },
      },
    }),
    prisma.user.upsert({
      where: { phone: '+919000000002' },
      update: {},
      create: {
        phone: '+919000000002',
        fullName: 'Priya Lakshmi (demo driver)',
        roles: ['DRIVER'],
        driverProfile: {
          create: { bio: 'Safe, reliable commuter.', languages: ['Telugu', 'Hindi', 'English'], yearsActive: 2, verificationStatus: 'APPROVED', rating: 4.8, totalTrips: 183 },
        },
      },
    }),
    prisma.user.upsert({
      where: { phone: '+919000000003' },
      update: {},
      create: {
        phone: '+919000000003',
        fullName: 'Sneha Reddy (demo passenger)',
        roles: ['PASSENGER'],
        passengerProfile: { create: { rating: 4.8, totalTrips: 23 } },
      },
    }),
    prisma.user.upsert({
      where: { phone: '+919000000004' },
      update: {},
      create: {
        phone: '+919000000004',
        fullName: 'Aditya Kumar (demo passenger)',
        roles: ['PASSENGER'],
        passengerProfile: { create: { rating: 4.6, totalTrips: 41 } },
      },
    }),
  ])

  const vehicle = await prisma.vehicle.upsert({
    where: { registrationNumber: 'TS09EXAMPLE1' },
    update: {},
    create: {
      driverId: driverArjun.id,
      make: 'Honda',
      model: 'City ZX',
      year: 2022,
      color: 'Pearl White',
      fuelType: 'PETROL',
      registrationNumber: 'TS09EXAMPLE1',
      ac: true,
      verificationStatus: 'APPROVED',
    },
  })

  // Example from docs/migration-plan.md Phase 7: passenger Madhapur -> Gachibowli
  // 8:00am, driver Kondapur -> Financial District 8:15am (a real matching-engine
  // test case, not a guaranteed match — left for the matching module to decide).
  const now = new Date()
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const expiresAt = new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
  const dateStr = tomorrow.toISOString().slice(0, 10)

  const rideRequestId = randomUUID()
  await prisma.$executeRaw`
    INSERT INTO public.ride_requests (
      id, "passengerId", origin, destination,
      "originCoordinates", "destinationCoordinates",
      "preferredDate", "preferredTimeStart", "preferredTimeEnd",
      preferences, notes, status, "createdAt", "updatedAt", "expiresAt"
    ) VALUES (
      ${rideRequestId}, ${passengerSneha.id}, 'Madhapur, Hyderabad', 'Gachibowli, Hyderabad',
      extensions.ST_SetSRID(extensions.ST_MakePoint(${AREAS.Madhapur.lng}, ${AREAS.Madhapur.lat}), 4326),
      extensions.ST_SetSRID(extensions.ST_MakePoint(${AREAS.Gachibowli.lng}, ${AREAS.Gachibowli.lat}), 4326),
      ${dateStr}::date, '08:00', '09:00',
      '{}'::jsonb, 'Pickup near Cyber Towers gate.', 'ACTIVE', now(), now(), ${expiresAt}
    )
    ON CONFLICT (id) DO NOTHING
  `

  const rideOfferId = randomUUID()
  await prisma.$executeRaw`
    INSERT INTO public.ride_offers (
      id, "driverId", "vehicleId", origin, destination,
      "originCoordinates", "destinationCoordinates",
      "departureDate", "departureTime", stops, "pricePerPerson",
      preferences, notes, status, "createdAt", "updatedAt", "expiresAt"
    ) VALUES (
      ${rideOfferId}, ${driverArjun.id}, ${vehicle.id}, 'Kondapur, Hyderabad', 'Financial District, Hyderabad',
      extensions.ST_SetSRID(extensions.ST_MakePoint(${AREAS.Kondapur.lng}, ${AREAS.Kondapur.lat}), 4326),
      extensions.ST_SetSRID(extensions.ST_MakePoint(${AREAS['Financial District'].lng}, ${AREAS['Financial District'].lat}), 4326),
      ${dateStr}::date, '08:15', ARRAY[]::text[], 120.00,
      '{"autoConfirm": true, "acPreferred": true}'::jsonb, NULL, 'ACTIVE', now(), now(), ${expiresAt}
    )
    ON CONFLICT (id) DO NOTHING
  `

  // Admin RBAC roles — the permission grants each role starts with. Editable
  // afterward via the admin.role.manage-gated Roles page, not re-synced by
  // this script on subsequent runs (update: {} leaves manual edits alone).
  for (const [key, permissions] of Object.entries(ROLE_PERMISSIONS) as [AdminRole, string[]][]) {
    await prisma.adminRoleDefinition.upsert({
      where: { key },
      update: {},
      create: { key, name: ADMIN_ROLE_NAMES[key], permissions },
    })
  }

  // A demo safety report so the admin Safety module has something to show.
  const demoReport = await prisma.report.findFirst({ where: { reason: 'Demo: late pickup complaint' } })
  if (!demoReport) {
    await prisma.report.create({
      data: {
        type: 'RIDE',
        status: 'NEW',
        reporterId: passengerSneha.id,
        reportedUserId: driverArjun.id,
        reason: 'Demo: late pickup complaint',
        description: 'Seed fixture for exercising the admin Safety & Reports module locally.',
      },
    })
  }

  console.log(`Seed complete. City=${city.name} (${Object.keys(AREAS).length} areas), 2 drivers, 2 passengers, 1 vehicle, 1 ride request, 1 ride offer, ${Object.keys(ROLE_PERMISSIONS).length} admin roles, 1 demo report.`)
  console.log(
    'No admin user was created — an AdminUser row must use the same id as a real Supabase auth user. ' +
      'To promote yourself to SUPER_ADMIN after signing up in Supabase: create an admin_users row with ' +
      'id = your Supabase auth user id and roleId = the SUPER_ADMIN admin_role_definitions row (see pnpm db:studio).',
  )
  void passengerAditya
  void driverPriya
  void HYDERABAD
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
