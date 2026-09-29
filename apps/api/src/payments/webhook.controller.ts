import { BadRequestException, Controller, Headers, HttpCode, Post, Req } from '@nestjs/common'
import type { RawBodyRequest } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import type { Request } from 'express'
import { Public } from '../auth/decorators/public.decorator'
import { PaymentsService } from './payments.service'

// Razorpay calls this directly — it carries no ShareRide session, so it's
// @Public() (opted out of the global JwtAuthGuard) and authenticated
// purely by its own HMAC signature instead (PaymentsService.handleWebhookEvent).
// Excluded from Swagger since it's not a client-facing API surface.
@ApiExcludeController()
@Controller('payments/webhook')
export class WebhookController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Post()
  @HttpCode(200)
  async handle(@Req() req: RawBodyRequest<Request>, @Headers('x-razorpay-signature') signature: string | undefined, @Headers('x-razorpay-event-id') eventId: string | undefined) {
    // main.ts's `rawBody: true` populates req.rawBody with the exact
    // bytes Express received — required because the signature is an HMAC
    // over the raw payload, not the re-serialized parsed JSON (see
    // razorpay.service.ts's verifyWebhookSignature comment). No fallback
    // to a re-serialized body: that would almost certainly fail signature
    // verification anyway, so failing closed here is more honest than
    // silently trying and rejecting downstream.
    if (!req.rawBody) throw new BadRequestException('Missing request body')
    await this.payments.handleWebhookEvent(req.rawBody, signature, eventId)
    return { received: true }
  }
}
