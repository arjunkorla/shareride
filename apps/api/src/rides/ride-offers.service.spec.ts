import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { RideOffersService } from './ride-offers.service'
import type { PrismaService } from '../common/prisma/prisma.service'
import type { CreateRideOfferInput } from '@shareride/validation'

// Targeted coverage for create()'s ownership/eligibility guards only (the
// raw-SQL insert + coordinate-enrichment path below them is not exercised
// here — see docs/agent-handoff.md's test-coverage finding C23 for the
// broader gap this doesn't fully close). Hand-built Prisma fake, no live
// DB, same pattern as every other *.service.spec.ts in this repo.
describe('RideOffersService.create', () => {
  const DRIVER_ID = 'driver-1'
  const VEHICLE_ID = 'vehicle-1'

  function makeVehicle(overrides: Partial<{ driverId: string; isActive: boolean }> = {}) {
    return { id: VEHICLE_ID, driverId: DRIVER_ID, isActive: true, ...overrides }
  }

  function makeInput(): CreateRideOfferInput {
    return {
      vehicleId: VEHICLE_ID,
      origin: 'Madhapur',
      destination: 'Gachibowli',
      originCoordinates: { lat: 17.44, lng: 78.39 },
      destinationCoordinates: { lat: 17.44, lng: 78.35 },
      departureDate: '2026-03-01',
      departureTime: '08:00',
      stops: [],
      pricePerPerson: 150,
    }
  }

  function makePrisma(vehicle: ReturnType<typeof makeVehicle> | null) {
    const executeRaw = jest.fn().mockResolvedValue(1)
    return {
      client: {
        vehicle: { findUnique: jest.fn().mockResolvedValue(vehicle) },
        $executeRaw: executeRaw,
      },
    } as unknown as PrismaService
  }

  it('refuses to create an offer with a vehicle that does not belong to the caller', async () => {
    const prisma = makePrisma(makeVehicle({ driverId: 'someone-else' }))
    const service = new RideOffersService(prisma)
    await expect(service.create(DRIVER_ID, makeInput())).rejects.toBeInstanceOf(ForbiddenException)
    expect(prisma.client.$executeRaw).not.toHaveBeenCalled()
  })

  it('refuses to create an offer with a nonexistent vehicle', async () => {
    const prisma = makePrisma(null)
    const service = new RideOffersService(prisma)
    await expect(service.create(DRIVER_ID, makeInput())).rejects.toBeInstanceOf(ForbiddenException)
  })

  // docs/agent-handoff.md finding C17: a deactivated vehicle was never
  // checked at offer-creation time, only at deactivation time.
  it('refuses to create an offer with a deactivated vehicle', async () => {
    const prisma = makePrisma(makeVehicle({ isActive: false }))
    const service = new RideOffersService(prisma)
    await expect(service.create(DRIVER_ID, makeInput())).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.client.$executeRaw).not.toHaveBeenCalled()
  })
})
