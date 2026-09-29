import { Injectable, NotFoundException } from '@nestjs/common'
import type { UserReport } from '@shareride/types'
import type { CreateReportInput } from '@shareride/validation'
import { PrismaService } from '../common/prisma/prisma.service'

interface ReportRecord {
  id: string
  type: string
  status: string
  reportedUserId: string | null
  tripId: string | null
  reason: string
  description: string | null
  createdAt: Date
}

// User-facing half of the Report model — apps/api/src/admin/reports owns
// the review/assign/resolve half. A reporting user can create and see
// their own reports, never the moderation metadata (assignedAdminId,
// ReportAction history) admin/reports.controller.ts exposes; status here
// is read-only from the user's side, always starts at NEW, and can only
// change via an admin action.
@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(reporterId: string, input: CreateReportInput): Promise<UserReport> {
    if (input.tripId) {
      const trip = await this.prisma.client.trip.findUnique({ where: { id: input.tripId } })
      if (!trip || (trip.passengerId !== reporterId && trip.driverId !== reporterId)) {
        throw new NotFoundException('Trip not found')
      }
    }
    if (input.reportedUserId) {
      const target = await this.prisma.client.user.findUnique({ where: { id: input.reportedUserId }, select: { id: true } })
      if (!target) throw new NotFoundException('Reported user not found')
    }

    const record = await this.prisma.client.report.create({
      data: {
        type: input.type,
        reporterId,
        reportedUserId: input.reportedUserId,
        tripId: input.tripId,
        reason: input.reason,
        description: input.description,
      },
    })
    return this.toUserReport(record)
  }

  async listOwn(reporterId: string): Promise<UserReport[]> {
    const records = await this.prisma.client.report.findMany({
      where: { reporterId },
      orderBy: { createdAt: 'desc' },
    })
    return records.map((r) => this.toUserReport(r))
  }

  private toUserReport(record: ReportRecord): UserReport {
    return {
      id: record.id,
      type: record.type as UserReport['type'],
      status: record.status as UserReport['status'],
      reportedUserId: record.reportedUserId ?? undefined,
      tripId: record.tripId ?? undefined,
      reason: record.reason,
      description: record.description ?? undefined,
      createdAt: record.createdAt.toISOString(),
    }
  }
}
