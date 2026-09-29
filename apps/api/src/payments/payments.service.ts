import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@shareride/database'
import type { Payment } from '@shareride/types'
import type { VerifyPaymentInput } from '@shareride/validation'
import { PrismaService } from '../common/prisma/prisma.service'
import { StructuredLogger } from '../common/logger/structured-logger.service'
import { MetricsService } from '../common/metrics/metrics.service'
import { RazorpayService } from './razorpay.service'

const NON_PAYABLE_TRIP_STATUSES = new Set(['CANCELLED'])
// Once a payment reaches either of these, createOrder() must never place a
// second Razorpay order for the same trip.
const BLOCKS_NEW_ORDER = new Set(['PAID', 'AUTHORIZED'])

interface PaymentRecord {
  id: string
  tripId: string
  payerId: string
  provider: string
  providerOrderId: string | null
  providerPaymentId: string | null
  amount: number
  currency: string
  status: string
  failureReason: string | null
  createdAt: Date
  updatedAt: Date
  paidAt: Date | null
}

export interface CheckoutInfo {
  payment: Payment
  razorpayKeyId: string
  razorpayOrderId: string
  amount: number
  currency: string
}

interface RazorpayWebhookPayload {
  event: string
  payload?: {
    payment?: { entity?: { id: string; order_id: string; status: string } }
    // Refund events (Phase 13) key off payment_id, not order_id — the
    // shape Razorpay's docs confirm for refund.processed/refund.failed
    // (payload.refund.entity.{id,payment_id,status}), distinct from the
    // payment.* events' payload.payment.entity shape above.
    refund?: { entity?: { id: string; payment_id: string; status: string } }
  }
}

