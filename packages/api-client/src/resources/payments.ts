import type { Payment } from '@shareride/types'
import type { HttpClient } from '../http'

// razorpayKeyId is the PUBLIC key — safe for the mobile checkout SDK.
// KEY_SECRET/WEBHOOK_SECRET never leave apps/api (see
// apps/api/src/payments/razorpay.service.ts).
export interface CheckoutInfo {
  payment: Payment
  razorpayKeyId: string
  razorpayOrderId: string
  amount: number
  currency: string
}

export function paymentsResource(http: HttpClient) {
  return {
    // Server derives the amount from the Trip's RideOffer.pricePerPerson —
    // the client only ever supplies which trip it's paying for.
    createOrder: (tripId: string) => http.post<CheckoutInfo>('/payments/orders', { tripId }),
    // The three fields Razorpay Checkout's success callback hands back —
    // meaningless without the server-side HMAC check this triggers.
    verify: (input: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
      http.post<Payment>('/payments/verify', input),
    listOwn: () => http.get<Payment[]>('/payments'),
    getByTrip: (tripId: string) => http.get<Payment | null>(`/payments/trip/${tripId}`),
    getById: (id: string) => http.get<Payment>(`/payments/${id}`),
  }
}
