export type PaymentProvider = 'RAZORPAY'

// AUTHORIZED exists for correctness (a manual-capture Razorpay flow could
// reach it) even though this integration auto-captures, so most payments
// go PENDING -> PAID/FAILED directly. REFUND_PENDING/REFUNDED are only
// ever set by PaymentRefund, never directly.
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'REFUND_PENDING' | 'REFUNDED'

// amount is integer minor units (paise), never a float — ₹150.00 is 15000,
// not 150.00 JS floating point.
export interface Payment {
  id: string
  tripId: string
  payerId: string
  provider: PaymentProvider
  providerOrderId?: string
  providerPaymentId?: string
  amount: number
  currency: string
  status: PaymentStatus
  failureReason?: string
  createdAt: string
  updatedAt: string
  paidAt?: string
}

export interface PaymentRefund {
  id: string
  paymentId: string
  providerRefundId?: string
  amount: number
  status: string
  requestedByAdminId?: string
  reason?: string
  createdAt: string
  updatedAt: string
}
