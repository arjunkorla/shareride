import { createHmac } from 'node:crypto'
import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { buildTestApp } from './utils/build-test-app'

const WEBHOOK_SECRET = 'test-webhook-secret'

// Exercises the real signature-verification boundary end to end: raw body
// capture (main.ts's rawBody:true, mirrored by supertest sending a raw
// Buffer/string) -> RazorpayService.verifyWebhookSignature -> the @Public()
// WebhookController -> PaymentsService.handleWebhookEvent. No Razorpay
// network call is involved (verifyWebhookSignature is pure HMAC), so this
// is safe to run with no live provider, per the "never make real Razorpay
// calls" constraint.
function sign(body: string, secret = WEBHOOK_SECRET): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}

describe('POST /payments/webhook (e2e)', () => {
  let app: INestApplication | undefined

  afterEach(async () => {
    await app?.close()
    app = undefined
  })

  it('rejects a request with no signature header at all', async () => {
    app = await buildTestApp()
    const body = JSON.stringify({ event: 'payment.captured', payload: {} })
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .send(body)
    expect(res.status).toBe(403)
    expect(res.body.code).toBe('FORBIDDEN')
  })

  it('rejects a request with a signature that does not match the payload', async () => {
    app = await buildTestApp()
    const body = JSON.stringify({ event: 'payment.captured', payload: {} })
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', 'not-the-real-signature')
      .set('x-razorpay-event-id', 'evt_1')
      .send(body)
    expect(res.status).toBe(403)
  })

  it('accepts a correctly signed payload for an event id, even with no matching local payment', async () => {
    const paymentWebhookEventCreate = jest.fn().mockResolvedValue({ id: 'whe_1' })
    const paymentFindUnique = jest.fn().mockResolvedValue(null)
    // handleWebhookEvent wraps the event-log insert and the domain effect
    // in one $transaction (docs/agent-handoff.md finding C10) — `tx` here
    // is the same mocked client, same pattern as
    // payments.service.spec.ts's own fake.
    const client: Record<string, unknown> = {
      payment: { findUnique: paymentFindUnique },
      paymentWebhookEvent: { create: paymentWebhookEventCreate },
    }
    client.$transaction = jest.fn((fn: (tx: unknown) => unknown) => fn(client))
    app = await buildTestApp({ prisma: { client } })
    const body = JSON.stringify({
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_1', order_id: 'order_unknown_to_this_system' } } },
    })
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', sign(body))
      .set('x-razorpay-event-id', 'evt_1')
      .send(body)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ received: true })
    expect(paymentWebhookEventCreate).toHaveBeenCalled()
  })

  it('rejects a correctly signed payload missing the event id header', async () => {
    app = await buildTestApp()
    const body = JSON.stringify({ event: 'payment.captured', payload: {} })
    const res = await request(app.getHttpServer())
      .post('/api/v1/payments/webhook')
      .set('Content-Type', 'application/json')
      .set('x-razorpay-signature', sign(body))
      .send(body)
    expect(res.status).toBe(400)
  })
})
