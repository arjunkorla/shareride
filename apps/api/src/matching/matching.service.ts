import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { GeoPoint, Match } from '@shareride/types'
import type { MatchWithOfferSummary, MatchWithRequestSummary } from '@shareride/api-client'
import { PrismaService } from '../common/prisma/prisma.service'
import { MetricsService } from '../common/metrics/metrics.service'
import { StructuredLogger } from '../common/logger/structured-logger.service'
import { NotificationsService } from '../notifications/notifications.service'
import { RouteDistanceService } from './route-distance.service'
import { combineScore, computeProximityScore, computeRouteCompatibility, computeTimeCompatibility, MIN_CANDIDATE_SCORE } from './matching-score.util'
import { canAccept, canDecline, canRequest } from './match-transitions.util'

// PostGIS proximity filter radius for "worth scoring at all" — generous on
// purpose, since matching-score.util.ts's own PROXIMITY_ZERO_METERS (3000m)
// already does the finer-grained scoring once a candidate passes this.
const CANDIDATE_RADIUS_METERS = 5000

// Matches that were never acted on by the time this one gets accepted — the
// passenger only needs one ride, so any other candidate for the same
// request is no longer relevant. CANCELLED (not DECLINED) because no
// driver actually made a decision on them.
const AUTO_CANCEL_ON_ACCEPT_STATUSES = ['SUGGESTED', 'REQUESTED'] as const

interface CandidateRow {
  id: string
}

interface PointRow {
  originLat: number
  originLng: number
  destinationLat: number
  destinationLng: number
}

