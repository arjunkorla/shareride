import { randomUUID } from 'node:crypto'
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { RideOffer as RideOfferModel } from '@shareride/database'
import type { CreateRideOfferInput } from '@shareride/validation'
import type { GeoPoint, RideOffer, RidePreferences } from '@shareride/types'
import { PrismaService } from '../common/prisma/prisma.service'

interface CoordinatesRow {
  id: string
  originLat: number
  originLng: number
  destinationLat: number
  destinationLng: number
}

const CANCELLABLE_STATUSES = new Set(['ACTIVE', 'MATCHED'])

// Same shape as ride-requests.service.ts, for RideOffer instead of
// RideRequest — see that file's comment for why coordinates go through raw
// SQL while everything else uses the typed Prisma client.
@Injectable()
export class RideOffersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(driverId: string, input: CreateRideOfferInput): Promise<RideOffer> {
    const vehicle = await this.prisma.client.vehicle.findUnique({ where: { id: input.vehicleId } })
    if (!vehicle || vehicle.driverId !== driverId) {
      throw new ForbiddenException('You can only offer a ride using your own vehicle')
    }
    // A deactivated vehicle (VehiclesService.deactivate — soft-deactivation,
    // see that model's own comment) must not be usable for a new offer;
    // only its own existing offers were ever refused deactivation, offer
    // creation itself never checked this. See docs/agent-handoff.md
    // finding C17.
    if (!vehicle.isActive) {
      throw new BadRequestException('This vehicle is deactivated and cannot be used for a new ride offer')
    }

    const id = randomUUID()
    const expiresAt = computeExpiresAt(input.departureDate)

    await this.prisma.client.$executeRaw`
      INSERT INTO public.ride_offers (
        id, "driverId", "vehicleId", origin, destination,
        "originCoordinates", "destinationCoordinates",
        "departureDate", "departureTime", stops, "pricePerPerson",
        preferences, notes, status, "createdAt", "updatedAt", "expiresAt"
      ) VALUES (
        ${id}, ${driverId}, ${input.vehicleId}, ${input.origin}, ${input.destination},
        extensions.ST_SetSRID(extensions.ST_MakePoint(${input.originCoordinates.lng}, ${input.originCoordinates.lat}), 4326),
        extensions.ST_SetSRID(extensions.ST_MakePoint(${input.destinationCoordinates.lng}, ${input.destinationCoordinates.lat}), 4326),
        ${input.departureDate}::date, ${input.departureTime}, ${input.stops ?? []}::text[],
        ${input.pricePerPerson},
        ${JSON.stringify(input.preferences ?? {})}::jsonb, ${input.notes ?? null}, 'ACTIVE', now(), now(), ${expiresAt}
      )
    `

    return this.get(id, driverId)
  }

  async list(driverId: string): Promise<RideOffer[]> {
    const records = await this.prisma.client.rideOffer.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
    })
    const coordinates = await this.getCoordinates(records.map((r) => r.id))
    return records.map((record) => this.toRideOffer(record, coordinates.get(record.id)))
  }

  async get(id: string, driverId: string): Promise<RideOffer> {
    const record = await this.findOwned(id, driverId)
    const coordinates = await this.getCoordinates([id])
    return this.toRideOffer(record, coordinates.get(id))
  }

  async cancel(id: string, driverId: string): Promise<RideOffer> {
    const record = await this.findOwned(id, driverId)
    if (!CANCELLABLE_STATUSES.has(record.status)) {
      throw new BadRequestException(`Cannot cancel a ride offer that is already ${record.status.toLowerCase()}`)
    }
    await this.prisma.client.rideOffer.update({ where: { id }, data: { status: 'CANCELLED' } })
    return this.get(id, driverId)
  }

  private async findOwned(id: string, driverId: string): Promise<RideOfferModel> {
    const record = await this.prisma.client.rideOffer.findUnique({ where: { id } })
    if (!record || record.driverId !== driverId) {
      throw new NotFoundException('Ride offer not found')
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
      FROM public.ride_offers
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

  private toRideOffer(record: RideOfferModel, coordinates?: { origin: GeoPoint; destination: GeoPoint }): RideOffer {
    if (!coordinates) {
      throw new NotFoundException('Ride offer not found')
    }
    return {
      id: record.id,
      driverId: record.driverId,
      vehicleId: record.vehicleId,
      origin: record.origin,
      destination: record.destination,
      originCoordinates: coordinates.origin,
      destinationCoordinates: coordinates.destination,
      departureDate: record.departureDate.toISOString().slice(0, 10),
      departureTime: record.departureTime,
      stops: record.stops,
      pricePerPerson: record.pricePerPerson.toNumber(),
      preferences: (record.preferences ?? {}) as RidePreferences,
      notes: record.notes ?? undefined,
      status: record.status,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      expiresAt: record.expiresAt.toISOString(),
    }
  }
}

// Same placeholder lifecycle rule as ride-requests.service.ts: expires the
// day after departure until Phase 7's matching engine drives real expiry.
function computeExpiresAt(departureDate: string): Date {
  const date = new Date(`${departureDate}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + 1)
  return date
}
