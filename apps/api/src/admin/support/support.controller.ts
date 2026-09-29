import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsIn, IsOptional } from 'class-validator'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../../auth/types/authenticated-user'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AuditService } from '../../common/audit/audit.service'
import { PaginationQueryDto } from '../dto/pagination.dto'

const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const
type TicketStatus = (typeof TICKET_STATUSES)[number]

class ListTicketsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(TICKET_STATUSES)
  status?: TicketStatus
}

class UpdateStatusDto {
  @IsIn(TICKET_STATUSES)
  status!: TicketStatus
}

@ApiTags('admin/support')
@ApiBearerAuth()
@Controller('admin/support/tickets')
export class SupportController {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  @RequirePermission('support.read')
  @Get()
  async list(@Query() query: ListTicketsQueryDto) {
    const db = this.prisma.client
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where = { ...(query.status ? { status: query.status } : {}) }

    const [items, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        include: { user: { select: { fullName: true, phone: true, email: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.supportTicket.count({ where }),
    ])
    return { items, page, pageSize, total }
  }

  @RequirePermission('support.read')
  @Get(':id')
  async detail(@Param('id') id: string) {
    const ticket = await this.prisma.client.supportTicket.findUnique({
      where: { id },
      include: { user: { select: { fullName: true, phone: true, email: true } } },
    })
    if (!ticket) throw new NotFoundException('Support ticket not found')
    return ticket
  }

  @RequirePermission('support.respond')
  @Post(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto, @CurrentUser() admin: AuthenticatedUser) {
    const before = await this.prisma.client.supportTicket.findUnique({ where: { id }, select: { status: true } })
    if (!before) throw new NotFoundException('Support ticket not found')

    const updated = await this.prisma.client.supportTicket.update({ where: { id }, data: { status: body.status } })

    await this.audit.log({
      adminId: admin.id,
      action: 'support.status_change',
      module: 'support',
      entity: 'SupportTicket',
      entityId: id,
      previousValue: { status: before.status },
      newValue: { status: body.status },
      result: 'SUCCESS',
    })

    return updated
  }
}
