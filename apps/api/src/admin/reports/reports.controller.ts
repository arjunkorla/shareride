import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../../auth/types/authenticated-user'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AuditService } from '../../common/audit/audit.service'
import { PaginationQueryDto } from '../dto/pagination.dto'

const REPORT_STATUSES = ['NEW', 'INVESTIGATING', 'AWAITING_INFORMATION', 'RESOLVED', 'DISMISSED'] as const
type ReportStatus = (typeof REPORT_STATUSES)[number]
const REPORT_TYPES = ['USER', 'DRIVER', 'PASSENGER', 'RIDE', 'FRAUD', 'SAFETY_INCIDENT'] as const
type ReportType = (typeof REPORT_TYPES)[number]

class ListReportsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(REPORT_STATUSES)
  status?: ReportStatus

  @IsOptional()
  @IsIn(REPORT_TYPES)
  type?: ReportType
}

class ReportNoteDto {
  @IsOptional()
  @IsString()
  note?: string
}

@ApiTags('admin/reports')
@ApiBearerAuth()
@Controller('admin/reports')
export class ReportsController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @RequirePermission('report.read')
  @Get()
  async list(@Query() query: ListReportsQueryDto) {
    const db = this.prisma.client
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
    }
    const [items, total] = await Promise.all([
      db.report.findMany({
        where,
        select: {
          id: true, type: true, status: true, reason: true, createdAt: true,
          reporter: { select: { fullName: true } },
          reportedUser: { select: { fullName: true } },
          assignedAdmin: { select: { fullName: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.report.count({ where }),
    ])
    return { items, page, pageSize, total }
  }

  @RequirePermission('report.read')
  @Get(':id')
  async detail(@Param('id') id: string) {
    const report = await this.prisma.client.report.findUnique({
      where: { id },
      include: {
        reporter: { select: { fullName: true, phone: true, email: true } },
        reportedUser: { select: { fullName: true, phone: true, email: true } },
        trip: true,
        assignedAdmin: { select: { fullName: true, email: true } },
        actions: { orderBy: { createdAt: 'asc' }, include: { admin: { select: { fullName: true } } } },
      },
    })
    if (!report) throw new NotFoundException('Report not found')
    return report
  }

  @RequirePermission('report.assign')
  @Post(':id/assign')
  async assignToSelf(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    const report = await this.prisma.client.report.update({
      where: { id },
      data: { assignedAdminId: admin.id, status: 'INVESTIGATING' },
    })
    await this.recordAction(id, admin.id, 'assigned', undefined)
    await this.audit.log({
      adminId: admin.id,
      action: 'report.assign',
      module: 'safety',
      entity: 'Report',
      entityId: id,
      newValue: { assignedAdminId: admin.id },
      result: 'SUCCESS',
    })
    return report
  }

  // `report.read` alone (granted to READ_ONLY_ADMIN) previously gated
  // this — a read-only account could write to a safety investigation's
  // record. `report.assign` matches every other write action a
  // report-handling admin can take (SAFETY_ADMIN has it, READ_ONLY_ADMIN
  // does not). See docs/agent-handoff.md finding C07.
  @RequirePermission('report.assign')
  @Post(':id/notes')
  async addNote(@Param('id') id: string, @Body() body: ReportNoteDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.recordAction(id, admin.id, 'note', body.note)
  }

  @RequirePermission('report.resolve')
  @Post(':id/resolve')
  async resolve(@Param('id') id: string, @Body() body: ReportNoteDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.setStatus(id, 'RESOLVED', body.note, admin)
  }

  @RequirePermission('report.resolve')
  @Post(':id/dismiss')
  async dismiss(@Param('id') id: string, @Body() body: ReportNoteDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.setStatus(id, 'DISMISSED', body.note, admin)
  }

  private async setStatus(id: string, status: 'RESOLVED' | 'DISMISSED', note: string | undefined, admin: AuthenticatedUser) {
    const before = await this.prisma.client.report.findUnique({ where: { id }, select: { status: true } })
    if (!before) throw new NotFoundException('Report not found')

    const updated = await this.prisma.client.report.update({ where: { id }, data: { status } })
    await this.recordAction(id, admin.id, status === 'RESOLVED' ? 'resolved' : 'dismissed', note)
    await this.audit.log({
      adminId: admin.id,
      action: `report.${status.toLowerCase()}`,
      module: 'safety',
      entity: 'Report',
      entityId: id,
      previousValue: { status: before.status },
      newValue: { status, note: note ?? null },
      result: 'SUCCESS',
    })
    return updated
  }

  private async recordAction(reportId: string, adminId: string, action: string, note: string | undefined) {
    const report = await this.prisma.client.report.findUnique({ where: { id: reportId } })
    if (!report) throw new NotFoundException('Report not found')
    await this.prisma.client.reportAction.create({ data: { reportId, adminId, action, note } })
    return report
  }
}
