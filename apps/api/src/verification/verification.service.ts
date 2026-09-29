import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import type { DriverProfile, Vehicle } from '@shareride/types'
import { PrismaService } from '../common/prisma/prisma.service'

// Resubmission is only meaningful from these states — SUBMITTED/
// UNDER_REVIEW already has a pending review in flight, and APPROVED needs
// no action. ACTION_REQUIRED/REJECTED/NOT_STARTED are exactly the states
// where "the driver needs to do something" applies.
const RESUBMITTABLE = new Set(['NOT_STARTED', 'REJECTED', 'ACTION_REQUIRED'])

export interface OwnVerificationStatus {
  driver: DriverProfile
  vehicles: Vehicle[]
}

// The mobile client can only ever move its own DriverProfile into
// SUBMITTED — every other transition (APPROVED/REJECTED/ACTION_REQUIRED)
// is admin-only, already implemented in
// apps/api/src/admin/drivers/drivers.controller.ts. There is no document
// upload here: no object storage is configured in this environment (see
// docs/migration-plan.md Phase 10), so this is the workflow boundary
// only — submit-for-review, not submit-a-file.
@Injectable()
export class VerificationService {
  constructor(private readonly prisma: PrismaService) {}

  async submitDriverVerification(userId: string): Promise<DriverProfile> {
    const profile = await this.prisma.client.driverProfile.findUnique({ where: { userId } })
    if (!profile) throw new NotFoundException('Driver profile not found')
    if (!RESUBMITTABLE.has(profile.verificationStatus)) {
      throw new BadRequestException(`Cannot submit while verification is ${profile.verificationStatus.toLowerCase()}`)
    }

    const updated = await this.prisma.client.driverProfile.update({
      where: { userId },
      data: { verificationStatus: 'SUBMITTED', verificationNote: null },
    })
    return this.toDriverProfile(updated)
  }

  async getOwn(userId: string): Promise<OwnVerificationStatus> {
    const [profile, vehicles] = await Promise.all([
      this.prisma.client.driverProfile.findUnique({ where: { userId } }),
      this.prisma.client.vehicle.findMany({ where: { driverId: userId }, orderBy: { createdAt: 'desc' } }),
    ])
    if (!profile) throw new NotFoundException('Driver profile not found')

    return {
      driver: this.toDriverProfile(profile),
      vehicles: vehicles.map((v) => this.toVehicle(v)),
    }
  }

  private toDriverProfile(record: {
    userId: string
    bio: string | null
    languages: string[]
    yearsActive: number
    verificationStatus: string
    rating: { toNumber: () => number }
    totalTrips: number
  }): DriverProfile {
    return {
      userId: record.userId,
      bio: record.bio ?? undefined,
      languages: record.languages,
      yearsActive: record.yearsActive,
      verificationStatus: record.verificationStatus as DriverProfile['verificationStatus'],
      rating: record.rating.toNumber(),
      totalTrips: record.totalTrips,
    }
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
