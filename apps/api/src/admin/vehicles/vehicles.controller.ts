import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../../auth/types/authenticated-user'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AuditService } from '../../common/audit/audit.service'
import { PaginationQueryDto } from '../dto/pagination.dto'

const VERIFICATION_STATUSES = ['NOT_STARTED', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ACTION_REQUIRED'] as const
type VerificationStatus = (typeof VERIFICATION_STATUSES)[number]

class ListVehiclesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(VERIFICATION_STATUSES)
  verificationStatus?: VerificationStatus
}

class VerificationNoteDto {
  @IsOptional()
  @IsString()
  note?: string
}

// Uses the 'verification.*' permissions (packages/types/src/permissions.ts)
// that were already defined for exactly this — separate from driver.* used
// by admin/drivers, since a driver's identity and their vehicle's
// paperwork are reviewed independently (a driver can be APPROVED with a
// still-NOT_STARTED vehicle, or vice versa).
@ApiTags('admin/vehicles')
@ApiBearerAuth()
@Controller('admin/vehicles')
export class VehiclesController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @RequirePermission('verification.read')
  @Get()
  async list(@Query() query: ListVehiclesQueryDto) {
    const db = this.prisma.client
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    const where = {
      ...(query.verificationStatus ? { verificationStatus: query.verificationStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { registrationNumber: { contains: query.search, mode: 'insensitive' as const } },
              { driver: { fullName: { contains: query.search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      db.vehicle.findMany({
        where,
        include: { driver: { select: { fullName: true, phone: true, email: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.vehicle.count({ where }),
    ])

    return { items, page, pageSize, total }
  }

  @RequirePermission('verification.read')
  @Get(':id')
  async detail(@Param('id') id: string) {
    const vehicle = await this.prisma.client.vehicle.findUnique({
      where: { id },
      include: { driver: { select: { fullName: true, phone: true, email: true } } },
    })
    if (!vehicle) throw new NotFoundException('Vehicle not found')
    return vehicle
  }

  @RequirePermission('verification.approve')
  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() body: VerificationNoteDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.setStatus(id, 'APPROVED', body.note, admin, 'vehicle.approve')
  }

  @RequirePermission('verification.reject')
  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() body: VerificationNoteDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.setStatus(id, 'REJECTED', body.note, admin, 'vehicle.reject')
  }

  private async setStatus(
    id: string,
    verificationStatus: 'APPROVED' | 'REJECTED',
    note: string | undefined,
    admin: AuthenticatedUser,
    action: string,
  ) {
    const before = await this.prisma.client.vehicle.findUnique({ where: { id }, select: { verificationStatus: true } })
    if (!before) throw new NotFoundException('Vehicle not found')

    const updated = await this.prisma.client.vehicle.update({
      where: { id },
      data: { verificationStatus, verificationNote: note ?? null },
    })

    await this.audit.log({
      adminId: admin.id,
      action,
      module: 'vehicles',
      entity: 'Vehicle',
      entityId: id,
      previousValue: { verificationStatus: before.verificationStatus },
      newValue: { verificationStatus, note: note ?? null },
      result: 'SUCCESS',
    })

    return updated
  }
}
