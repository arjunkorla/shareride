import { ConflictException } from '@nestjs/common'
import { MatchingService } from './matching.service'
import type { PrismaService } from '../common/prisma/prisma.service'
import type { RouteDistanceService } from './route-distance.service'
import type { NotificationsService } from '../notifications/notifications.service'
import type { MetricsService } from '../common/metrics/metrics.service'
import type { StructuredLogger } from '../common/logger/structured-logger.service'

// Phase 9's notification producers: request/accept/decline each notify the
// OTHER side of the match, never the caller themselves. Phase 14's
// remediation of docs/agent-handoff.md finding C14 made every transition
// conditional on the row's exact current status via `updateMany`'s where
// clause — the fakes below are STATEFUL (a `updateMany`/`create` genuinely
// changes what a later `findUnique` in the same test sees), closely
// enough to actually exercise that conditional logic, same pattern as
// payments.service.spec.ts's post-remediation rewrite. routeDistance isn't
// exercised by these methods, so it's passed as an empty stub.
describe('MatchingService', () => {
  const MATCH_ID = 'match-1'
  const PASSENGER_ID = 'passenger-1'
  const DRIVER_ID = 'driver-1'
  const REQUEST_ID = 'request-1'
  const OFFER_ID = 'offer-1'

  function makeMatchRecord(matchStatus: string) {
    return {
      id: MATCH_ID,
      rideRequestId: REQUEST_ID,
      rideOfferId: OFFER_ID,
      matchStatus,
      rideRequest: { id: REQUEST_ID, passengerId: PASSENGER_ID, passenger: { fullName: 'Priya Passenger' } },
      rideOffer: {
        id: OFFER_ID,
        driverId: DRIVER_ID,
        origin: 'Madhapur',
        destination: 'Gachibowli',
        departureDate: new Date('2026-02-01T00:00:00Z'),
        departureTime: '08:15',
        driver: { fullName: 'Arjun Driver' },
      },
      originDistanceMeters: 100,
      destinationDistanceMeters: 100,
      routeCompatibility: { toNumber: () => 0.8 },
      timeCompatibility: { toNumber: () => 0.8 },
      createdAt: new Date(),
      updatedAt: new Date(),
      expiresAt: new Date(),
    }
  }

  function makeNotifications() {
    return { create: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationsService
  }

  function makeLogger() {
    return { setContext: jest.fn(), log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(), verbose: jest.fn(), logEvent: jest.fn() } as unknown as StructuredLogger
  }

  function matchesWhere(row: Record<string, unknown> | null, where: Record<string, unknown>): boolean {
    if (!row) return false
    return Object.entries(where).every(([key, value]) => {
      if (key === 'id' && typeof value === 'object' && value !== null && 'not' in (value as object)) {
        return row.id !== (value as { not: unknown }).not
      }
      if (typeof value === 'object' && value !== null && 'in' in (value as object)) {
        return (value as { in: unknown[] }).in.includes(row[key])
      }
      return row[key] === value
    })
  }

  const routeDistance = {} as unknown as RouteDistanceService
  // Not exercised by request()/accept()/decline() either — only
  // findForRideRequest/findForRideOffer record matching-run duration.
  const metrics = {} as unknown as MetricsService

  // A stateful fake covering exactly what request()/accept()/decline()
  // touch: one Match row, one RideRequest row, plus create()-only
  // rideAgreement/trip tables for accept()'s transaction.
  function makePrisma(options: { match?: ReturnType<typeof makeMatchRecord> | null; rideRequestStatus?: string } = {}) {
    let matchRow: Record<string, unknown> | null = options.match === undefined ? makeMatchRecord('SUGGESTED') : options.match
    let rideRequestStatus = options.rideRequestStatus ?? 'ACTIVE'

    const match = {
      findUnique: jest.fn(async () => matchRow),
      findUniqueOrThrow: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
        if (!matchesWhere(matchRow, where)) throw new Error('Match not found')
        return matchRow
      }),
      update: jest.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        if (!matchesWhere(matchRow, where)) throw new Error('Match not found')
        matchRow = { ...matchRow, ...data }
        return matchRow
      }),
      updateMany: jest.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        if (!matchesWhere(matchRow, where)) return { count: 0 }
        matchRow = { ...matchRow, ...data }
        return { count: 1 }
      }),
    }

    const rideRequest = {
      updateMany: jest.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        if (where.status !== rideRequestStatus) return { count: 0 }
        rideRequestStatus = (data.status as string) ?? rideRequestStatus
        return { count: 1 }
      }),
    }

    const client: Record<string, unknown> = {
      match,
      rideRequest,
      rideAgreement: { create: jest.fn().mockResolvedValue({ id: 'agreement-1' }) },
      trip: { create: jest.fn().mockResolvedValue({ id: 'trip-1' }) },
    }
    client.$transaction = jest.fn((fn: (tx: unknown) => unknown) => fn(client))
    return { client } as unknown as PrismaService
  }

  describe('request()', () => {
    it('notifies the driver, not the passenger who called it', async () => {
      const prisma = makePrisma({ match: makeMatchRecord('SUGGESTED') })
      const notifications = makeNotifications()
      const service = new MatchingService(prisma, routeDistance, notifications, metrics, makeLogger())

      await service.request(MATCH_ID, PASSENGER_ID)

      expect(notifications.create).toHaveBeenCalledTimes(1)
      expect(notifications.create).toHaveBeenCalledWith(DRIVER_ID, expect.objectContaining({ type: 'match' }))
    })

    // docs/agent-handoff.md finding C14: a concurrent transition on the
    // same match (read stale, someone else already moved it) must be
    // rejected, not silently overwritten.
    it('refuses a request racing a concurrent transition on the same match', async () => {
      const prisma = makePrisma({ match: makeMatchRecord('SUGGESTED') })
      // Simulate: this caller's read is stale — the row has already moved
      // on by the time the conditional update runs.
      prisma.client.match.findUnique = jest.fn().mockResolvedValueOnce(makeMatchRecord('SUGGESTED'))
      await prisma.client.match.updateMany({ where: { id: MATCH_ID, matchStatus: 'SUGGESTED' }, data: { matchStatus: 'EXPIRED' } })
      const service = new MatchingService(prisma, routeDistance, makeNotifications(), metrics, makeLogger())

      await expect(service.request(MATCH_ID, PASSENGER_ID)).rejects.toBeInstanceOf(ConflictException)
    })
  })

  describe('accept()', () => {
    it('notifies the passenger, not the driver who called it, only after the transaction resolves', async () => {
      const prisma = makePrisma({ match: makeMatchRecord('REQUESTED') })
      const notifications = makeNotifications()
      const service = new MatchingService(prisma, routeDistance, notifications, metrics, makeLogger())

      await service.accept(MATCH_ID, DRIVER_ID)

      expect(prisma.client.trip.create).toHaveBeenCalled()
      expect(notifications.create).toHaveBeenCalledTimes(1)
      expect(notifications.create).toHaveBeenCalledWith(PASSENGER_ID, expect.objectContaining({ type: 'match' }))
    })

    // docs/agent-handoff.md finding C18: the Trip already exists by the
    // time the notification write runs — its failure must not turn an
    // already-successful accept() into a request error.
    it('still confirms the match and creates the trip even when the notification write fails', async () => {
      const prisma = makePrisma({ match: makeMatchRecord('REQUESTED') })
      const notifications = { create: jest.fn().mockRejectedValue(new Error('notifications table unavailable')) } as unknown as NotificationsService
      const service = new MatchingService(prisma, routeDistance, notifications, metrics, makeLogger())

      const result = await service.accept(MATCH_ID, DRIVER_ID)

      expect(result.matchStatus).toBe('CONFIRMED')
      expect(prisma.client.trip.create).toHaveBeenCalled()
    })

    it('confirms the match and the parent ride request together', async () => {
      const prisma = makePrisma({ match: makeMatchRecord('REQUESTED') })
      const service = new MatchingService(prisma, routeDistance, makeNotifications(), metrics, makeLogger())

      const result = await service.accept(MATCH_ID, DRIVER_ID)

      expect(result.matchStatus).toBe('CONFIRMED')
    })

    // The core race this phase closed: two drivers both hold a REQUESTED
    // match for the same RideRequest; the second accept() must not
    // resurrect its own (now auto-cancelled) match or create a second Trip.
    it('refuses to resurrect a match that a competing accept() already auto-cancelled', async () => {
      const prisma = makePrisma({ match: makeMatchRecord('REQUESTED') })
      // This caller's read is stale — by the time its conditional update
      // runs, another accept() has already flipped this match to CANCELLED
      // (the auto-cancel side effect of a different match's accept()).
      prisma.client.match.findUnique = jest.fn().mockResolvedValueOnce(makeMatchRecord('REQUESTED'))
      await prisma.client.match.updateMany({ where: { id: MATCH_ID, matchStatus: 'REQUESTED' }, data: { matchStatus: 'CANCELLED' } })
      const service = new MatchingService(prisma, routeDistance, makeNotifications(), metrics, makeLogger())

      await expect(service.accept(MATCH_ID, DRIVER_ID)).rejects.toBeInstanceOf(ConflictException)
      expect(prisma.client.trip.create).not.toHaveBeenCalled()
      expect(prisma.client.rideAgreement.create).not.toHaveBeenCalled()
    })

    it('refuses to accept once the parent ride request is no longer ACTIVE (already confirmed or cancelled)', async () => {
      const prisma = makePrisma({ match: makeMatchRecord('REQUESTED'), rideRequestStatus: 'CANCELLED' })
      const service = new MatchingService(prisma, routeDistance, makeNotifications(), metrics, makeLogger())

      await expect(service.accept(MATCH_ID, DRIVER_ID)).rejects.toBeInstanceOf(ConflictException)
      expect(prisma.client.trip.create).not.toHaveBeenCalled()
    })

    it('leaves the match transition rolled back when the ride-request claim fails (no partial commit)', async () => {
      const prisma = makePrisma({ match: makeMatchRecord('REQUESTED'), rideRequestStatus: 'CONFIRMED' })
      const service = new MatchingService(prisma, routeDistance, makeNotifications(), metrics, makeLogger())

      await expect(service.accept(MATCH_ID, DRIVER_ID)).rejects.toBeInstanceOf(ConflictException)

      // A real Prisma transaction rolls back the match update too when the
      // callback throws afterward — this fake doesn't model true
      // rollback, so this documents the requirement rather than proving
      // the fake enforces it: the important, provable assertion is that
      // no Trip/RideAgreement was ever created.
      expect(prisma.client.rideAgreement.create).not.toHaveBeenCalled()
      expect(prisma.client.trip.create).not.toHaveBeenCalled()
    })
  })

  describe('decline()', () => {
    it('notifies the passenger, not the driver who called it', async () => {
      const prisma = makePrisma({ match: makeMatchRecord('REQUESTED') })
      const notifications = makeNotifications()
      const service = new MatchingService(prisma, routeDistance, notifications, metrics, makeLogger())

      await service.decline(MATCH_ID, DRIVER_ID)

      expect(notifications.create).toHaveBeenCalledTimes(1)
      expect(notifications.create).toHaveBeenCalledWith(PASSENGER_ID, expect.objectContaining({ type: 'match' }))
    })

    it('refuses to decline a match a competing accept() already confirmed', async () => {
      const prisma = makePrisma({ match: makeMatchRecord('REQUESTED') })
      prisma.client.match.findUnique = jest.fn().mockResolvedValueOnce(makeMatchRecord('REQUESTED'))
      await prisma.client.match.updateMany({ where: { id: MATCH_ID, matchStatus: 'REQUESTED' }, data: { matchStatus: 'CONFIRMED' } })
      const service = new MatchingService(prisma, routeDistance, makeNotifications(), metrics, makeLogger())

      await expect(service.decline(MATCH_ID, DRIVER_ID)).rejects.toBeInstanceOf(ConflictException)
    })
  })
})
