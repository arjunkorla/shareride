import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@shareride/database'
import { VehiclesService } from './vehicles.service'
import type { PrismaService } from '../common/prisma/prisma.service'

function duplicateRegistrationError() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '5.22.0' })
}

describe('VehiclesService', () => {
  const VEHICLE_ID = 'vehicle-1'
  const DRIVER_ID = 'driver-1'
  const OTHER_DRIVER_ID = 'driver-2'

  function makeVehicle(overrides: Partial<{ verificationStatus: string }> = {}) {
    return {
      id: VEHICLE_ID,
      driverId: DRIVER_ID,
      make: 'Toyota',
      model: 'Innova',
      year: 2022,
      color: 'White',
      fuelType: 'PETROL',
      registrationNumber: 'TS09EA1234',
      ac: true,
      photoUrl: null,
      verificationStatus: 'APPROVED',
      verificationNote: null,
      isActive: true,
      ...overrides,
    }
  }

  function makePrisma(vehicle: ReturnType<typeof makeVehicle> | null, options: { activeOffers?: number; updateError?: unknown } = {}) {
    return {
      client: {
        vehicle: {
          findUnique: jest.fn().mockResolvedValue(vehicle),
          create: options.updateError
            ? jest.fn().mockRejectedValue(options.updateError)
            : jest.fn().mockResolvedValue(vehicle ?? makeVehicle()),
          update: options.updateError
            ? jest.fn().mockRejectedValue(options.updateError)
            : jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ ...(vehicle ?? makeVehicle()), ...data })),
        },
        rideOffer: { count: jest.fn().mockResolvedValue(options.activeOffers ?? 0) },
      },
    } as unknown as PrismaService
  }

  it('rejects creating a vehicle with a registration number already in use', async () => {
    const prisma = makePrisma(null, { updateError: duplicateRegistrationError() })
    const service = new VehiclesService(prisma)
    await expect(
      service.create(DRIVER_ID, { make: 'Honda', model: 'City', year: 2021, color: 'Black', fuelType: 'PETROL', registrationNumber: 'TS09EA1234', ac: true }),
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('refuses to update a vehicle that belongs to another driver', async () => {
    const prisma = makePrisma(makeVehicle())
    const service = new VehiclesService(prisma)
    await expect(service.update(VEHICLE_ID, OTHER_DRIVER_ID, { color: 'Red' })).rejects.toBeInstanceOf(NotFoundException)
  })

  it('resets an APPROVED vehicle back to NOT_STARTED when its registration details actually change', async () => {
    const prisma = makePrisma(makeVehicle({ verificationStatus: 'APPROVED' }))
    const service = new VehiclesService(prisma)

    const result = await service.update(VEHICLE_ID, DRIVER_ID, { registrationNumber: 'TS10AB9999' })

    expect(result.verificationStatus).toBe('NOT_STARTED')
  })

  it('does not reset verification status for a no-op edit (e.g. toggling ac only)', async () => {
    const prisma = makePrisma(makeVehicle({ verificationStatus: 'APPROVED' }))
    const service = new VehiclesService(prisma)

    const result = await service.update(VEHICLE_ID, DRIVER_ID, { ac: false })

    expect(result.verificationStatus).toBe('APPROVED')
  })

  it('refuses to deactivate a vehicle with an active ride offer', async () => {
    const prisma = makePrisma(makeVehicle(), { activeOffers: 1 })
    const service = new VehiclesService(prisma)
    await expect(service.deactivate(VEHICLE_ID, DRIVER_ID)).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('deactivates a vehicle with no active offers', async () => {
    const prisma = makePrisma(makeVehicle(), { activeOffers: 0 })
    const service = new VehiclesService(prisma)
    const result = await service.deactivate(VEHICLE_ID, DRIVER_ID)
    expect(result.isActive).toBe(false)
  })
})
