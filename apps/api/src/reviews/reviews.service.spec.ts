import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@shareride/database'
import { ReviewsService } from './reviews.service'
import type { PrismaService } from '../common/prisma/prisma.service'

function duplicateReviewError() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '5.22.0' })
}

describe('ReviewsService', () => {
  const TRIP_ID = 'trip-1'
  const PASSENGER_ID = 'passenger-1'
  const DRIVER_ID = 'driver-1'
  const STRANGER_ID = 'stranger-1'

  function makeTrip(status = 'COMPLETED') {
    return { id: TRIP_ID, passengerId: PASSENGER_ID, driverId: DRIVER_ID, status }
  }

  function makePrisma(options: { trip?: ReturnType<typeof makeTrip> | null; createError?: unknown } = {}) {
    const trip = options.trip === undefined ? makeTrip() : options.trip
    return {
      client: {
        trip: { findUnique: jest.fn().mockResolvedValue(trip) },
        review: {
          create: options.createError
            ? jest.fn().mockRejectedValue(options.createError)
            : jest.fn().mockResolvedValue({
                id: 'review-1', tripId: TRIP_ID, authorId: PASSENGER_ID, recipientId: DRIVER_ID,
                rating: 5, comment: 'Great ride', categories: ['Punctual'], createdAt: new Date('2026-01-01T00:00:00Z'),
              }),
          findMany: jest.fn().mockResolvedValue([]),
          aggregate: jest.fn().mockResolvedValue({ _avg: { rating: 4.5 } }),
        },
        driverProfile: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
        passengerProfile: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      },
    } as unknown as PrismaService
  }

  it('refuses to review a trip the caller was not part of', async () => {
    const prisma = makePrisma()
    const service = new ReviewsService(prisma)
    await expect(service.create(STRANGER_ID, { tripId: TRIP_ID, rating: 5 })).rejects.toBeInstanceOf(NotFoundException)
  })

  it('refuses to review a trip that is not completed', async () => {
    const prisma = makePrisma({ trip: makeTrip('CONFIRMED') })
    const service = new ReviewsService(prisma)
    await expect(service.create(PASSENGER_ID, { tripId: TRIP_ID, rating: 5 })).rejects.toBeInstanceOf(BadRequestException)
  })

  it('refuses a duplicate review of the same trip by the same author', async () => {
    const prisma = makePrisma({ createError: duplicateReviewError() })
    const service = new ReviewsService(prisma)
    await expect(service.create(PASSENGER_ID, { tripId: TRIP_ID, rating: 4 })).rejects.toBeInstanceOf(ConflictException)
  })

  it('reviews the OTHER trip participant, never the author themselves', async () => {
    const prisma = makePrisma()
    const service = new ReviewsService(prisma)

    await service.create(PASSENGER_ID, { tripId: TRIP_ID, rating: 5 })

    expect(prisma.client.review.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ authorId: PASSENGER_ID, recipientId: DRIVER_ID }) }),
    )
  })

  it('recomputes the recipient\'s aggregate rating from real Review rows, not a client-supplied number', async () => {
    const prisma = makePrisma()
    const service = new ReviewsService(prisma)

    await service.create(PASSENGER_ID, { tripId: TRIP_ID, rating: 5 })

    expect(prisma.client.review.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { recipientId: DRIVER_ID } }),
    )
    expect(prisma.client.driverProfile.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: DRIVER_ID }, data: { rating: 4.5 } }),
    )
  })

  it('returns an averageRating/reviewCount aggregate alongside the list, computed from actual rows', async () => {
    const prisma = makePrisma()
    prisma.client.review.findMany = jest.fn().mockResolvedValue([
      { id: 'r1', tripId: TRIP_ID, authorId: PASSENGER_ID, recipientId: DRIVER_ID, rating: 5, comment: null, categories: [], createdAt: new Date(), author: { id: PASSENGER_ID, fullName: 'Priya', avatarUrl: null } },
      { id: 'r2', tripId: 'trip-2', authorId: 'passenger-2', recipientId: DRIVER_ID, rating: 3, comment: null, categories: [], createdAt: new Date(), author: { id: 'passenger-2', fullName: 'Rahul', avatarUrl: null } },
    ])
    const service = new ReviewsService(prisma)

    const result = await service.listForUser(DRIVER_ID)

    expect(result.reviewCount).toBe(2)
    expect(result.averageRating).toBe(4)
  })
})
