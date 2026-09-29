import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { createPaymentOrderSchema, verifyPaymentSchema, type CreatePaymentOrderInput, type VerifyPaymentInput } from '@shareride/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/types/authenticated-user'
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe'
import { PaymentsService } from './payments.service'

@ApiTags('payments')
@ApiBearerAuth()
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('orders')
  createOrder(@Body(new ZodValidationPipe(createPaymentOrderSchema)) body: CreatePaymentOrderInput, @CurrentUser() user: AuthenticatedUser) {
    return this.payments.createOrder(body.tripId, user.id)
  }

  @Post('verify')
  verify(@Body(new ZodValidationPipe(verifyPaymentSchema)) body: VerifyPaymentInput, @CurrentUser() user: AuthenticatedUser) {
    return this.payments.verifyPayment(user.id, body)
  }

  @Get()
  listOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.payments.listOwn(user.id)
  }

  @Get('trip/:tripId')
  getByTrip(@Param('tripId') tripId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.payments.getByTrip(tripId, user.id)
  }

  @Get(':id')
  getById(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.payments.getById(id, user.id)
  }
}
