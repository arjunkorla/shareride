import { randomUUID } from 'node:crypto'
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { RideRequest as RideRequestModel } from '@shareride/database'
import type { CreateRideRequestInput } from '@shareride/validation'
import type { GeoPoint, RidePreferences, RideRequest } from '@shareride/types'
import { PrismaService } from '../common/prisma/prisma.service'

interface CoordinatesRow {
  id: string
  originLat: number
  originLng: number
  destinationLat: number
  destinationLng: number
}

const CANCELLABLE_STATUSES = new Set(['ACTIVE', 'MATCHED'])

// RideRequest.originCoordinates/destinationCoordinates are PostGIS
// `geometry(Point,4326)` columns, which Prisma Client treats as
// Unsupported — it can write and read every other column on this model
// through the normal typed client, but never those two (see
// packages/database/prisma/seed.ts's comment for the same constraint).
// This service therefore reads/writes coordinates via raw SQL
// (ST_MakePoint / ST_X / ST_Y) and everything else via the typed client,
// merging the two into the packages/types `RideRequest` shape the mobile
// app and packages/api-client already expect.
@Injectable()
export class RideRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(passengerId: string, input: CreateRideRequestInput): Promise<RideRequest> {
    const id = randomUUID()
    const expiresAt = computeExpiresAt(input.preferredDate)

    await this.prisma.client.$executeRaw`
      INSERT INTO public.ride_requests (
        id, "passengerId", origin, destination,
        "originCoordinates", "destinationCoordinates",
        "preferredDate", "preferredTimeStart", "preferredTimeEnd",
        preferences, notes, status, "createdAt", "updatedAt", "expiresAt"
      ) VALUES (
        ${id}, ${passengerId}, ${input.origin}, ${input.destination},
        extensions.ST_SetSRID(extensions.ST_MakePoint(${input.originCoordinates.lng}, ${input.originCoordinates.lat}), 4326),
        extensions.ST_SetSRID(extensions.ST_MakePoint(${input.destinationCoordinates.lng}, ${input.destinationCoordinates.lat}), 4326),
        ${input.preferredDate}::date, ${input.preferredTimeStart}, ${input.preferredTimeEnd},
        ${JSON.stringify(input.preferences ?? {})}::jsonb, ${input.notes ?? null}, 'ACTIVE', now(), now(), ${expiresAt}
      )
    `

    return this.get(id, passengerId)
  }

  async list(passengerId: string): Promise<RideRequest[]> {
    const records = await this.prisma.client.rideRequest.findMany({
      where: { passengerId },
      orderBy: { createdAt: 'desc' },
    })
    const coordinates = await this.getCoordinates(records.map((r) => r.id))
    return records.map((record) => this.toRideRequest(record, coordinates.get(record.id)))
  }

  async get(id: string, passengerId: string): Promise<RideRequest> {
    const record = await this.findOwned(id, passengerId)
    const coordinates = await this.getCoordinates([id])
    return this.toRideRequest(record, coordinates.get(id))
  }

  async cancel(id: string, passengerId: string): Promise<RideRequest> {
    const record = await this.findOwned(id, passengerId)
    if (!CANCELLABLE_STATUSES.has(record.status)) {
      throw new BadRequestException(`Cannot cancel a ride request that is already ${record.status.toLowerCase()}`)
    }
    await this.prisma.client.rideRequest.update({ where: { id }, data: { status: 'CANCELLED' } })
    return this.get(id, passengerId)
  }

  private async findOwned(id: string, passengerId: string): Promise<RideRequestModel> {
    const record = await this.prisma.client.rideRequest.findUnique({ where: { id } })
    // Same NotFoundException whether the row is missing or just not this
    // passenger's — a passenger should never learn that a request id
    // belonging to someone else exists.
    if (!record || record.passengerId !== passengerId) {
      throw new NotFoundException('Ride request not found')
    }
    return record
  }

  private async getCoordinates(ids: string[]): Promise<Map<string, { origin: GeoPoint; destination: GeoPoint }>> {
    const map = new Map<string, { origin: GeoPoint; destination: GeoPoint }>()
    if (ids.length === 0) return map

    const rows = await this.prisma.client.$queryRaw<CoordinatesRow[]>`
      SELECT
        id,
        extensions.ST_Y("originCoordinates"::extensions.geometry) AS "originLat",
        extensions.ST_X("originCoordinates"::extensions.geometry) AS "originLng",
        extensions.ST_Y("destinationCoordinates"::extensions.geometry) AS "destinationLat",
        extensions.ST_X("destinationCoordinates"::extensions.geometry) AS "destinationLng"
      FROM public.ride_requests
      WHERE id = ANY(${ids}::text[])
    `
    for (const row of rows) {
      map.set(row.id, {
        origin: { lat: row.originLat, lng: row.originLng },
        destination: { lat: row.destinationLat, lng: row.destinationLng },
      })
    }
    return map
  }

  private toRideRequest(record: RideRequestModel, coordinates?: { origin: GeoPoint; destination: GeoPoint }): RideRequest {
    if (!coordinates) {
      // Only reachable if the geometry columns and the row they belong to
      // fell out of sync, which shouldn't happen given both are written in
      // the same INSERT and neither is ever updated post-creation.
      throw new NotFoundException('Ride request not found')
    }
    return {
      id: record.id,
      passengerId: record.passengerId,
      origin: record.origin,
      destination: record.destination,
      originCoordinates: coordinates.origin,
      destinationCoordinates: coordinates.destination,
      preferredDate: record.preferredDate.toISOString().slice(0, 10),
      preferredTimeStart: record.preferredTimeStart,
      preferredTimeEnd: record.preferredTimeEnd,
      preferences: (record.preferences ?? {}) as RidePreferences,
      notes: record.notes ?? undefined,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
    }
  }
}

// No real expiry/matching logic exists yet (Phase 7), so a request simply
// expires the day after the passenger's requested travel date — a
// placeholder lifecycle rule, not a product decision about how long a
// request should stay open once matching is real.
function computeExpiresAt(preferredDate: string): Date {
  const date = new Date(`${preferredDate}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date
}
