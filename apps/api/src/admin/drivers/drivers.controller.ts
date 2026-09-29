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

class ListDriversQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(VERIFICATION_STATUSES)
  verificationStatus?: VerificationStatus
}

class VerificationNoteDto {
  @IsOptional()
  @IsString()
  note?: string
}

@ApiTags('admin/drivers')
@ApiBearerAuth()
@Controller('admin/drivers')
export class DriversController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @RequirePermission('driver.read')
  @Get()
  async list(@Query() query: ListDriversQueryDto) {
    const db = this.prisma.client
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    const where = {
      ...(query.verificationStatus ? { verificationStatus: query.verificationStatus } : {}),
      ...(query.search
        ? { user: { fullName: { contains: query.search, mode: 'insensitive' as const } } }
        : {}),
    }

    const [items, total] = await Promise.all([
      db.driverProfile.findMany({
        where,
        select: {
          userId: true,
          verificationStatus: true,
          verificationNote: true,
          rating: true,
          totalTrips: true,
          yearsActive: true,
          user: { select: { fullName: true, phone: true, email: true, accountStatus: true } },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.driverProfile.count({ where }),
    ])

    return { items, page, pageSize, total }
  }

  @RequirePermission('driver.read')
  @Get(':userId')
  async detail(@Param('userId') userId: string) {
    const driver = await this.prisma.client.driverProfile.findUnique({
      where: { userId },
      include: {
        user: { include: { vehicles: true } },
      },
    })
    if (!driver) throw new NotFoundException('Driver not found')
    return driver
  }

  @RequirePermission('driver.approve')
  @Post(':userId/approve')
  approve(@Param('userId') userId: string, @Body() body: VerificationNoteDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.setStatus(userId, 'APPROVED', body.note, admin, 'driver.approve')
  }

  @RequirePermission('driver.reject')
  @Post(':userId/reject')
  reject(@Param('userId') userId: string, @Body() body: VerificationNoteDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.setStatus(userId, 'REJECTED', body.note, admin, 'driver.reject')
  }

  @RequirePermission('driver.verify')
  @Post(':userId/request-info')
  requestInfo(@Param('userId') userId: string, @Body() body: VerificationNoteDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.setStatus(userId, 'ACTION_REQUIRED', body.note, admin, 'driver.request_info')
  }

  private async setStatus(
    userId: string,
    verificationStatus: 'APPROVED' | 'REJECTED' | 'ACTION_REQUIRED',
    note: string | undefined,
    admin: AuthenticatedUser,
    action: string,
  ) {
    const before = await this.prisma.client.driverProfile.findUnique({ where: { userId }, select: { verificationStatus: true } })
    if (!before) throw new NotFoundException('Driver not found')

    const updated = await this.prisma.client.driverProfile.update({
      where: { userId },
      data: { verificationStatus, verificationNote: note ?? null },
    })

    await this.audit.log({
      adminId: admin.id,
      action,
      module: 'drivers',
      entity: 'DriverProfile',
      entityId: userId,
      previousValue: { verificationStatus: before.verificationStatus },
      newValue: { verificationStatus, note: note ?? null },
      result: 'SUCCESS',
    })

    return updated
  }
}
