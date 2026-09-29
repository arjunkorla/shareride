import { Injectable, ServiceUnavailableException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Razorpay from 'razorpay'
import { validatePaymentVerification, validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils'

// The only file in this codebase that imports the Razorpay SDK — every
// other payment service talks to this interface, never the SDK directly,
// so PaymentsService/WebhookController stay unit-testable without a
// network call (see payments.service.spec.ts's fake RazorpayService).
//
// Fails closed, not fake: every method throws ServiceUnavailableException
// if RAZORPAY_KEY_ID/KEY_SECRET/WEBHOOK_SECRET aren't set, rather than
// silently succeeding — a payment feature with no configured provider
// must refuse to take money, never pretend to.
@Injectable()
export class RazorpayService {
  private client: Razorpay | null = null

  constructor(private readonly config: ConfigService) {}

  get keyId(): string | undefined {
    return this.config.get<string>('RAZORPAY_KEY_ID')
  }

  private getClient(): Razorpay {
    if (this.client) return this.client
    const key_id = this.config.get<string>('RAZORPAY_KEY_ID')
    const key_secret = this.config.get<string>('RAZORPAY_KEY_SECRET')
    if (!key_id || !key_secret) {
      throw new ServiceUnavailableException('Payments are not configured in this environment')
    }
    this.client = new Razorpay({ key_id, key_secret })
    return this.client
  }

  // amount is integer paise, provided by PaymentsService (never trusted
  // from a request) — see its computeAmount().
  async createOrder(input: { amount: number; currency: string; receipt: string }): Promise<{ providerOrderId: string }> {
    const order = await this.getClient().orders.create({
      amount: input.amount,
      currency: input.currency,
      receipt: input.receipt,
    })
    return { providerOrderId: order.id }
  }

  // Exact scheme Razorpay's checkout callback uses (confirmed against
  // current docs): HMAC-SHA256(order_id + "|" + payment_id, key_secret).
  // Delegates to the SDK's own utility rather than reimplementing the
  // HMAC, so this tracks any future correction Razorpay makes to it.
  verifyPaymentSignature(input: { orderId: string; paymentId: string; signature: string }): boolean {
    const key_secret = this.config.get<string>('RAZORPAY_KEY_SECRET')
    if (!key_secret) throw new ServiceUnavailableException('Payments are not configured in this environment')
    return validatePaymentVerification({ order_id: input.orderId, payment_id: input.paymentId }, input.signature, key_secret)
  }

  // HMAC-SHA256(RAW body, webhook secret) against X-Razorpay-Signature —
  // the docs explicitly warn not to parse the body first, so this takes
  // the exact bytes Express captured (main.ts's `rawBody: true`), not
  // JSON.stringify(parsedBody) which can differ byte-for-byte.
  verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
    const webhookSecret = this.config.get<string>('RAZORPAY_WEBHOOK_SECRET')
    if (!webhookSecret) throw new ServiceUnavailableException('Payments are not configured in this environment')
    return validateWebhookSignature(rawBody.toString('utf8'), signature, webhookSecret)
  }

  // Architecture boundary — see PaymentRefund's schema comment. Nothing
  // calls this except an explicit admin action.
  async createRefund(input: { providerPaymentId: string; amount: number }): Promise<{ providerRefundId: string }> {
    const refund = await this.getClient().payments.refund(input.providerPaymentId, { amount: input.amount })
    return { providerRefundId: refund.id }
  }
}
