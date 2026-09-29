import { z } from 'zod'

// Only a domain reference — never amount/currency (PaymentsService derives
// the authoritative amount server-side from the Trip's RideOffer, see
// docs/migration-plan.md Phase 11).
export const createPaymentOrderSchema = z.object({
  tripId: z.string().uuid(),
})
export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>

// Exactly what Razorpay Checkout hands back to the client on success —
// the raw signature is meaningless without server-side HMAC verification
// against RAZORPAY_KEY_SECRET, which is the actual security boundary,
// not this shape check.
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
})
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>
