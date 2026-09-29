import { Body, Controller, ForbiddenException, Get, NotFoundException, Param, Patch, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsEmail, IsString, IsUUID, MinLength } from 'class-validator'
import type { Permission } from '@shareride/types'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../../auth/types/authenticated-user'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AuditService } from '../../common/audit/audit.service'

class CreateAdminUserDto {
  // Must be an existing Supabase auth user's id — this endpoint promotes an
  // already-registered person to admin, it does not create a login.
  @IsUUID()
  id!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(1)
  fullName!: string

  @IsUUID()
  roleId!: string
}

@ApiTags('admin/admin-users')
@ApiBearerAuth()
@Controller('admin/admin-users')
export class AdminUsersController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @RequirePermission('admin.user.manage')
  @Get()
  list() {
    return this.prisma.client.adminUser.findMany({
      include: { role: { select: { key: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  @RequirePermission('admin.user.manage')
  @Post()
  async create(@Body() body: CreateAdminUserDto, @CurrentUser() admin: AuthenticatedUser) {
    const role = await this.prisma.client.adminRoleDefinition.findUnique({ where: { id: body.roleId } })
    if (!role) throw new NotFoundException('Role not found')

    // Grant ceiling: `admin.user.manage` alone (granted to plain ADMIN, not
    // just SUPER_ADMIN) let any admin create a new admin with a MORE
    // privileged role than their own — including SUPER_ADMIN itself, which
    // then has `admin.role.manage`/`admin.permission.manage`, permissions
    // the original ADMIN was explicitly denied. An admin may only ever
    // grant a role whose permissions are already a subset of their own.
    const grantedPermissions: Permission[] = (role.permissions as Permission[]) ?? []
    const callerPermissions = new Set(admin.admin?.permissions ?? [])
    const exceedsCallerGrant = grantedPermissions.some((permission) => !callerPermissions.has(permission))
    if (exceedsCallerGrant) {
      throw new ForbiddenException('You cannot grant a role with more permissions than your own')
    }

    const created = await this.prisma.client.adminUser.create({
      data: { id: body.id, email: body.email, fullName: body.fullName, roleId: body.roleId },
      include: { role: { select: { key: true, name: true } } },
    })

    await this.audit.log({
      adminId: admin.id,
      action: 'admin.user.created',
      module: 'admin',
      entity: 'AdminUser',
      entityId: created.id,
      newValue: { email: body.email, roleKey: role.key },
      result: 'SUCCESS',
    })

    return created
  }

  @RequirePermission('admin.user.manage')
  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    return this.setActive(id, false, admin)
  }

  @RequirePermission('admin.user.manage')
  @Patch(':id/reactivate')
  async reactivate(@Param('id') id: string, @CurrentUser() admin: AuthenticatedUser) {
    // Same grant-ceiling rule as create(): reactivating restores that
    // account's existing role/permissions, so it's just as much an
    // escalation vector if the target already holds a role more
    // privileged than the caller's own — a suspended SUPER_ADMIN account
    // must not be un-suspendable by a plain ADMIN.
    const target = await this.prisma.client.adminUser.findUnique({ where: { id }, select: { role: { select: { permissions: true } } } })
    if (!target) throw new NotFoundException('Admin user not found')
    const targetPermissions: Permission[] = (target.role.permissions as Permission[]) ?? []
    const callerPermissions = new Set(admin.admin?.permissions ?? [])
    if (targetPermissions.some((permission) => !callerPermissions.has(permission))) {
      throw new ForbiddenException('You cannot reactivate an account with more permissions than your own')
    }
    return this.setActive(id, true, admin)
  }

  private async setActive(id: string, isActive: boolean, admin: AuthenticatedUser) {
    const before = await this.prisma.client.adminUser.findUnique({ where: { id }, select: { isActive: true } })
    if (!before) throw new NotFoundException('Admin user not found')

    const updated = await this.prisma.client.adminUser.update({ where: { id }, data: { isActive } })

    await this.audit.log({
      adminId: admin.id,
      action: isActive ? 'admin.user.reactivated' : 'admin.user.deactivated',
      module: 'admin',
      entity: 'AdminUser',
      entityId: id,
      previousValue: { isActive: before.isActive },
      newValue: { isActive },
      result: 'SUCCESS',
    })

    return updated
  }
}
