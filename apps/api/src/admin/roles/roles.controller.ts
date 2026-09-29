import { Body, Controller, Get, NotFoundException, Param, Patch } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsArray, IsIn } from 'class-validator'
import { PERMISSIONS, type Permission } from '@shareride/types'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../../auth/types/authenticated-user'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AuditService } from '../../common/audit/audit.service'

class UpdateRolePermissionsDto {
  @IsArray()
  @IsIn([...PERMISSIONS], { each: true })
  permissions!: Permission[]
}

@ApiTags('admin/roles')
@ApiBearerAuth()
@Controller('admin/roles')
export class RolesController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  // Readable by anyone who can manage roles or manage admin accounts (the
  // latter needs the role list to populate a "role" dropdown when creating
  // an admin user).
  @RequirePermission('admin.role.manage', 'admin.user.manage')
  @Get()
  list() {
    return this.prisma.client.adminRoleDefinition.findMany({ orderBy: { name: 'asc' } })
  }

  @RequirePermission('admin.role.manage')
  @Get(':id')
  async detail(@Param('id') id: string) {
    const role = await this.prisma.client.adminRoleDefinition.findUnique({ where: { id } })
    if (!role) throw new NotFoundException('Role not found')
    return role
  }

  @RequirePermission('admin.role.manage')
  @Patch(':id/permissions')
  async updatePermissions(@Param('id') id: string, @Body() body: UpdateRolePermissionsDto, @CurrentUser() admin: AuthenticatedUser) {
    const before = await this.prisma.client.adminRoleDefinition.findUnique({ where: { id } })
    if (!before) throw new NotFoundException('Role not found')

    const updated = await this.prisma.client.adminRoleDefinition.update({
      where: { id },
      data: { permissions: body.permissions },
    })

    await this.audit.log({
      adminId: admin.id,
      action: 'admin.role.permissions_updated',
      module: 'admin',
      entity: 'AdminRoleDefinition',
      entityId: id,
      previousValue: { permissions: before.permissions },
      newValue: { permissions: body.permissions },
      result: 'SUCCESS',
    })

    return updated
  }
}