// Standalone matching engine (docs/migration-plan.md Phase 7 + 8):
// - Phase 7: given a RideRequest, finds nearby ACTIVE RideOffers via a
//   PostGIS ST_DWithin proximity query, scores each candidate (route
//   detour, schedule overlap, pickup/drop-off distance — see
//   matching-score.util.ts), and persists the result as a `Match` row.
//   Symmetric in the other direction for a RideOffer.
// - Phase 8: request/accept/decline transitions on top of those matches.
//   Accepting creates a RideAgreement + Trip atomically and cancels the
//   request's other pending candidates — see accept() below for why
//   RideOffer.status is deliberately left untouched.
@Injectable()
export class MatchingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly routeDistance: RouteDistanceService,
    private readonly notifications: NotificationsService,
    private readonly metrics: MetricsService,
    private readonly logger: StructuredLogger,
  ) {
    this.logger.setContext(MatchingService.name)
  }

  // Best-effort, isolated from the caller's response — the domain write
  // this follows already committed, so a notification failure must not
  // turn an already-successful request/accept/decline into a request
  // error (accept() specifically: the Trip already exists by the time
  // this runs). See docs/agent-handoff.md finding C18.
  private async notifyBestEffort(userId: string, payload: Parameters<NotificationsService['create']>[1]): Promise<void> {
    try {
      await this.notifications.create(userId, payload)
    } catch (error) {
      this.logger.error('Failed to create a match notification', (error as Error).stack, { userId })
    }
  }

  async findForRideRequest(rideRequestId: string, passengerId: string): Promise<MatchWithOfferSummary[]> {
    const endTimer = this.metrics.matchingRunDurationSeconds.startTimer({ for: 'ride_request' })
    try {
      return await this.findForRideRequestUntimed(rideRequestId, passengerId)
    } finally {
      endTimer()
    }
  }

  private async findForRideRequestUntimed(rideRequestId: string, passengerId: string): Promise<MatchWithOfferSummary[]> {
    const request = await this.prisma.client.rideRequest.findUnique({ where: { id: rideRequestId } })
    if (!request || request.passengerId !== passengerId) {
      throw new NotFoundException('Ride request not found')
    }
    const requestPoint = await this.getPoint('ride_requests', rideRequestId)
    const preferredDate = request.preferredDate.toISOString().slice(0, 10)

    const candidates = await this.prisma.client.$queryRaw<CandidateRow[]>`
      SELECT id FROM public.ride_offers
      WHERE status = 'ACTIVE'
        AND "departureDate" = ${preferredDate}::date
        AND extensions.ST_DWithin(
          "originCoordinates"::extensions.geography,
          extensions.ST_SetSRID(extensions.ST_MakePoint(${requestPoint.originLng}, ${requestPoint.originLat}), 4326)::extensions.geography,
          ${CANDIDATE_RADIUS_METERS}
        )
        AND extensions.ST_DWithin(
          "destinationCoordinates"::extensions.geography,
          extensions.ST_SetSRID(extensions.ST_MakePoint(${requestPoint.destinationLng}, ${requestPoint.destinationLat}), 4326)::extensions.geography,
          ${CANDIDATE_RADIUS_METERS}
        )
    `

    const matches: MatchWithOfferSummary[] = []
    for (const { id: rideOfferId } of candidates) {
      const offer = await this.prisma.client.rideOffer.findUnique({ where: { id: rideOfferId }, include: { driver: true } })
      if (!offer) continue
      const offerPoint = await this.getPoint('ride_offers', rideOfferId)

      const match = await this.scoreAndUpsert({
        rideRequestId,
        rideOfferId,
        requestOrigin: { lat: requestPoint.originLat, lng: requestPoint.originLng },
        requestDestination: { lat: requestPoint.destinationLat, lng: requestPoint.destinationLng },
        offerOrigin: { lat: offerPoint.originLat, lng: offerPoint.originLng },
        offerDestination: { lat: offerPoint.destinationLat, lng: offerPoint.destinationLng },
        preferredDate,
        preferredTimeStart: request.preferredTimeStart,
        preferredTimeEnd: request.preferredTimeEnd,
        candidateDate: offer.departureDate.toISOString().slice(0, 10),
        candidateTime: offer.departureTime,
      })
      if (match) {
        matches.push({
          ...match,
          offer: {
            driverId: offer.driverId,
            origin: offer.origin,
            destination: offer.destination,
            departureDate: offer.departureDate.toISOString().slice(0, 10),
            departureTime: offer.departureTime,
            pricePerPerson: offer.pricePerPerson.toNumber(),
            driverName: offer.driver.fullName,
          },
        })
      }
    }
    return matches.sort((a, b) => b.routeCompatibility - a.routeCompatibility)
  }

  async findForRideOffer(rideOfferId: string, driverId: string): Promise<MatchWithRequestSummary[]> {
    const endTimer = this.metrics.matchingRunDurationSeconds.startTimer({ for: 'ride_offer' })
    try {
      return await this.findForRideOfferUntimed(rideOfferId, driverId)
    } finally {
      endTimer()
    }
  }

  private async findForRideOfferUntimed(rideOfferId: string, driverId: string): Promise<MatchWithRequestSummary[]> {
    const offer = await this.prisma.client.rideOffer.findUnique({ where: { id: rideOfferId } })
    if (!offer || offer.driverId !== driverId) {
      throw new NotFoundException('Ride offer not found')
    }
    const offerPoint = await this.getPoint('ride_offers', rideOfferId)
    const departureDate = offer.departureDate.toISOString().slice(0, 10)

    const candidates = await this.prisma.client.$queryRaw<CandidateRow[]>`
      SELECT id FROM public.ride_requests
      WHERE status = 'ACTIVE'
        AND "preferredDate" = ${departureDate}::date
        AND extensions.ST_DWithin(
          "originCoordinates"::extensions.geography,
          extensions.ST_SetSRID(extensions.ST_MakePoint(${offerPoint.originLng}, ${offerPoint.originLat}), 4326)::extensions.geography,
          ${CANDIDATE_RADIUS_METERS}
        )
        AND extensions.ST_DWithin(
          "destinationCoordinates"::extensions.geography,
          extensions.ST_SetSRID(extensions.ST_MakePoint(${offerPoint.destinationLng}, ${offerPoint.destinationLat}), 4326)::extensions.geography,
          ${CANDIDATE_RADIUS_METERS}
        )
    `

    const matches: MatchWithRequestSummary[] = []
    for (const { id: rideRequestId } of candidates) {
      const request = await this.prisma.client.rideRequest.findUnique({ where: { id: rideRequestId }, include: { passenger: true } })
      if (!request) continue
      const requestPoint = await this.getPoint('ride_requests', rideRequestId)

      const match = await this.scoreAndUpsert({
        rideRequestId,
        rideOfferId,
        requestOrigin: { lat: requestPoint.originLat, lng: requestPoint.originLng },
        requestDestination: { lat: requestPoint.destinationLat, lng: requestPoint.destinationLng },
        offerOrigin: { lat: offerPoint.originLat, lng: offerPoint.originLng },
        offerDestination: { lat: offerPoint.destinationLat, lng: offerPoint.destinationLng },
        preferredDate: request.preferredDate.toISOString().slice(0, 10),
        preferredTimeStart: request.preferredTimeStart,
        preferredTimeEnd: request.preferredTimeEnd,
        candidateDate: departureDate,
        candidateTime: offer.departureTime,
      })
      if (match) {
        matches.push({
          ...match,
          request: {
            passengerId: request.passengerId,
            origin: request.origin,
            destination: request.destination,
            preferredDate: request.preferredDate.toISOString().slice(0, 10),
            preferredTimeStart: request.preferredTimeStart,
            preferredTimeEnd: request.preferredTimeEnd,
            passengerName: request.passenger.fullName,
          },
        })
      }
    }
    return matches.sort((a, b) => b.routeCompatibility - a.routeCompatibility)
  }

  async get(id: string, userId: string): Promise<Match> {
    const record = await this.prisma.client.match.findUnique({
      where: { id },
      include: { rideRequest: true, rideOffer: true },
    })
    if (!record || (record.rideRequest.passengerId !== userId && record.rideOffer.driverId !== userId)) {
      throw new ForbiddenException('You do not have access to this match')
    }
    return this.toMatch(record)
  }

  // Passenger explicitly requests a specific SUGGESTED candidate — the
  // "Send Request" action on RideDetailScreen.
  //
  // The transition is conditioned on the exact status just read (a
  // conditional `updateMany`, not a bare `update`-by-id) — see accept()'s
  // longer note on why: it's the same "two concurrent callers must not
  // both act on a stale read" concern, applied consistently across every
  // Match transition. See docs/agent-handoff.md finding C14.
  async request(matchId: string, passengerId: string): Promise<Match> {
    const record = await this.prisma.client.match.findUnique({
      where: { id: matchId },
      include: { rideRequest: { include: { passenger: true } }, rideOffer: true },
    })
    if (!record || record.rideRequest.passengerId !== passengerId) {
      throw new NotFoundException('Match not found')
    }
    if (!canRequest(record.matchStatus)) {
      throw new BadRequestException(`Cannot request a match that is already ${record.matchStatus.toLowerCase()}`)
    }
    const claimed = await this.prisma.client.match.updateMany({
      where: { id: matchId, matchStatus: record.matchStatus },
      data: { matchStatus: 'REQUESTED' },
    })
    if (claimed.count !== 1) {
      throw new ConflictException('This match was just updated — please refresh and try again')
    }
    const updated = await this.prisma.client.match.findUniqueOrThrow({ where: { id: matchId } })

    // A single write, not a multi-step transaction, so there's no
    // rollback risk to weigh — persist-then-notify runs immediately after
    // the domain write commits (see accept()'s longer note on this same
    // choice for the transactional case). notifyBestEffort isolates a
    // notification failure from this method's own response.
    await this.notifyBestEffort(record.rideOffer.driverId, {
      type: 'match',
      title: 'New ride match request',
      body: `${record.rideRequest.passenger.fullName} wants to share your ride from ${record.rideOffer.origin} to ${record.rideOffer.destination}`,
      deepLink: '/(tabs)/discover?tab=requests',
    })

    return this.toMatch(updated)
  }

  // Driver accepts a REQUESTED match — the "Accept" button on Discover's
  // Requests tab. This is the "mutual confirmation" the phase brief names:
  // the passenger already requested, the driver now agrees, so the
  // RideAgreement and Trip are created in the same transaction rather than
  // waiting for a separate confirmation step neither app screen has.
  //
  // RideOffer.status is deliberately left ACTIVE, not flipped to MATCHED —
  // per the "no seat capacity, ever" rule, one offer can carry more than
  // one confirmed passenger (the driver decides per request, there's no
  // system-enforced capacity), so accepting one request must not make the
  // offer stop surfacing as a candidate for others.
  //
  // A passenger can have more than one REQUESTED match at once (nothing
  // stops requesting several drivers for the same RideRequest) — two
  // drivers could both call accept() around the same time. Both the Match
  // transition and the parent RideRequest transition are conditioned on
  // the exact status just read (`updateMany` + count check, not a bare
  // `update`-by-id), and a failed condition throws INSIDE the transaction,
  // which rolls back everything else in it (agreement/trip/auto-cancels
  // included) rather than partially applying. Without this, a driver whose
  // match had just been auto-cancelled by the other's accept() could
  // unconditionally resurrect it and create a second Trip for the same
  // request. See docs/agent-handoff.md finding C14.
  async accept(matchId: string, driverId: string): Promise<Match> {
    const record = await this.prisma.client.match.findUnique({
      where: { id: matchId },
      include: { rideRequest: true, rideOffer: { include: { driver: true } } },
    })
    if (!record || record.rideOffer.driverId !== driverId) {
      throw new NotFoundException('Match not found')
    }
    if (!canAccept(record.matchStatus)) {
      throw new BadRequestException(`Cannot accept a match that is already ${record.matchStatus.toLowerCase()}`)
    }

    const scheduledAt = combineDateAndTime(record.rideOffer.departureDate, record.rideOffer.departureTime)

    const updated = await this.prisma.client.$transaction(async (tx) => {
      const claimedMatch = await tx.match.updateMany({
        where: { id: matchId, matchStatus: record.matchStatus },
        data: { matchStatus: 'CONFIRMED' },
      })
      if (claimedMatch.count !== 1) {
        throw new ConflictException('This match was just updated — please refresh and try again')
      }
      const claimedRequest = await tx.rideRequest.updateMany({
        where: { id: record.rideRequestId, status: 'ACTIVE' },
        data: { status: 'CONFIRMED' },
      })
      if (claimedRequest.count !== 1) {
        // The parent request was already confirmed by a competing accept,
        // or cancelled/expired out from under this one — either way,
        // this accept must not proceed (rolls back the match claim above).
        throw new ConflictException('This ride request is no longer available to accept')
      }

      const agreement = await tx.rideAgreement.create({
        data: { matchId, passengerId: record.rideRequest.passengerId, driverId },
      })
      await tx.trip.create({
        data: {
          rideAgreementId: agreement.id,
          passengerId: record.rideRequest.passengerId,
          driverId,
          status: 'CONFIRMED',
          scheduledAt,
        },
      })
      await tx.match.updateMany({
        where: {
          rideRequestId: record.rideRequestId,
          id: { not: matchId },
          matchStatus: { in: [...AUTO_CANCEL_ON_ACCEPT_STATUSES] },
        },
        data: { matchStatus: 'CANCELLED' },
      })
      return tx.match.findUniqueOrThrow({ where: { id: matchId } })
    })

    // Deliberately outside the transaction, not inside it: the domain
    // change (match/agreement/trip/auto-cancels) is the thing that must be
    // atomic, and it already committed by the time we get here. Wrapping
    // the notification write in the same transaction would mean a failed
    // notification insert rolls back a real, already-valid trip — the
    // wrong failure mode for what's a secondary/best-effort concern here.
    // notifyBestEffort (docs/agent-handoff.md finding C18) makes that
    // "still correct, just no push" outcome actually true: a failure here
    // used to still make this whole call throw, turning an
    // already-successful accept (trip and all) into a client-visible
    // error — not one worth an outbox-pattern-style fix for this phase
    // (see "do not over-engineer distributed event infrastructure" in the
    // brief this was scoped from), just isolating it correctly.
    await this.notifyBestEffort(record.rideRequest.passengerId, {
      type: 'match',
      title: 'Your ride match was accepted',
      body: `${record.rideOffer.driver.fullName} accepted your request for ${record.rideOffer.origin} to ${record.rideOffer.destination}`,
      deepLink: `/matches/${record.rideRequestId}`,
    })

    return this.toMatch(updated)
  }

  // Same conditional-transition treatment as request()/accept() — a
  // concurrent accept() on the same match must not have its CONFIRMED
  // silently overwritten by a decline() that read a now-stale REQUESTED
  // snapshot. See docs/agent-handoff.md finding C14.
  async decline(matchId: string, driverId: string): Promise<Match> {
    const record = await this.prisma.client.match.findUnique({
      where: { id: matchId },
      include: { rideRequest: true, rideOffer: { include: { driver: true } } },
    })
    if (!record || record.rideOffer.driverId !== driverId) {
      throw new NotFoundException('Match not found')
    }
    if (!canDecline(record.matchStatus)) {
      throw new BadRequestException(`Cannot decline a match that is already ${record.matchStatus.toLowerCase()}`)
    }
    const claimed = await this.prisma.client.match.updateMany({
      where: { id: matchId, matchStatus: record.matchStatus },
      data: { matchStatus: 'DECLINED' },
    })
    if (claimed.count !== 1) {
      throw new ConflictException('This match was just updated — please refresh and try again')
    }
    const updated = await this.prisma.client.match.findUniqueOrThrow({ where: { id: matchId } })

    await this.notifyBestEffort(record.rideRequest.passengerId, {
      type: 'match',
      title: 'Ride match declined',
      body: `${record.rideOffer.driver.fullName} isn't able to take your request for ${record.rideOffer.origin} to ${record.rideOffer.destination}`,
      deepLink: `/matches/${record.rideRequestId}`,
    })

    return this.toMatch(updated)
  }

  private async scoreAndUpsert(input: {
    rideRequestId: string
    rideOfferId: string
    requestOrigin: GeoPoint
    requestDestination: GeoPoint
    offerOrigin: GeoPoint
    offerDestination: GeoPoint
    preferredDate: string
    preferredTimeStart: string
    preferredTimeEnd: string
    candidateDate: string
    candidateTime: string
  }): Promise<Match | null> {
    const [originDistanceMeters, destinationDistanceMeters, totalRouteMeters] = await Promise.all([
      this.routeDistance.getDrivingDistanceMeters(input.requestOrigin, input.offerOrigin),
      this.routeDistance.getDrivingDistanceMeters(input.requestDestination, input.offerDestination),
      this.routeDistance.getDrivingDistanceMeters(input.offerOrigin, input.offerDestination),
    ])

    const routeCompatibility = computeRouteCompatibility(originDistanceMeters, destinationDistanceMeters, totalRouteMeters)
    const proximityScore = computeProximityScore(originDistanceMeters, destinationDistanceMeters)
    const timeCompatibility = computeTimeCompatibility(
      input.preferredDate,
      input.preferredTimeStart,
      input.preferredTimeEnd,
      input.candidateDate,
      input.candidateTime,
    )
    const score = combineScore(routeCompatibility, timeCompatibility, proximityScore)
    if (score < MIN_CANDIDATE_SCORE) return null

    const expiresAt = new Date(`${input.preferredDate}T00:00:00.000Z`)
    expiresAt.setUTCDate(expiresAt.getUTCDate() + 1)

    const record = await this.prisma.client.match.upsert({
      where: { rideRequestId_rideOfferId: { rideRequestId: input.rideRequestId, rideOfferId: input.rideOfferId } },
      create: {
        rideRequestId: input.rideRequestId,
        rideOfferId: input.rideOfferId,
        matchStatus: 'SUGGESTED',
        originDistanceMeters: Math.round(originDistanceMeters),
        destinationDistanceMeters: Math.round(destinationDistanceMeters),
        routeCompatibility,
        timeCompatibility,
        expiresAt,
      },
      // Never touch matchStatus/expiresAt here — once a passenger/driver has
      // acted on a match, re-running matching must not reset it.
      update: {
        originDistanceMeters: Math.round(originDistanceMeters),
        destinationDistanceMeters: Math.round(destinationDistanceMeters),
        routeCompatibility,
        timeCompatibility,
      },
    })
    return this.toMatch(record)
  }

  private async getPoint(table: 'ride_requests' | 'ride_offers', id: string): Promise<PointRow> {
    const rows = table === 'ride_requests'
      ? await this.prisma.client.$queryRaw<PointRow[]>`
          SELECT
            extensions.ST_Y("originCoordinates"::extensions.geometry) AS "originLat", extensions.ST_X("originCoordinates"::extensions.geometry) AS "originLng",
            extensions.ST_Y("destinationCoordinates"::extensions.geometry) AS "destinationLat", extensions.ST_X("destinationCoordinates"::extensions.geometry) AS "destinationLng"
          FROM public.ride_requests WHERE id = ${id}
        `
      : await this.prisma.client.$queryRaw<PointRow[]>`
          SELECT
            extensions.ST_Y("originCoordinates"::extensions.geometry) AS "originLat", extensions.ST_X("originCoordinates"::extensions.geometry) AS "originLng",
            extensions.ST_Y("destinationCoordinates"::extensions.geometry) AS "destinationLat", extensions.ST_X("destinationCoordinates"::extensions.geometry) AS "destinationLng"
          FROM public.ride_offers WHERE id = ${id}
        `

    if (rows.length === 0) {
      throw new NotFoundException(`${table === 'ride_requests' ? 'Ride request' : 'Ride offer'} not found`)
    }
    return rows[0]
  }

  private toMatch(record: {
    id: string
    rideRequestId: string
    rideOfferId: string
    matchStatus: string
    originDistanceMeters: number
    destinationDistanceMeters: number
    routeCompatibility: { toNumber: () => number }
    timeCompatibility: { toNumber: () => number }
    createdAt: Date
    updatedAt: Date
    expiresAt: Date
  }): Match {
    return {
      id: record.id,
      rideRequestId: record.rideRequestId,
      rideOfferId: record.rideOfferId,
      matchStatus: record.matchStatus as Match['matchStatus'],
      originDistanceMeters: record.originDistanceMeters,
      destinationDistanceMeters: record.destinationDistanceMeters,
      routeCompatibility: record.routeCompatibility.toNumber(),
      timeCompatibility: record.timeCompatibility.toNumber(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
    }
  }
}

function combineDateAndTime(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number)
  const combined = new Date(date)
  combined.setUTCHours(hours, minutes, 0, 0)
  return combined
}
