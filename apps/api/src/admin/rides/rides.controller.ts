import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../../auth/types/authenticated-user'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AuditService } from '../../common/audit/audit.service'
import { PaginationQueryDto } from '../dto/pagination.dto'

class CancelTripDto {
  @IsOptional()
  @IsString()
  reason?: string
}

const PASSENGER_SELECT = { select: { fullName: true, phone: true } }
const DRIVER_SELECT = { select: { fullName: true, phone: true } }

@ApiTags('admin/rides')
@ApiBearerAuth()
@Controller('admin/rides')
export class RidesController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @RequirePermission('ride.read')
  @Get('requests')
  async requests(@Query() query: PaginationQueryDto) {
    const db = this.prisma.client
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const [items, total] = await Promise.all([
      db.rideRequest.findMany({
        select: {
          id: true, origin: true, destination: true, preferredDate: true, status: true, createdAt: true,
          passenger: PASSENGER_SELECT,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.rideRequest.count(),
    ])
    return { items, page, pageSize, total }
  }

  @RequirePermission('ride.read')
  @Get('offers')
  async offers(@Query() query: PaginationQueryDto) {
    const db = this.prisma.client
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const [items, total] = await Promise.all([
      db.rideOffer.findMany({
        select: {
          id: true, origin: true, destination: true, departureDate: true, departureTime: true, status: true, createdAt: true,
          driver: DRIVER_SELECT,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.rideOffer.count(),
    ])
    return { items, page, pageSize, total }
  }

  @RequirePermission('ride.read')
  @Get('matches')
  async matches(@Query() query: PaginationQueryDto) {
    const db = this.prisma.client
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const [items, total] = await Promise.all([
      db.match.findMany({
        select: {
          id: true, matchStatus: true, originDistanceMeters: true, destinationDistanceMeters: true, createdAt: true,
          rideRequest: { select: { origin: true, destination: true, passenger: PASSENGER_SELECT } },
          rideOffer: { select: { origin: true, destination: true, driver: DRIVER_SELECT } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.match.count(),
    ])
    return { items, page, pageSize, total }
  }

  @RequirePermission('ride.read')
  @Get('trips')
  async trips(@Query() query: PaginationQueryDto) {
    const db = this.prisma.client
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const [items, total] = await Promise.all([
      db.trip.findMany({
        select: {
          id: true, status: true, scheduledAt: true, startedAt: true, completedAt: true, createdAt: true,
          passenger: PASSENGER_SELECT,
          driver: DRIVER_SELECT,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.trip.count(),
    ])
    return { items, page, pageSize, total }
  }

  @RequirePermission('ride.investigate')
  @Get('trips/:id')
  async tripDetail(@Param('id') id: string) {
    const trip = await this.prisma.client.trip.findUnique({
      where: { id },
      include: {
        passenger: { select: { fullName: true, phone: true, email: true } },
        driver: { select: { fullName: true, phone: true, email: true } },
        events: { orderBy: { createdAt: 'asc' } },
        reports: true,
        rideAgreement: { include: { match: { include: { rideRequest: true, rideOffer: true } } } },
      },
    })
    if (!trip) throw new NotFoundException('Trip not found')
    return trip
  }

  @RequirePermission('ride.cancel')
  @Post('trips/:id/cancel')
  async cancelTrip(@Param('id') id: string, @Body() body: CancelTripDto, @CurrentUser() admin: AuthenticatedUser) {
    const before = await this.prisma.client.trip.findUnique({ where: { id }, select: { status: true } })
    if (!before) throw new NotFoundException('Trip not found')
    if (before.status === 'COMPLETED' || before.status === 'CANCELLED') {
      throw new BadRequestException(`Trip is already ${before.status.toLowerCase()}`)
    }

    // Conditioned on the exact status just read — an admin cancellation
    // racing a participant's own complete() (TripsService.complete) must
    // not silently overwrite an already-COMPLETED trip back to CANCELLED.
    // See docs/agent-handoff.md finding C16.
    const updated = await this.prisma.client.$transaction(async (tx) => {
      const claimed = await tx.trip.updateMany({ where: { id, status: before.status }, data: { status: 'CANCELLED' } })
      if (claimed.count !== 1) {
        throw new BadRequestException('Trip is already completed or cancelled')
      }
      await tx.tripEvent.create({
        data: { tripId: id, type: 'trip_cancelled', metadata: { by: 'admin', adminId: admin.id, reason: body.reason ?? null } },
      })
      return tx.trip.findUniqueOrThrow({ where: { id } })
    })

    await this.audit.log({
      adminId: admin.id,
      action: 'ride.cancel',
      module: 'rides',
      entity: 'Trip',
      entityId: id,
      previousValue: { status: before.status },
      newValue: { status: 'CANCELLED', reason: body.reason ?? null },
      result: 'SUCCESS',
    })

    return updated
  }
}
