import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { Trip } from '@shareride/types'
import type { TripWithDetails } from '@shareride/api-client'
import type { TripStatus } from '@shareride/database'
import { PrismaService } from '../common/prisma/prisma.service'

interface TripRecord {
  id: string
  rideAgreementId: string
  passengerId: string
  driverId: string
  status: string
  scheduledAt: Date
  startedAt: Date | null
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED'])

// Minimal, deliberately not the full live-tracking lifecycle
// (DRIVER_ARRIVING/AT_PICKUP/STARTED/ONGOING — that needs real location
// data ride-tracking.tsx doesn't have, see docs/migration-plan.md Phase
// 10). Just enough for Phase 10D (Reviews) to have a genuine completed
// Trip to check eligibility against, rather than trusting the client.
@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<TripWithDetails[]> {
    const records = await this.prisma.client.trip.findMany({
      where: { OR: [{ passengerId: userId }, { driverId: userId }] },
      orderBy: { scheduledAt: 'desc' },
    })
    return Promise.all(records.map((r) => this.enrich(r)))
  }

  async get(id: string, userId: string): Promise<TripWithDetails> {
    const record = await this.findOwned(id, userId)
    return this.enrich(record)
  }

  // Either participant can mark a trip complete — there's no live
  // tracking to drive this automatically, so it's an honest manual
  // action, not a fabricated GPS-arrival signal. Bumps both
  // participants' DriverProfile/PassengerProfile.totalTrips exactly once
  // — enforced by conditioning the actual update on the exact status just
  // read (`updateMany` + count check), not just the pre-transaction
  // terminal-status check above it. Both participants tapping "mark
  // complete" within the same moment previously could both pass that
  // early check (reading the same pre-transaction snapshot) and then both
  // run their own full transaction, double-counting totalTrips and
  // logging two trip_completed events. See docs/agent-handoff.md finding
  // C16.
  async complete(id: string, userId: string): Promise<TripWithDetails> {
    const record = await this.findOwned(id, userId)
    if (TERMINAL_STATUSES.has(record.status)) {
      throw new BadRequestException(`Trip is already ${record.status.toLowerCase()}`)
    }

    const completedAt = new Date()
    const updated = await this.prisma.client.$transaction(async (tx) => {
      const claimed = await tx.trip.updateMany({
        where: { id, status: record.status as TripStatus },
        data: { status: 'COMPLETED', completedAt },
      })
      if (claimed.count !== 1) {
        throw new BadRequestException('Trip is already completed or cancelled')
      }
      await tx.tripEvent.create({ data: { tripId: id, type: 'trip_completed' } })
      await tx.driverProfile.updateMany({ where: { userId: record.driverId }, data: { totalTrips: { increment: 1 } } })
      await tx.passengerProfile.updateMany({ where: { userId: record.passengerId }, data: { totalTrips: { increment: 1 } } })
      return tx.trip.findUniqueOrThrow({ where: { id } })
    })

    return this.enrich(updated)
  }

  private async findOwned(id: string, userId: string): Promise<TripRecord> {
    const record = await this.prisma.client.trip.findUnique({ where: { id } })
    if (!record || (record.passengerId !== userId && record.driverId !== userId)) {
      throw new NotFoundException('Trip not found')
    }
    return record
  }

  // One extra pair of queries per trip (agreement→match→offer, plus the
  // two participant names) — same "server already needs this to render a
  // useful card, return it together" reasoning as Phase 8's
  // MatchWithOfferSummary, and the same per-row-query style
  // MatchingService/ChatService already use elsewhere in this codebase.
  private async enrich(record: TripRecord): Promise<TripWithDetails> {
    const [agreement, driver, passenger] = await Promise.all([
      this.prisma.client.rideAgreement.findUnique({
        where: { id: record.rideAgreementId },
        include: { match: { include: { rideOffer: true } } },
      }),
      this.prisma.client.user.findUnique({ where: { id: record.driverId }, select: { fullName: true, avatarUrl: true } }),
      this.prisma.client.user.findUnique({ where: { id: record.passengerId }, select: { fullName: true, avatarUrl: true } }),
    ])
    const offer = agreement?.match.rideOffer

    return {
      ...this.toTrip(record),
      route: offer ? { origin: offer.origin, destination: offer.destination, pricePerPerson: offer.pricePerPerson.toNumber() } : null,
      driver: { fullName: driver?.fullName ?? 'Driver', avatarUrl: driver?.avatarUrl ?? undefined },
      passenger: { fullName: passenger?.fullName ?? 'Passenger', avatarUrl: passenger?.avatarUrl ?? undefined },
    }
  }

  private toTrip(record: TripRecord): Trip {
    return {
      id: record.id,
      rideAgreementId: record.rideAgreementId,
      passengerId: record.passengerId,
      driverId: record.driverId,
      status: record.status as Trip['status'],
      scheduledAt: record.scheduledAt.toISOString(),
      startedAt: record.startedAt?.toISOString(),
      completedAt: record.completedAt?.toISOString(),
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }
  }
}
