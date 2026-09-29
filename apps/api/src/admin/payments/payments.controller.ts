import { Body, Controller, Get, NotFoundException, Param, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'
import { RequirePermission } from '../../auth/decorators/require-permission.decorator'
import { CurrentUser } from '../../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../../auth/types/authenticated-user'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AuditService } from '../../common/audit/audit.service'
import { PaymentsService } from '../../payments/payments.service'
import { PaginationQueryDto } from '../dto/pagination.dto'

const PAYMENT_STATUSES = ['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUND_PENDING', 'REFUNDED'] as const
type PaymentStatusFilter = (typeof PAYMENT_STATUSES)[number]

class ListPaymentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(PAYMENT_STATUSES)
  status?: PaymentStatusFilter
}

class RefundDto {
  @IsOptional()
  @IsString()
  reason?: string
}

// Read visibility only exposes what's already safe by construction — the
// Payment model never stores card/UPI instrument details, a signature, or
// either Razorpay secret (Razorpay's own PCI-compliant checkout handles
// those, this API never sees them) — so list/detail need no field
// redaction beyond what the model already excludes.
@ApiTags('admin/payments')
@ApiBearerAuth()
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly payments: PaymentsService,
  ) {}

  @RequirePermission('payment.read')
  @Get()
  async list(@Query() query: ListPaymentsQueryDto) {
    const db = this.prisma.client
    const page = query.page ?? 1
    const pageSize = query.pageSize ?? 20
    const where = { ...(query.status ? { status: query.status } : {}) }

    const [items, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: { payer: { select: { fullName: true, phone: true, email: true } }, trip: { select: { id: true, status: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      db.payment.count({ where }),
    ])
    return { items, page, pageSize, total }
  }

  @RequirePermission('payment.read')
  @Get(':id')
  async detail(@Param('id') id: string) {
    const payment = await this.prisma.client.payment.findUnique({
      where: { id },
      include: {
        payer: { select: { fullName: true, phone: true, email: true } },
        trip: true,
        refund: true,
        webhookEvents: { orderBy: { processedAt: 'desc' } },
      },
    })
    if (!payment) throw new NotFoundException('Payment not found')
    return payment
  }

  @RequirePermission('payment.refund')
  @Post(':id/refund')
  async refund(@Param('id') id: string, @Body() body: RefundDto, @CurrentUser() admin: AuthenticatedUser) {
    const before = await this.prisma.client.payment.findUnique({ where: { id }, select: { status: true } })
    if (!before) throw new NotFoundException('Payment not found')

    const updated = await this.payments.adminRefund(id, admin.id, body.reason)

    await this.audit.log({
      adminId: admin.id,
      action: 'payment.refund',
      module: 'payments',
      entity: 'Payment',
      entityId: id,
      previousValue: { status: before.status },
      newValue: { status: updated.status, reason: body.reason ?? null },
      result: 'SUCCESS',
    })

    return updated
  }
}
