import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@shareride/database'
import type { Vehicle } from '@shareride/types'
import type { CreateVehicleInput, UpdateVehicleInput } from '@shareride/validation'
import { PrismaService } from '../common/prisma/prisma.service'

const EDITABLE_FIELDS = ['make', 'model', 'year', 'color', 'fuelType', 'registrationNumber'] as const

// Minimal vehicle registration so a driver has a real vehicleId to attach a
// RideOffer to (Phase 6) — no PostGIS columns on this model, so this is
// plain typed Prisma throughout, unlike rides/ride-*.service.ts. Phase 10
// added update/deactivate and re-review-on-edit.
@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(driverId: string, input: CreateVehicleInput): Promise<Vehicle> {
    try {
      const vehicle = await this.prisma.client.vehicle.create({
        data: { driverId, ...input },
      })
      return this.toVehicle(vehicle)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A vehicle with this registration number already exists')
      }
      throw error
    }
  }

  async list(driverId: string): Promise<Vehicle[]> {
    const vehicles = await this.prisma.client.vehicle.findMany({
      where: { driverId },
      orderBy: { createdAt: 'desc' },
    })
    return vehicles.map((v) => this.toVehicle(v))
  }

  // Editing an already-APPROVED vehicle's actual details (not just
  // toggling ac) resets it to NOT_STARTED and re-enters the admin queue —
  // otherwise a driver could get a vehicle approved, then silently swap
  // in a different registration number under an already-trusted status.
  async update(id: string, driverId: string, input: UpdateVehicleInput): Promise<Vehicle> {
    const existing = await this.findOwned(id, driverId)
    const changedEditableField = EDITABLE_FIELDS.some(
      (field) => field in input && input[field] !== undefined && input[field] !== existing[field],
    )
    const needsReReview = changedEditableField && existing.verificationStatus === 'APPROVED'

    try {
      const updated = await this.prisma.client.vehicle.update({
        where: { id },
        data: {
          ...input,
          ...(needsReReview ? { verificationStatus: 'NOT_STARTED' as const, verificationNote: 'Re-review required after vehicle details changed' } : {}),
        },
      })
      return this.toVehicle(updated)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A vehicle with this registration number already exists')
      }
      throw error
    }
  }

  // Soft — see schema.prisma's comment on Vehicle.isActive. Refuses to
  // deactivate a vehicle currently attached to an ACTIVE RideOffer rather
  // than silently pulling it out from under a live offer.
  async deactivate(id: string, driverId: string): Promise<Vehicle> {
    await this.findOwned(id, driverId)
    const activeOfferCount = await this.prisma.client.rideOffer.count({
      where: { vehicleId: id, status: 'ACTIVE' },
    })
    if (activeOfferCount > 0) {
      throw new ForbiddenException('Cancel or complete this vehicle\'s active ride offers before deactivating it')
    }
    const updated = await this.prisma.client.vehicle.update({ where: { id }, data: { isActive: false } })
    return this.toVehicle(updated)
  }

  private async findOwned(id: string, driverId: string) {
    const record = await this.prisma.client.vehicle.findUnique({ where: { id } })
    if (!record || record.driverId !== driverId) {
      throw new NotFoundException('Vehicle not found')
    }
    return record
  }

  private toVehicle(record: {
    id: string
    driverId: string
    make: string
    model: string
    year: number
    color: string
    fuelType: string
    registrationNumber: string
    ac: boolean
    verificationStatus: string
    verificationNote: string | null
    photoUrl: string | null
    isActive: boolean
  }): Vehicle {
    return {
      id: record.id,
      driverId: record.driverId,
      make: record.make,
      model: record.model,
      year: record.year,
      color: record.color,
      fuelType: record.fuelType as Vehicle['fuelType'],
      registrationNumber: record.registrationNumber,
      ac: record.ac,
      verificationStatus: record.verificationStatus as Vehicle['verificationStatus'],
      verificationNote: record.verificationNote ?? undefined,
      photoUrl: record.photoUrl ?? undefined,
      isActive: record.isActive,
    }
  }
}
