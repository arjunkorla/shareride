import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'
import { PrismaService } from '../../common/prisma/prisma.service'
import { PaginationQueryDto } from '../dto/pagination.dto'

class ListAuditLogsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  module?: string

  @IsOptional()
  @IsString()
  entity?: string
}

// Read-only by construction — there is deliberately no PATCH/DELETE route
// on this controller, and AuditService.log() is the only writer.
@ApiTags('admin/audit-logs')
@ApiBearerAuth()
@Controller('admin/audit-logs')
export class AuditLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @RequirePermission('audit.read')
  @Get()
  async list(@Query() query: ListAuditLogsQueryDto) {
    const db = this.prisma.client
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where = {
      ...(query.module ? { module: query.module } : {}),
      ...(query.entity ? { entity: query.entity } : {}),
    }
    const [items, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        include: { admin: { select: { fullName: true, email: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.auditLog.count({ where }),
    ])
    return { items, page, pageSize, total }
  }
}
