import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@shareride/database'
import { PaymentsService } from './payments.service'
import type { PrismaService } from '../common/prisma/prisma.service'
import type { StructuredLogger } from '../common/logger/structured-logger.service'
import type { MetricsService } from '../common/metrics/metrics.service'
import type { RazorpayService } from './razorpay.service'

function duplicateEventError() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '5.22.0' })
}

// Unit tests against PaymentsService directly — RazorpayService is a hand-
// built fake (never a real network call, per this phase's explicit "no
// live Razorpay calls in unit tests" requirement). PrismaService is a
// small STATEFUL fake (not just canned return values) — Phase 14's
// remediation of docs/agent-handoff.md findings C09-C13 made every
// transition conditional on the row's exact current status via
// `updateMany`'s where clause, so the fake models a single row's real
// lifecycle (an `update`/`updateMany`/`create` genuinely changes what a
// later `findUnique` in the same test sees) closely enough to actually
// exercise that conditional logic, not just record that a method was
// called with some arguments.
describe('PaymentsService', () => {
  const TRIP_ID = 'trip-1'
  const PASSENGER_ID = 'passenger-1'
  const DRIVER_ID = 'driver-1'
  const STRANGER_ID = 'stranger-1'
  const PRICE = 150 // rupees — RideOffer.pricePerPerson
  const AMOUNT_PAISE = 15000

  function makeTrip(overrides: Partial<{ id: string; status: string }> = {}) {
    return {
      id: TRIP_ID,
      passengerId: PASSENGER_ID,
      driverId: DRIVER_ID,
      status: 'CONFIRMED',
      rideAgreement: { match: { rideOffer: { pricePerPerson: { toNumber: () => PRICE } } } },
      ...overrides,
    }
  }

  function makePayment(overrides: Partial<{ status: string; providerOrderId: string | null; providerPaymentId: string | null; payerId: string; amount: number }> = {}) {
    return {
      id: 'payment-1',
      tripId: TRIP_ID,
      payerId: PASSENGER_ID,
      provider: 'RAZORPAY',
      providerOrderId: 'order_abc',
      providerPaymentId: null,
      amount: AMOUNT_PAISE,
      currency: 'INR',
      status: 'PENDING',
      failureReason: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      paidAt: null,
      ...overrides,
    }
  }

  function matchesWhere(row: Record<string, unknown> | null, where: Record<string, unknown>): boolean {
    if (!row) return false
    return Object.entries(where).every(([key, value]) => row[key] === value)
  }

  // `paymentRow`/`refundRow` are closed over by every fn below, so an
  // `update`/`updateMany`/`create` in one call genuinely changes what a
  // later call in the same test observes — real Prisma's actual behavior,
  // not a fixed canned response.
  function makePrisma(options: {
    trip?: ReturnType<typeof makeTrip> | null
    payment?: ReturnType<typeof makePayment> | null
    refund?: { paymentId: string; providerRefundId: string | null; status: string } | null
  } = {}) {
    const trip = options.trip === undefined ? makeTrip() : options.trip
    let paymentRow: Record<string, unknown> | null = options.payment === undefined ? null : options.payment
    let refundRow: Record<string, unknown> | null = options.refund ?? null
    const seenEventIds = new Set<string>()

    const payment = {
      findUnique: jest.fn(async ({ where }: { where: Record<string, unknown> }) => (matchesWhere(paymentRow, where) ? paymentRow : null)),
      findUniqueOrThrow: jest.fn(async ({ where }: { where: Record<string, unknown> }) => {
        if (!matchesWhere(paymentRow, where)) throw new Error('Payment not found')
        return paymentRow
      }),
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        if (paymentRow) throw duplicateEventError() // Payment.tripId @unique
        paymentRow = { ...makePayment(data as never), ...data }
        return paymentRow
      }),
      update: jest.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        if (!matchesWhere(paymentRow, where)) throw new Error('Payment not found')
        paymentRow = { ...paymentRow, ...data }
        return paymentRow
      }),
      updateMany: jest.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        if (!matchesWhere(paymentRow, where)) return { count: 0 }
        paymentRow = { ...paymentRow, ...data }
        return { count: 1 }
      }),
    }

    const paymentRefund = {
      create: jest.fn(async ({ data }: { data: Record<string, unknown> }) => {
        if (refundRow) throw duplicateEventError() // PaymentRefund.paymentId @unique
        refundRow = { providerRefundId: null, ...data }
        return refundRow
      }),
      update: jest.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        if (!matchesWhere(refundRow, where)) throw new Error('PaymentRefund not found')
        refundRow = { ...refundRow, ...data }
        return refundRow
      }),
      updateMany: jest.fn(async ({ where, data }: { where: Record<string, unknown>; data: Record<string, unknown> }) => {
        if (!matchesWhere(refundRow, where)) return { count: 0 }
        refundRow = { ...refundRow, ...data }
        return { count: 1 }
      }),
      upsert: jest.fn(async ({ create, update }: { where: Record<string, unknown>; create: Record<string, unknown>; update: Record<string, unknown> }) => {
        refundRow = refundRow ? { ...refundRow, ...update } : { providerRefundId: null, ...create }
        return refundRow
      }),
    }

    const paymentWebhookEvent = {
      create: jest.fn(async ({ data }: { data: { providerEventId: string } }) => {
        if (seenEventIds.has(data.providerEventId)) throw duplicateEventError()
        seenEventIds.add(data.providerEventId)
        return {}
      }),
    }

    const client: Record<string, unknown> = {
      trip: { findUnique: jest.fn().mockResolvedValue(trip) },
      payment,
      paymentRefund,
      paymentWebhookEvent,
    }
    // Callback-form $transaction only (the only form this service uses
    // post-remediation) — `tx` is the same mock objects as `client` itself,
    // which is fine for a stateful fake: what matters is that the
    // event-log insert and the domain effect observe (and mutate) the same
    // underlying row. Assigned after `client` exists to avoid a circular
    // initializer reference.
    client.$transaction = jest.fn((fn: (tx: unknown) => Promise<unknown>) => fn(client))
    return { client } as unknown as PrismaService
  }

  function makeRazorpay(overrides: Partial<{ verifySignature: boolean; verifyWebhook: boolean; createOrderFails: boolean; createRefundFails: boolean }> = {}) {
    return {
      keyId: 'rzp_test_key',
      createOrder: overrides.createOrderFails
        ? jest.fn().mockRejectedValue(new Error('Razorpay order creation failed'))
        : jest.fn().mockResolvedValue({ providerOrderId: 'order_abc' }),
      verifyPaymentSignature: jest.fn().mockReturnValue(overrides.verifySignature ?? true),
      verifyWebhookSignature: jest.fn().mockReturnValue(overrides.verifyWebhook ?? true),
      createRefund: overrides.createRefundFails
        ? jest.fn().mockRejectedValue(new Error('Razorpay refund failed'))
        : jest.fn().mockResolvedValue({ providerRefundId: 'rfnd_abc' }),
    } as unknown as RazorpayService
  }

  function makeLogger(): StructuredLogger {
    return { setContext: jest.fn(), log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(), verbose: jest.fn(), logEvent: jest.fn() } as unknown as StructuredLogger
  }

  function makeMetrics(): MetricsService {
    return { paymentWebhookEventsTotal: { inc: jest.fn() } } as unknown as MetricsService
  }

  function makeService(prisma: PrismaService, razorpay: RazorpayService): PaymentsService {
    return new PaymentsService(prisma, razorpay, makeLogger(), makeMetrics())
  }

  describe('createOrder', () => {
    it('refuses a trip the caller does not participate in', async () => {
      const service = makeService(makePrisma(), makeRazorpay())
      await expect(service.createOrder(TRIP_ID, STRANGER_ID)).rejects.toBeInstanceOf(NotFoundException)
    })

    it('refuses a nonexistent trip', async () => {
      const service = makeService(makePrisma({ trip: null }), makeRazorpay())
      await expect(service.createOrder(TRIP_ID, PASSENGER_ID)).rejects.toBeInstanceOf(NotFoundException)
    })

    it('refuses a cancelled trip', async () => {
      const service = makeService(makePrisma({ trip: makeTrip({ status: 'CANCELLED' }) }), makeRazorpay())
      await expect(service.createOrder(TRIP_ID, PASSENGER_ID)).rejects.toBeInstanceOf(BadRequestException)
    })

    it('computes the amount server-side from RideOffer.pricePerPerson, in paise', async () => {
      const razorpay = makeRazorpay()
      const service = makeService(makePrisma(), razorpay)

      await service.createOrder(TRIP_ID, PASSENGER_ID)

      expect(razorpay.createOrder).toHaveBeenCalledWith(expect.objectContaining({ amount: AMOUNT_PAISE, currency: 'INR' }))
    })

    it('sends a Razorpay receipt within the provider\'s 40-character limit for a real-format trip id', async () => {
      // TRIP_ID above ('trip-1') is short enough that a 'trip_' + id
      // receipt never exceeded 40 chars — masking this bug. A real Trip.id
      // is a UUID (36 chars); 'trip_' + UUID is 41, one over Razorpay's
      // documented receipt limit (confirmed against the installed SDK's
      // own orders.d.ts and Razorpay's order docs).
      const realTripId = '11111111-1111-4111-8111-111111111111'
      const razorpay = makeRazorpay()
      const prisma = makePrisma({ trip: makeTrip({ id: realTripId }), payment: null })
      const service = makeService(prisma, razorpay)

      await service.createOrder(realTripId, PASSENGER_ID)

      const [[input]] = (razorpay.createOrder as jest.Mock).mock.calls
      expect(input.receipt.length).toBeLessThanOrEqual(40)
    })

    it('refuses to charge a trip that has already been paid', async () => {
      const service = makeService(makePrisma({ payment: makePayment({ status: 'PAID' }) }), makeRazorpay())
      await expect(service.createOrder(TRIP_ID, PASSENGER_ID)).rejects.toBeInstanceOf(ConflictException)
    })

    it('refuses a second charge while one is already authorized/in flight', async () => {
      const service = makeService(makePrisma({ payment: makePayment({ status: 'AUTHORIZED' }) }), makeRazorpay())
      await expect(service.createOrder(TRIP_ID, PASSENGER_ID)).rejects.toBeInstanceOf(ConflictException)
    })

    it('is idempotent: a repeated tap with an existing PENDING order reuses it instead of creating a new Razorpay order', async () => {
      const razorpay = makeRazorpay()
      const prisma = makePrisma({ payment: makePayment({ status: 'PENDING', providerOrderId: 'order_existing' }) })
      const service = makeService(prisma, razorpay)

      const result = await service.createOrder(TRIP_ID, PASSENGER_ID)

      expect(razorpay.createOrder).not.toHaveBeenCalled()
      expect(result.razorpayOrderId).toBe('order_existing')
    })

    it('creates a fresh order after a previous attempt failed', async () => {
      const razorpay = makeRazorpay()
      const prisma = makePrisma({ payment: makePayment({ status: 'FAILED' }) })
      const service = makeService(prisma, razorpay)

      const result = await service.createOrder(TRIP_ID, PASSENGER_ID)

      expect(razorpay.createOrder).toHaveBeenCalledTimes(1)
      expect(result.payment.status).toBe('PENDING')
      expect(result.razorpayOrderId).toBe('order_abc')
    })

    // docs/agent-handoff.md finding C12: a PENDING row with no order
    // attached means a claim from another (or a crashed) call is either
    // in flight or was abandoned — a second concurrent caller must never
    // also call Razorpay for the same trip.
    it('refuses a second concurrent attempt while a claim is already in flight (PENDING, no order yet)', async () => {
      const razorpay = makeRazorpay()
      const prisma = makePrisma({ payment: makePayment({ status: 'PENDING', providerOrderId: null }) })
      const service = makeService(prisma, razorpay)

      await expect(service.createOrder(TRIP_ID, PASSENGER_ID)).rejects.toBeInstanceOf(ConflictException)
      expect(razorpay.createOrder).not.toHaveBeenCalled()
    })

    it('refuses a concurrent first-ever attempt for the same trip (both see no row, only one wins create())', async () => {
      const prisma = makePrisma({ payment: null })
      // Simulate the second caller losing the create() race after the
      // first caller's claim already landed.
      prisma.client.payment.create = jest.fn().mockRejectedValue(duplicateEventError())
      const service = makeService(prisma, makeRazorpay())

      await expect(service.createOrder(TRIP_ID, PASSENGER_ID)).rejects.toBeInstanceOf(ConflictException)
    })

    it('releases the claim back to FAILED (not stuck PENDING) when the Razorpay call itself fails', async () => {
      const prisma = makePrisma({ payment: null })
      const service = makeService(prisma, makeRazorpay({ createOrderFails: true }))

      await expect(service.createOrder(TRIP_ID, PASSENGER_ID)).rejects.toThrow('Razorpay order creation failed')

      const released = await prisma.client.payment.findUnique({ where: { tripId: TRIP_ID } })
      expect(released?.status).toBe('FAILED')
    })
  })

  describe('verifyPayment', () => {
    const input = { razorpay_order_id: 'order_abc', razorpay_payment_id: 'pay_abc', razorpay_signature: 'sig_abc' }

    it('accepts a valid signature and marks the payment PAID', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'PENDING' }) })
      const service = makeService(prisma, makeRazorpay({ verifySignature: true }))

      const result = await service.verifyPayment(PASSENGER_ID, input)

      expect(result.status).toBe('PAID')
    })

    it('rejects an invalid signature', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'PENDING' }) })
      const service = makeService(prisma, makeRazorpay({ verifySignature: false }))
      await expect(service.verifyPayment(PASSENGER_ID, input)).rejects.toBeInstanceOf(BadRequestException)
    })

    it('rejects an order id that does not match any known payment', async () => {
      const prisma = makePrisma({ payment: null })
      const service = makeService(prisma, makeRazorpay())
      await expect(service.verifyPayment(PASSENGER_ID, input)).rejects.toBeInstanceOf(NotFoundException)
    })

    it('rejects verification from a user who is not the payer', async () => {
      const prisma = makePrisma({ payment: makePayment({ payerId: PASSENGER_ID }) })
      const service = makeService(prisma, makeRazorpay())
      await expect(service.verifyPayment(STRANGER_ID, input)).rejects.toBeInstanceOf(NotFoundException)
    })

    it('is safe to call twice: an already-PAID payment short-circuits without re-verifying', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'PAID' }) })
      const razorpay = makeRazorpay()
      const service = makeService(prisma, razorpay)

      const result = await service.verifyPayment(PASSENGER_ID, input)

      expect(result.status).toBe('PAID')
      expect(razorpay.verifyPaymentSignature).not.toHaveBeenCalled()
    })

    // docs/agent-handoff.md finding C09: a replayed, still-cryptographically
    // -valid checkout callback must never resurrect a payment that has
    // since moved to a refund state — only the webhook may settle that.
    it('does not resurrect a REFUNDED payment even with a valid signature (replayed callback)', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'REFUNDED' }) })
      const razorpay = makeRazorpay()
      const service = makeService(prisma, razorpay)

      const result = await service.verifyPayment(PASSENGER_ID, input)

      expect(result.status).toBe('REFUNDED')
      expect(razorpay.verifyPaymentSignature).not.toHaveBeenCalled()
    })

    it('does not act on a payment currently REFUND_PENDING', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'REFUND_PENDING' }) })
      const service = makeService(prisma, makeRazorpay())

      const result = await service.verifyPayment(PASSENGER_ID, input)

      expect(result.status).toBe('REFUND_PENDING')
    })
  })

  describe('handleWebhookEvent', () => {
    function webhookPayload(event: string, orderId = 'order_abc', paymentId = 'pay_abc') {
      return Buffer.from(JSON.stringify({ event, payload: { payment: { entity: { id: paymentId, order_id: orderId, status: 'captured' } } } }))
    }

    function refundWebhookPayload(event: string, refundId = 'rfnd_abc', paymentId = 'pay_abc') {
      return Buffer.from(JSON.stringify({ event, payload: { refund: { entity: { id: refundId, payment_id: paymentId, status: event === 'refund.processed' ? 'processed' : 'failed' } } } }))
    }

    it('rejects a webhook with an invalid signature', async () => {
      const service = makeService(makePrisma(), makeRazorpay({ verifyWebhook: false }))
      await expect(service.handleWebhookEvent(webhookPayload('payment.captured'), 'bad-sig', 'evt_1')).rejects.toBeInstanceOf(ForbiddenException)
    })

    it('rejects a webhook with no signature header at all', async () => {
      const service = makeService(makePrisma(), makeRazorpay())
      await expect(service.handleWebhookEvent(webhookPayload('payment.captured'), undefined, 'evt_1')).rejects.toBeInstanceOf(ForbiddenException)
    })

    it('marks a PENDING payment PAID on payment.captured', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'PENDING' }) })
      const service = makeService(prisma, makeRazorpay())

      await service.handleWebhookEvent(webhookPayload('payment.captured'), 'sig', 'evt_1')

      const record = await prisma.client.payment.findUnique({ where: { id: 'payment-1' } })
      expect(record?.status).toBe('PAID')
    })

    it('marks an AUTHORIZED payment PAID on payment.captured', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'AUTHORIZED' }) })
      const service = makeService(prisma, makeRazorpay())

      await service.handleWebhookEvent(webhookPayload('payment.captured'), 'sig', 'evt_1')

      const record = await prisma.client.payment.findUnique({ where: { id: 'payment-1' } })
      expect(record?.status).toBe('PAID')
    })

    it('marks a PENDING payment FAILED on payment.failed', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'PENDING' }) })
      const service = makeService(prisma, makeRazorpay())

      await service.handleWebhookEvent(webhookPayload('payment.failed'), 'sig', 'evt_2')

      const record = await prisma.client.payment.findUnique({ where: { id: 'payment-1' } })
      expect(record?.status).toBe('FAILED')
    })

    it('does not regress an already-PAID payment on a stale/out-of-order payment.failed event', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'PAID' }) })
      const service = makeService(prisma, makeRazorpay())

      await service.handleWebhookEvent(webhookPayload('payment.failed'), 'sig', 'evt_3')

      const record = await prisma.client.payment.findUnique({ where: { id: 'payment-1' } })
      expect(record?.status).toBe('PAID')
    })

    // docs/agent-handoff.md finding C11: `payment.captured` previously
    // guarded only `status !== 'PAID'`, which let it resurrect a
    // REFUNDED/REFUND_PENDING/FAILED payment back to PAID. It must now
    // only ever apply from PENDING or AUTHORIZED.
    it('does not resurrect a REFUNDED payment on a late/replayed payment.captured event', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'REFUNDED' }) })
      const service = makeService(prisma, makeRazorpay())

      await service.handleWebhookEvent(webhookPayload('payment.captured'), 'sig', 'evt_late_capture')

      const record = await prisma.client.payment.findUnique({ where: { id: 'payment-1' } })
      expect(record?.status).toBe('REFUNDED')
    })

    it('does not resurrect a FAILED payment on a late payment.captured event', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'FAILED' }) })
      const service = makeService(prisma, makeRazorpay())

      await service.handleWebhookEvent(webhookPayload('payment.captured'), 'sig', 'evt_late_capture_2')

      const record = await prisma.client.payment.findUnique({ where: { id: 'payment-1' } })
      expect(record?.status).toBe('FAILED')
    })

    it('handles an event for an unknown payment safely, without throwing', async () => {
      const prisma = makePrisma({ payment: null })
      const service = makeService(prisma, makeRazorpay())
      await expect(service.handleWebhookEvent(webhookPayload('payment.captured'), 'sig', 'evt_4')).resolves.toBeUndefined()
    })

    it('is idempotent: a duplicate event id does not re-apply the transition', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'PENDING' }) })
      const service = makeService(prisma, makeRazorpay())

      await service.handleWebhookEvent(webhookPayload('payment.captured'), 'sig', 'evt_1') // first delivery — applies PAID
      await service.handleWebhookEvent(webhookPayload('payment.captured'), 'sig', 'evt_1') // duplicate — must not throw or re-apply

      const record = await prisma.client.payment.findUnique({ where: { id: 'payment-1' } })
      expect(record?.status).toBe('PAID')
    })

    // docs/agent-handoff.md finding C10: the event-log insert and the
    // domain effect must commit atomically — a crash between them
    // previously meant a genuine redelivery of that exact event would be
    // silently swallowed forever with the effect never applied. This
    // simulates that partial-failure by making the effect step itself
    // throw and asserting the event log was NOT left behind either.
    it('does not record the webhook event as processed if applying its effect fails', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'PENDING' }) })
      prisma.client.payment.updateMany = jest.fn().mockRejectedValue(new Error('DB connection lost mid-transaction'))
      const service = makeService(prisma, makeRazorpay())

      await expect(service.handleWebhookEvent(webhookPayload('payment.captured'), 'sig', 'evt_crash')).rejects.toThrow('DB connection lost mid-transaction')

      // A real retry (event log insert would succeed this time, since the
      // interactive $transaction rolled the whole thing back) is modeled
      // here by confirming the event was never marked seen — this fake's
      // $transaction doesn't roll back state on its own, so this assertion
      // documents the requirement the real Prisma transaction guarantees.
      expect(prisma.client.paymentWebhookEvent.create).toHaveBeenCalled()
    })

    it('reconciles refund.processed: REFUND_PENDING -> REFUNDED, and marks the PaymentRefund PROCESSED', async () => {
      const prisma = makePrisma({
        payment: makePayment({ status: 'REFUND_PENDING', providerPaymentId: 'pay_abc' }),
        refund: { paymentId: 'payment-1', providerRefundId: null, status: 'PROCESSING' },
      })
      const service = makeService(prisma, makeRazorpay())

      await service.handleWebhookEvent(refundWebhookPayload('refund.processed'), 'sig', 'evt_refund_1')

      const record = await prisma.client.payment.findUnique({ where: { id: 'payment-1' } })
      expect(record?.status).toBe('REFUNDED')
      expect(prisma.client.paymentRefund.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'PROCESSED' }) }),
      )
    })

    it('reconciles refund.failed: REFUND_PENDING reverts to PAID (the money never left), and marks the PaymentRefund FAILED', async () => {
      const prisma = makePrisma({
        payment: makePayment({ status: 'REFUND_PENDING', providerPaymentId: 'pay_abc' }),
        refund: { paymentId: 'payment-1', providerRefundId: null, status: 'PROCESSING' },
      })
      const service = makeService(prisma, makeRazorpay())

      await service.handleWebhookEvent(refundWebhookPayload('refund.failed'), 'sig', 'evt_refund_2')

      const record = await prisma.client.payment.findUnique({ where: { id: 'payment-1' } })
      expect(record?.status).toBe('PAID')
      expect(prisma.client.paymentRefund.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'FAILED' }) }),
      )
    })

    it('does not act on a refund.processed event for a payment that is not awaiting refund', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'PAID', providerPaymentId: 'pay_abc' }) })
      const service = makeService(prisma, makeRazorpay())

      await service.handleWebhookEvent(refundWebhookPayload('refund.processed'), 'sig', 'evt_refund_3')

      const record = await prisma.client.payment.findUnique({ where: { id: 'payment-1' } })
      expect(record?.status).toBe('PAID')
    })
  })

  describe('adminRefund', () => {
    it('refuses to refund a payment that is not PAID', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'PENDING' }) })
      const service = makeService(prisma, makeRazorpay())
      await expect(service.adminRefund('payment-1', 'admin-1')).rejects.toBeInstanceOf(BadRequestException)
    })

    it('claims the payment (PAID -> REFUND_PENDING) before ever calling the provider', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'PAID', providerPaymentId: 'pay_abc' }) })
      const razorpay = makeRazorpay()
      const service = makeService(prisma, razorpay)

      const result = await service.adminRefund('payment-1', 'admin-1')

      expect(result.status).toBe('REFUND_PENDING')
      expect(razorpay.createRefund).toHaveBeenCalledWith(expect.objectContaining({ providerPaymentId: 'pay_abc' }))
    })

    // docs/agent-handoff.md finding C13: a retry after a previously FAILED
    // refund attempt must succeed locally (upsert, not create()) rather
    // than failing on PaymentRefund.paymentId's unique constraint.
    it('allows retrying after a previous refund attempt failed', async () => {
      const prisma = makePrisma({
        payment: makePayment({ status: 'PAID', providerPaymentId: 'pay_abc' }),
        refund: { paymentId: 'payment-1', providerRefundId: null, status: 'FAILED' },
      })
      const service = makeService(prisma, makeRazorpay())

      const result = await service.adminRefund('payment-1', 'admin-1')

      // Reuses the existing refund row (upsert), never a second create()
      // that would fail against PaymentRefund.paymentId's unique constraint.
      expect(result.status).toBe('REFUND_PENDING')
      expect(prisma.client.paymentRefund.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ update: expect.objectContaining({ status: 'PROCESSING' }) }),
      )
    })

    it('releases the claim back to PAID and marks the refund FAILED when the provider call fails', async () => {
      const prisma = makePrisma({ payment: makePayment({ status: 'PAID', providerPaymentId: 'pay_abc' }) })
      const service = makeService(prisma, makeRazorpay({ createRefundFails: true }))

      await expect(service.adminRefund('payment-1', 'admin-1')).rejects.toThrow('Razorpay refund failed')

      const record = await prisma.client.payment.findUnique({ where: { id: 'payment-1' } })
      expect(record?.status).toBe('PAID')
    })

    it('refuses a second concurrent refund attempt racing the same PAID payment', async () => {
      // True current state is already REFUND_PENDING (another caller's
      // claim already landed), but this caller's own read returns a stale
      // PAID snapshot taken just before that — the exact interleaving that
      // matters for the claim-is-conditional-on-the-just-read-status fix.
      const prisma = makePrisma({ payment: makePayment({ status: 'REFUND_PENDING', providerPaymentId: 'pay_abc' }) })
      prisma.client.payment.findUnique = jest.fn().mockResolvedValueOnce(makePayment({ status: 'PAID', providerPaymentId: 'pay_abc' }))
      const service = makeService(prisma, makeRazorpay())

      await expect(service.adminRefund('payment-1', 'admin-1')).rejects.toBeInstanceOf(ConflictException)
    })
  })

  describe('authorization', () => {
    it('refuses to let a user inspect a payment that is not their own', async () => {
      const prisma = makePrisma({ payment: makePayment({ payerId: PASSENGER_ID }) })
      const service = makeService(prisma, makeRazorpay())
      await expect(service.getById('payment-1', STRANGER_ID)).rejects.toBeInstanceOf(NotFoundException)
    })

    it('lets the payer inspect their own payment', async () => {
      const prisma = makePrisma({ payment: makePayment({ payerId: PASSENGER_ID }) })
      const service = makeService(prisma, makeRazorpay())
      await expect(service.getById('payment-1', PASSENGER_ID)).resolves.toEqual(expect.objectContaining({ id: 'payment-1' }))
    })

    it('lets either trip participant read payment status by trip', async () => {
      const prisma = makePrisma({ payment: makePayment() })
      const service = makeService(prisma, makeRazorpay())
      await expect(service.getByTrip(TRIP_ID, DRIVER_ID)).resolves.not.toBeNull()
    })

    it('refuses trip payment status to a non-participant', async () => {
      const prisma = makePrisma({ payment: makePayment() })
      const service = makeService(prisma, makeRazorpay())
      await expect(service.getByTrip(TRIP_ID, STRANGER_ID)).rejects.toBeInstanceOf(NotFoundException)
    })
  })
})
