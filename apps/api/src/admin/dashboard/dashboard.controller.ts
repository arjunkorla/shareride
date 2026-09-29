import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'
import { PrismaService } from '../../common/prisma/prisma.service'

@ApiTags('admin/dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly prisma: PrismaService) {}

  // A single, honest snapshot query — no fake/placeholder numbers. Every
  // field here maps to a real table already in the schema; KPIs that don't
  // have a backing table yet (e.g. support tickets) are simply not listed,
  // rather than shown with a made-up value.
  @RequirePermission('analytics.read')
  @Get()
  async getSummary() {
    const db = this.prisma.client
    const [
      totalUsers,
      activeUsers,
      drivers,
      passengers,
      verifiedDrivers,
      pendingVerification,
      activeRideRequests,
      activeRideOffers,
      activeMatches,
      confirmedTrips,
      completedTrips,
      cancelledTrips,
      openReports,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { accountStatus: 'ACTIVE' } }),
      db.driverProfile.count(),
      db.passengerProfile.count(),
      db.driverProfile.count({ where: { verificationStatus: 'APPROVED' } }),
      db.driverProfile.count({ where: { verificationStatus: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      db.rideRequest.count({ where: { status: 'ACTIVE' } }),
      db.rideOffer.count({ where: { status: 'ACTIVE' } }),
      db.match.count({ where: { matchStatus: { in: ['SUGGESTED', 'REQUESTED', 'ACCEPTED'] } } }),
      db.trip.count({ where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } } }),
      db.trip.count({ where: { status: 'COMPLETED' } }),
      db.trip.count({ where: { status: 'CANCELLED' } }),
      db.report.count({ where: { status: { in: ['NEW', 'INVESTIGATING', 'AWAITING_INFORMATION'] } } }),
    ])

    return {
      totalUsers,
      activeUsers,
      drivers,
      passengers,
      verifiedDrivers,
      pendingVerification,
      activeRideRequests,
      activeRideOffers,
      activeMatches,
      confirmedTrips,
      completedTrips,
      cancelledTrips,
      openReports,
    }
  }
}