// Backend is authoritative for everything: which trip is payable, what it
// costs, whether a charge is a duplicate, and whether a callback/webhook
// actually proves payment. Mobile only ever supplies a tripId or a
// checkout callback's three opaque fields — never an amount, never a
// status. See docs/migration-plan.md Phase 11 for the full reasoning.
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpay: RazorpayService,
    private readonly logger: StructuredLogger,
    private readonly metrics: MetricsService,
  ) {
    this.logger.setContext(PaymentsService.name)
  }

  // Idempotent AND concurrency-safe: a Razorpay order is only ever created
  // after this process has atomically WON a claim on the Payment row
  // (claimPaymentForOrder) — never as a read-then-decide-then-write
  // sequence with the provider call in between. Two concurrent requests
  // for the same trip (a genuine double-tap, or a client retry racing the
  // original request) can therefore never both reach Razorpay: exactly one
  // wins the claim; the other gets a 409 and should retry, which then sees
  // the winner's already-attached order. See docs/agent-handoff.md finding
  // C12 for the race this closes — the previous version could create two
  // separate Razorpay orders for one trip, silently orphaning one of them.
  async createOrder(tripId: string, userId: string): Promise<CheckoutInfo> {
    const trip = await this.prisma.client.trip.findUnique({
      where: { id: tripId },
      include: { rideAgreement: { include: { match: { include: { rideOffer: true } } } } },
    })
    // Same not-found response whether the trip doesn't exist or isn't
    // this caller's — and only the passenger ever pays.
    if (!trip || trip.passengerId !== userId) {
      throw new NotFoundException('Trip not found')
    }
    if (NON_PAYABLE_TRIP_STATUSES.has(trip.status)) {
      throw new BadRequestException('This trip is cancelled and cannot be paid for')
    }

    // The ONLY real price in this schema — RideOffer.pricePerPerson, set
    // by the driver at offer creation. No platform fee/commission/tax
    // exists anywhere in the repository, so none is added here; that's a
    // flagged product decision, not an oversight (see migration plan).
    const amount = Math.round(trip.rideAgreement.match.rideOffer.pricePerPerson.toNumber() * 100)
    if (amount <= 0) {
      throw new BadRequestException('This trip has no payable amount')
    }

    const claim = await this.claimPaymentForOrder(tripId, userId, amount)
    if (claim.outcome === 'existing-order') {
      return this.toCheckoutInfo(claim.payment)
    }

    // claim.outcome === 'claimed' — this call, and only this call, owns
    // taking this Payment row from PENDING/no-order to PENDING/has-order.
    try {
      // Razorpay caps `receipt` at 40 characters (confirmed against the
      // SDK's own orders.d.ts and Razorpay's order docs) — a `trip_`
      // prefix plus a 36-character UUID is 41, one over. The trip id alone
      // is already globally unique, so it's the receipt as-is, no prefix.
      const { providerOrderId } = await this.razorpay.createOrder({ amount, currency: 'INR', receipt: tripId })

      const attached = await this.prisma.client.payment.updateMany({
        where: { id: claim.payment.id, status: 'PENDING', providerOrderId: null },
        data: { providerOrderId },
      })
      if (attached.count !== 1) {
        // We hold the claim, so this should be unreachable in practice —
        // guarded anyway rather than silently returning a record with no
        // order attached, or an order Razorpay created but nothing local
        // points at.
        throw new ConflictException('Payment order creation conflicted — please retry')
      }

      const record = await this.prisma.client.payment.findUniqueOrThrow({ where: { id: claim.payment.id } })
      this.logger.logEvent('payment.order.created', { paymentId: record.id, tripId })
      return this.toCheckoutInfo(record)
    } catch (error) {
      // Release the claim on any failure (Razorpay call, or the guard
      // above) so a client retry can claim it again — never leave the row
      // stuck PENDING with no order and no way forward.
      await this.prisma.client.payment.updateMany({
        where: { id: claim.payment.id, status: 'PENDING', providerOrderId: null },
        data: { status: 'FAILED', failureReason: 'Order creation failed' },
      })
      throw error
    }
  }

  // Returns either an already-attached order to hand back as-is (the
  // repeated-tap case), or a freshly-claimed row this call now owns and
  // must attach an order to (or release back to FAILED on error) — never
  // both, and never a bare "existing" row a second caller could also read
  // and act on.
  private async claimPaymentForOrder(
    tripId: string,
    userId: string,
    amount: number,
  ): Promise<{ outcome: 'existing-order'; payment: PaymentRecord } | { outcome: 'claimed'; payment: PaymentRecord }> {
    const existing = await this.prisma.client.payment.findUnique({ where: { tripId } })

    if (existing && BLOCKS_NEW_ORDER.has(existing.status)) {
      throw new ConflictException(
        existing.status === 'PAID' ? 'This trip has already been paid for' : 'A payment for this trip is already being processed',
      )
    }
    if (existing?.status === 'PENDING' && existing.providerOrderId) {
      return { outcome: 'existing-order', payment: existing }
    }
    if (existing?.status === 'PENDING' && !existing.providerOrderId) {
      // Another request's claim is currently in flight (or crashed
      // mid-flight, in which case the failure path above will have
      // already released it back to FAILED — this is a live race, not a
      // stuck state). Refuse rather than racing a second Razorpay call.
      throw new ConflictException('A payment attempt for this trip is already in progress — please retry shortly')
    }
    if (existing) {
      // Only FAILED can reach here — atomically reclaim it, guarded on the
      // exact status just read so a concurrent retry can't also win.
      const claimed = await this.prisma.client.payment.updateMany({
        where: { tripId, status: 'FAILED' },
        data: { amount, currency: 'INR', status: 'PENDING', providerOrderId: null, providerPaymentId: null, failureReason: null, paidAt: null },
      })
      if (claimed.count !== 1) {
        throw new ConflictException('A payment attempt for this trip is already in progress — please retry shortly')
      }
      return { outcome: 'claimed', payment: await this.prisma.client.payment.findUniqueOrThrow({ where: { tripId } }) }
    }

    // No row at all yet — the create() call itself is the claim; a
    // concurrent first-ever attempt for the same trip loses this race with
    // a P2002 on Payment.tripId's unique constraint, not a silent double
    // Razorpay order.
    try {
      const payment = await this.prisma.client.payment.create({
        data: { tripId, payerId: userId, amount, currency: 'INR', status: 'PENDING', providerOrderId: null },
      })
      return { outcome: 'claimed', payment }
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A payment attempt for this trip is already in progress — please retry shortly')
      }
      throw error
    }
  }

  // Fast-path UX confirmation only — never the sole evidence a payment
  // succeeded (the webhook is the durable reconciliation path; see
  // handleWebhookEvent). Safe to call twice: an already-PAID payment
  // short-circuits without re-verifying or re-transitioning.
  //
  // Only ever transitions PENDING/AUTHORIZED -> PAID — a payment that has
  // moved past that (REFUND_PENDING, REFUNDED, or a webhook-driven FAILED)
  // is left untouched even if the original checkout callback is replayed
  // with its still-cryptographically-valid signature. Without this guard,
  // replaying an old valid callback after an admin refund would flip a
  // REFUNDED payment back to PAID — the checkout callback confirming a
  // charge happened is not evidence that a LATER refund didn't also
  // happen; only the webhook (or this guard deferring to it) can settle
  // that. See docs/agent-handoff.md finding C09.
  async verifyPayment(userId: string, input: VerifyPaymentInput): Promise<Payment> {
    const payment = await this.prisma.client.payment.findUnique({ where: { providerOrderId: input.razorpay_order_id } })
    if (!payment || payment.payerId !== userId) {
      throw new NotFoundException('Payment not found')
    }
    if (payment.status === 'PAID') {
      return this.toPayment(payment)
    }
    if (payment.status !== 'PENDING' && payment.status !== 'AUTHORIZED') {
      // Not an error — the client just gets the current, real status
      // rather than this callback being allowed to overwrite it.
      return this.toPayment(payment)
    }

    const valid = this.razorpay.verifyPaymentSignature({
      orderId: input.razorpay_order_id,
      paymentId: input.razorpay_payment_id,
      signature: input.razorpay_signature,
    })
    if (!valid) {
      // Never the signature itself — only which payment failed to verify.
      this.logger.logEvent('payment.verification.failed', { paymentId: payment.id })
      throw new BadRequestException('Payment verification failed')
    }

    // Conditional on the status just read, same as every webhook
    // transition below — a concurrent webhook delivery for the same
    // payment can't be raced into an inconsistent state by this call.
    const result = await this.prisma.client.payment.updateMany({
      where: { id: payment.id, status: payment.status },
      data: { status: 'PAID', providerPaymentId: input.razorpay_payment_id, paidAt: new Date() },
    })
    const updated = await this.prisma.client.payment.findUniqueOrThrow({ where: { id: payment.id } })
    if (result.count === 1) {
      this.logger.logEvent('payment.verified', { paymentId: updated.id })
    }
    return this.toPayment(updated)
  }

  // Idempotent via PaymentWebhookEvent.providerEventId's unique
  // constraint — a duplicate delivery's insert fails with P2002, treated
  // as "already processed" rather than re-applying the status change.
  //
  // The event-log insert and the domain effect it triggers commit in ONE
  // transaction (previously two separate statements) — a crash between
  // them used to mean the event was permanently marked "seen" with its
  // effect never applied, and a genuine provider redelivery of that exact
  // event would then be silently swallowed forever. See
  // docs/agent-handoff.md finding C10.
  //
  // Every transition is conditioned on the EXACT prior status via
  // `updateMany`'s where clause, not a snapshot read followed by a bare
  // `update`-by-id — so two events for the same payment landing
  // concurrently (or a stale/out-of-order redelivery) can't race each
  // other into an inconsistent state, and `payment.captured` specifically
  // can no longer resurrect a REFUNDED/REFUND_PENDING/FAILED payment back
  // to PAID (it previously guarded only `!== 'PAID'`, which allowed
  // exactly that). See docs/agent-handoff.md finding C11.
  async handleWebhookEvent(rawBody: Buffer, signature: string | undefined, eventId: string | undefined): Promise<void> {
    if (!signature) {
      this.metrics.paymentWebhookEventsTotal.inc({ event_type: 'unknown', outcome: 'rejected' })
      throw new ForbiddenException('Missing webhook signature')
    }
    if (!this.razorpay.verifyWebhookSignature(rawBody, signature)) {
      // Never the signature or the payload — a rejected webhook call is
      // either a misconfigured secret or a spoofed request, neither of
      // which needs the (attacker-controlled) body in the log.
      this.metrics.paymentWebhookEventsTotal.inc({ event_type: 'unknown', outcome: 'rejected' })
      this.logger.logEvent('payment.webhook.signature_rejected', {})
      throw new ForbiddenException('Invalid webhook signature')
    }
    if (!eventId) throw new BadRequestException('Missing webhook event id')

    const payload = JSON.parse(rawBody.toString('utf8')) as RazorpayWebhookPayload
    const paymentEntity = payload.payload?.payment?.entity
    const refundEntity = payload.payload?.refund?.entity
    // payment.* events key off order_id; refund.* events key off
    // payment_id instead (see the RazorpayWebhookPayload comment above) —
    // resolve whichever this event actually carries.
    const payment = paymentEntity
      ? await this.prisma.client.payment.findUnique({ where: { providerOrderId: paymentEntity.order_id } })
      : refundEntity
        ? await this.prisma.client.payment.findUnique({ where: { providerPaymentId: refundEntity.payment_id } })
        : null

    let applied = false
    try {
      await this.prisma.client.$transaction(async (tx) => {
        await tx.paymentWebhookEvent.create({
          data: {
            providerEventId: eventId,
            eventType: payload.event,
            paymentId: payment?.id,
            payload: payload as unknown as Prisma.InputJsonValue,
          },
        })

        if (!payment) return // Recorded above for the audit trail; no local Payment to act on.

        if (paymentEntity && payload.event === 'payment.captured' && (payment.status === 'PENDING' || payment.status === 'AUTHORIZED')) {
          const result = await tx.payment.updateMany({
            where: { id: payment.id, status: payment.status },
            data: { status: 'PAID', providerPaymentId: paymentEntity.id, paidAt: new Date() },
          })
          applied = result.count === 1
        } else if (paymentEntity && payload.event === 'payment.failed' && payment.status === 'PENDING') {
          const result = await tx.payment.updateMany({
            where: { id: payment.id, status: 'PENDING' },
            data: { status: 'FAILED', failureReason: 'Payment failed' },
          })
          applied = result.count === 1
        } else if (paymentEntity && payload.event === 'payment.authorized' && payment.status === 'PENDING') {
          const result = await tx.payment.updateMany({ where: { id: payment.id, status: 'PENDING' }, data: { status: 'AUTHORIZED' } })
          applied = result.count === 1
        } else if (refundEntity && payload.event === 'refund.processed' && payment.status === 'REFUND_PENDING') {
          // Reconciles the gap flagged at the end of Phase 11: adminRefund()
          // only ever initiated a refund and recorded it PROCESSING — this
          // is the first thing that confirms it actually completed, from
          // Razorpay itself, not from the admin action alone.
          const result = await tx.payment.updateMany({ where: { id: payment.id, status: 'REFUND_PENDING' }, data: { status: 'REFUNDED' } })
          if (result.count === 1) {
            await tx.paymentRefund.updateMany({
              where: { paymentId: payment.id, status: 'PROCESSING' },
              data: { status: 'PROCESSED', providerRefundId: refundEntity.id },
            })
            applied = true
          }
        } else if (refundEntity && payload.event === 'refund.failed' && payment.status === 'REFUND_PENDING') {
          // The refund didn't go through — the payment is still genuinely
          // PAID (the money never left), not left stuck in REFUND_PENDING.
          const result = await tx.payment.updateMany({ where: { id: payment.id, status: 'REFUND_PENDING' }, data: { status: 'PAID' } })
          if (result.count === 1) {
            await tx.paymentRefund.updateMany({ where: { paymentId: payment.id, status: 'PROCESSING' }, data: { status: 'FAILED' } })
            applied = true
          }
        }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.metrics.paymentWebhookEventsTotal.inc({ event_type: payload.event, outcome: 'duplicate' })
        this.logger.logEvent('payment.webhook.duplicate', { eventId, eventType: payload.event })
        return // Already processed this exact event — nothing more to do.
      }
      throw error
    }

    this.metrics.paymentWebhookEventsTotal.inc({
      event_type: payload.event,
      outcome: !payment ? 'unmatched' : applied ? 'processed' : 'stale',
    })
    this.logger.logEvent('payment.webhook.received', { eventId, eventType: payload.event, paymentId: payment?.id, applied })
  }

  async getById(id: string, userId: string): Promise<Payment> {
    const record = await this.prisma.client.payment.findUnique({ where: { id } })
    if (!record || record.payerId !== userId) throw new NotFoundException('Payment not found')
    return this.toPayment(record)
  }

  // Both trip participants may check payment status (a driver has a
  // legitimate interest in knowing whether they've been paid), unlike
  // createOrder/verifyPayment, which are passenger-only actions.
  async getByTrip(tripId: string, userId: string): Promise<Payment | null> {
    const trip = await this.prisma.client.trip.findUnique({ where: { id: tripId } })
    if (!trip || (trip.passengerId !== userId && trip.driverId !== userId)) {
      throw new NotFoundException('Trip not found')
    }
    const record = await this.prisma.client.payment.findUnique({ where: { tripId } })
    return record ? this.toPayment(record) : null
  }

  async listOwn(userId: string): Promise<Payment[]> {
    const records = await this.prisma.client.payment.findMany({ where: { payerId: userId }, orderBy: { createdAt: 'desc' } })
    return records.map((r) => this.toPayment(r))
  }

  // Admin-only architecture boundary (apps/api/src/admin/payments) — never
  // reachable from a passenger/driver request. Initiates a Razorpay
  // refund and records it; does NOT assume it completed — settlement is
  // confirmed by the refund.processed/refund.failed webhook above
  // (REFUND_PENDING requires that webhook to resolve it either way).
  //
  // Claims the payment (PAID -> REFUND_PENDING, conditioned on the status
  // just read) BEFORE calling Razorpay, and upserts the refund row rather
  // than always create()-ing it, so a retry after a failed attempt can
  // reuse the same row instead of failing on PaymentRefund.paymentId's
  // unique constraint. The previous version called Razorpay FIRST with no
  // local claim at all — a crash or local failure right after a real
  // refund was issued left it completely unrecorded, and a genuine retry
  // after a first attempt failed could never succeed locally even once the
  // provider call itself worked. See docs/agent-handoff.md finding C13.
  async adminRefund(paymentId: string, adminId: string, reason?: string): Promise<Payment> {
    const payment = await this.prisma.client.payment.findUnique({ where: { id: paymentId } })
    if (!payment) throw new NotFoundException('Payment not found')
    if (payment.status !== 'PAID') throw new BadRequestException('Only a paid payment can be refunded')
    if (!payment.providerPaymentId) throw new BadRequestException('Payment has no provider reference to refund')

    const claimed = await this.prisma.client.payment.updateMany({ where: { id: paymentId, status: 'PAID' }, data: { status: 'REFUND_PENDING' } })
    if (claimed.count !== 1) {
      throw new ConflictException('A refund is already in progress for this payment')
    }

    await this.prisma.client.paymentRefund.upsert({
      where: { paymentId },
      create: { paymentId, amount: payment.amount, status: 'PROCESSING', requestedByAdminId: adminId, reason },
      update: { status: 'PROCESSING', providerRefundId: null, requestedByAdminId: adminId, reason },
    })

    try {
      const { providerRefundId } = await this.razorpay.createRefund({ providerPaymentId: payment.providerPaymentId, amount: payment.amount })
      await this.prisma.client.paymentRefund.update({ where: { paymentId }, data: { providerRefundId } })
    } catch (error) {
      // Release the claim so the admin sees a real FAILED state and can
      // retry — never leave the payment stuck REFUND_PENDING with a
      // refund row that never reached the provider at all.
      await this.prisma.client.payment.updateMany({ where: { id: paymentId, status: 'REFUND_PENDING' }, data: { status: 'PAID' } })
      await this.prisma.client.paymentRefund.update({ where: { paymentId }, data: { status: 'FAILED' } })
      throw error
    }

    const updated = await this.prisma.client.payment.findUniqueOrThrow({ where: { id: paymentId } })
    return this.toPayment(updated)
  }

  private toCheckoutInfo(record: PaymentRecord): CheckoutInfo {
    if (!record.providerOrderId) {
      // Can't happen via the flows above (an order is always created
      // before the row reaches PENDING), but keeps the return type honest.
      throw new ConflictException('This payment has no active order')
    }
    const keyId = this.razorpay.keyId
    if (!keyId) throw new BadRequestException('Payments are not configured in this environment')
    return {
      payment: this.toPayment(record),
      razorpayKeyId: keyId,
      razorpayOrderId: record.providerOrderId,
      amount: record.amount,
      currency: record.currency,
    }
  }

  private toPayment(record: PaymentRecord): Payment {
    return {
      id: record.id,
      tripId: record.tripId,
      payerId: record.payerId,
      provider: record.provider as Payment['provider'],
      providerOrderId: record.providerOrderId ?? undefined,
      providerPaymentId: record.providerPaymentId ?? undefined,
      amount: record.amount,
      currency: record.currency,
      status: record.status as Payment['status'],
      failureReason: record.failureReason ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
      paidAt: record.paidAt?.toISOString(),
    }
  }
}
