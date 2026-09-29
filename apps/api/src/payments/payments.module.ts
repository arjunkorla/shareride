import { Module } from '@nestjs/common'
import { PaymentsController } from './payments.controller'
import { WebhookController } from './webhook.controller'
import { PaymentsService } from './payments.service'
import { RazorpayService } from './razorpay.service'

@Module({
  controllers: [PaymentsController, WebhookController],
  providers: [PaymentsService, RazorpayService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
