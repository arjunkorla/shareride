import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'
import type { UserRole } from '@shareride/types'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../../auth/types/authenticated-user'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AuditService } from '../../common/audit/audit.service'
import { PaginationQueryDto } from '../dto/pagination.dto'

class ListUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(['PASSENGER', 'DRIVER'])
  userType?: UserRole

  @IsOptional()
  @IsIn(['ACTIVE', 'SUSPENDED', 'BLOCKED'])
  accountStatus?: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED'
}

class ModerationActionDto {
  @IsOptional()
  @IsString()
  reason?: string
}

const USER_LIST_SELECT = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
  roles: true,
  accountStatus: true,
  createdAt: true,
  driverProfile: { select: { rating: true, totalTrips: true, verificationStatus: true } },
  passengerProfile: { select: { rating: true, totalTrips: true } },
} as const

@ApiTags('admin/users')
@ApiBearerAuth()
@Controller('admin/users')
export class UsersController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @RequirePermission('user.read')
  @Get()
  async list(@Query() query: ListUsersQueryDto) {
    const db = this.prisma.client
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20

    const where = {
      ...(query.userType ? { roles: { has: query.userType } } : {}),
      ...(query.accountStatus ? { accountStatus: query.accountStatus } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search, mode: 'insensitive' as const } },
              { email: { contains: query.search, mode: 'insensitive' as const } },
              { phone: { contains: query.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [items, total] = await Promise.all([
      db.user.findMany({ where, select: USER_LIST_SELECT, skip: (page - 1) * pageSize, take: pageSize, orderBy: { createdAt: 'desc' } }),
      db.user.count({ where }),
    ])

    return { items, page, pageSize, total }
  }

  @RequirePermission('user.read')
  @Get(':id')
  async detail(@Param('id') id: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
      include: {
        driverProfile: true,
        passengerProfile: true,
        vehicles: true,
        tripsAsPassenger: { take: 10, orderBy: { createdAt: 'desc' } },
        tripsAsDriver: { take: 10, orderBy: { createdAt: 'desc' } },
        reportsAgainst: { take: 10, orderBy: { createdAt: 'desc' } },
      },
    })
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  @RequirePermission('user.suspend')
  @Post(':id/suspend')
  suspend(@Param('id') id: string, @Body() body: ModerationActionDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.setAccountStatus(id, 'SUSPENDED', body.reason, admin, 'user.suspend')
  }

  @RequirePermission('user.suspend')
  @Post(':id/reactivate')
  reactivate(@Param('id') id: string, @Body() body: ModerationActionDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.setAccountStatus(id, 'ACTIVE', body.reason, admin, 'user.reactivate')
  }

  @RequirePermission('user.block')
  @Post(':id/block')
  block(@Param('id') id: string, @Body() body: ModerationActionDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.setAccountStatus(id, 'BLOCKED', body.reason, admin, 'user.block')
  }

  @RequirePermission('user.block')
  @Post(':id/unblock')
  unblock(@Param('id') id: string, @Body() body: ModerationActionDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.setAccountStatus(id, 'ACTIVE', body.reason, admin, 'user.unblock')
  }

  private async setAccountStatus(
    id: string,
    accountStatus: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED',
    reason: string | undefined,
    admin: AuthenticatedUser,
    action: string,
  ) {
    const before = await this.prisma.client.user.findUnique({ where: { id }, select: { accountStatus: true } })
    if (!before) throw new NotFoundException('User not found')

    const updated = await this.prisma.client.user.update({ where: { id }, data: { accountStatus } })

    await this.audit.log({
      adminId: admin.id,
      action,
      module: 'users',
      entity: 'User',
      entityId: id,
      previousValue: { accountStatus: before.accountStatus },
      newValue: { accountStatus, reason: reason ?? null },
      result: 'SUCCESS',
    })

    return updated
  }
}
