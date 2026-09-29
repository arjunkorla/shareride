import { BadRequestException, NotFoundException } from '@nestjs/common'
import { TripsService } from './trips.service'
import type { PrismaService } from '../common/prisma/prisma.service'

describe('TripsService', () => {
  const TRIP_ID = 'trip-1'
  const PASSENGER_ID = 'passenger-1'
  const DRIVER_ID = 'driver-1'
  const STRANGER_ID = 'stranger-1'

  function makeTrip(overrides: Partial<{ status: string }> = {}) {
    return {
      id: TRIP_ID,
      rideAgreementId: 'agreement-1',
      passengerId: PASSENGER_ID,
      driverId: DRIVER_ID,
      status: 'CONFIRMED',
      scheduledAt: new Date('2026-02-01T08:00:00Z'),
      startedAt: null,
      completedAt: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...overrides,
    }
  }

  function makePrisma(trip: ReturnType<typeof makeTrip> | null, options: { updateManyCount?: number } = {}) {
    const finalTrip = { ...(trip ?? makeTrip()), status: 'COMPLETED', completedAt: new Date() }
    const tx = {
      trip: {
        updateMany: jest.fn().mockResolvedValue({ count: options.updateManyCount ?? 1 }),
        findUniqueOrThrow: jest.fn().mockResolvedValue(finalTrip),
      },
      tripEvent: { create: jest.fn().mockResolvedValue({}) },
      driverProfile: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      passengerProfile: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    }
    return {
      client: {
        trip: { findUnique: jest.fn().mockResolvedValue(trip), findMany: jest.fn().mockResolvedValue(trip ? [trip] : []) },
        rideAgreement: {
          findUnique: jest.fn().mockResolvedValue({
            id: 'agreement-1',
            match: { rideOffer: { origin: 'Madhapur', destination: 'Gachibowli', pricePerPerson: { toNumber: () => 150 } } },
          }),
        },
        user: { findUnique: jest.fn().mockResolvedValue({ fullName: 'Test User', avatarUrl: null }) },
        $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn(tx)),
      },
      __tx: tx,
    } as unknown as PrismaService & { __tx: typeof tx }
  }

  it('lets a participant (passenger or driver) read their own trip', async () => {
    const prisma = makePrisma(makeTrip())
    const service = new TripsService(prisma)
    await expect(service.get(TRIP_ID, PASSENGER_ID)).resolves.toEqual(expect.objectContaining({ id: TRIP_ID }))
    await expect(service.get(TRIP_ID, DRIVER_ID)).resolves.toEqual(expect.objectContaining({ id: TRIP_ID }))
  })

  it('refuses to let a non-participant read a trip', async () => {
    const prisma = makePrisma(makeTrip())
    const service = new TripsService(prisma)
    await expect(service.get(TRIP_ID, STRANGER_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('lets either participant mark a trip complete, bumping both profiles\' totalTrips once', async () => {
    const prisma = makePrisma(makeTrip({ status: 'CONFIRMED' }))
    const service = new TripsService(prisma)

    const result = await service.complete(TRIP_ID, PASSENGER_ID)

    expect(result.status).toBe('COMPLETED')
    expect(prisma.__tx.driverProfile.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: DRIVER_ID }, data: { totalTrips: { increment: 1 } } }),
    )
    expect(prisma.__tx.passengerProfile.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: PASSENGER_ID }, data: { totalTrips: { increment: 1 } } }),
    )
  })

  it('refuses to complete a trip that is already completed or cancelled', async () => {
    const prisma = makePrisma(makeTrip({ status: 'COMPLETED' }))
    const service = new TripsService(prisma)
    await expect(service.complete(TRIP_ID, PASSENGER_ID)).rejects.toBeInstanceOf(BadRequestException)
  })

  it('refuses to let a non-participant complete a trip', async () => {
    const prisma = makePrisma(makeTrip())
    const service = new TripsService(prisma)
    await expect(service.complete(TRIP_ID, STRANGER_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  // docs/agent-handoff.md finding C16: both participants tapping "mark
  // complete" near-simultaneously previously could both pass the
  // pre-transaction terminal-status check (same stale read) and both fully
  // apply their own transaction, double-counting totalTrips.
  it('refuses (and does not double-count) when a concurrent complete() already claimed the trip', async () => {
    const prisma = makePrisma(makeTrip({ status: 'CONFIRMED' }), { updateManyCount: 0 })
    const service = new TripsService(prisma)

    await expect(service.complete(TRIP_ID, PASSENGER_ID)).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.__tx.driverProfile.updateMany).not.toHaveBeenCalled()
    expect(prisma.__tx.passengerProfile.updateMany).not.toHaveBeenCalled()
    expect(prisma.__tx.tripEvent.create).not.toHaveBeenCalled()
  })
})
