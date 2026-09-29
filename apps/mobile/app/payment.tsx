import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiRequestError } from '@shareride/api-client'
import { ChevronLeftIcon } from '../components/icons'
import { colors, radii } from '../lib/theme'
import { api } from '../lib/api'
import { openRazorpayCheckout } from '../lib/razorpay'
import { useAuthStore } from '../store/auth-store'

function formatRupees(paise: number): string {
  return (paise / 100).toFixed(2)
}

// Real Razorpay payment against a Trip (Phase 11), replacing the Phase 3
// fixture version — which fabricated a 5% platform fee and a flat ₹20
// promo discount client-side. Neither survives here: the schema has no
// fee/discount field anywhere, so the amount shown and charged is exactly
// RideOffer.pricePerPerson, computed server-side (see
// apps/api/src/payments/payments.service.ts). `tripId`, not the old
// fixture `rideId` — payment only makes sense once a Trip exists (a
// CONFIRMED match), not at request time.
//
// Native checkout (react-native-razorpay) requires a custom development
// build — it does not run in Expo Go. See lib/razorpay.ts.
export default function PaymentScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { tripId } = useLocalSearchParams<{ tripId: string }>()
  const profile = useAuthStore((s) => s.profile)
  const session = useAuthStore((s) => s.session)

  const [checkoutState, setCheckoutState] = useState<'idle' | 'opening' | 'verifying' | 'unavailable'>('idle')
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const tripQuery = useQuery({ queryKey: ['trips', tripId], queryFn: () => api.trips.get(tripId), enabled: Boolean(tripId) })
  const paymentQuery = useQuery({ queryKey: ['payments', 'trip', tripId], queryFn: () => api.payments.getByTrip(tripId), enabled: Boolean(tripId) })

  const createOrderMutation = useMutation({ mutationFn: () => api.payments.createOrder(tripId) })
  const verifyMutation = useMutation({
    mutationFn: (input: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => api.payments.verify(input),
    // Authoritative state lives in the query cache, not local component
    // state — this re-fetches from the server rather than trusting the
    // mutation's own response to persist across navigation/app restart.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['payments', 'trip', tripId] })
    },
  })

  const trip = tripQuery.data
  const existingPayment = paymentQuery.data
  const alreadyPaid = existingPayment?.status === 'PAID' || verifyMutation.data?.status === 'PAID'

  const handlePay = async () => {
    setCheckoutError(null)
    setCheckoutState('opening')
    try {
      const checkout = await createOrderMutation.mutateAsync()
      const result = await openRazorpayCheckout({
        key: checkout.razorpayKeyId,
        order_id: checkout.razorpayOrderId,
        amount: checkout.amount,
        currency: checkout.currency,
        name: 'ShareRide',
        description: trip?.route ? `${trip.route.origin} → ${trip.route.destination}` : 'Trip payment',
        prefill: { name: profile?.fullName, contact: profile?.phone ?? session?.user.phone ?? undefined },
        theme: { color: colors.blue },
      })

      if (result.outcome === 'unavailable') {
        setCheckoutState('unavailable')
        return
      }
      if (result.outcome === 'cancelled') {
        setCheckoutState('idle')
        return
      }
      if (result.outcome === 'error') {
        setCheckoutState('idle')
        setCheckoutError(result.message)
        return
      }

      // Checkout returning success is a fast-UX signal only — the payment
      // isn't shown as complete until the server verifies the signature
      // and says so.
      setCheckoutState('verifying')
      await verifyMutation.mutateAsync({
        razorpay_order_id: result.data.razorpay_order_id,
        razorpay_payment_id: result.data.razorpay_payment_id,
        razorpay_signature: result.data.razorpay_signature,
      })
      setCheckoutState('idle')
    } catch {
      setCheckoutState('idle')
      setCheckoutError('We could not confirm this payment. Please check your connection and try again — do not pay twice.')
    }
  }

  const verifyFailed = verifyMutation.isError
  const verifyErrorStatus = verifyMutation.error instanceof ApiRequestError ? verifyMutation.error.error.statusCode : null

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Payment</Text>
          <Text style={styles.headerSub}>Secured by Razorpay</Text>
        </View>
        <Text style={{ fontSize: 18 }}>🔒</Text>
      </View>

      {!tripId && (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>No trip to pay for</Text>
          <Text style={styles.emptySub}>Open this from a confirmed trip in My Rides.</Text>
        </View>
      )}

      {Boolean(tripId) && (tripQuery.isLoading || paymentQuery.isLoading) && (
        <View style={styles.centerState}><ActivityIndicator color={colors.blue} /></View>
      )}

      {(tripQuery.isError || paymentQuery.isError) && (
        <View style={styles.centerState}>
          <Text style={styles.emptyTitle}>Can't load this trip</Text>
          <Text style={styles.emptySub}>It may not exist, or you may not have access to it.</Text>
        </View>
      )}

      {trip && (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Trip</Text>
            {trip.route ? (
              <View style={styles.summaryRow}>
                <View style={styles.summaryIcon}><Text style={{ fontSize: 18 }}>🚗</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryRoute}>{trip.route.origin} → {trip.route.destination}</Text>
                  <Text style={styles.summaryMeta}>{new Date(trip.scheduledAt).toLocaleString()}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.summaryMeta}>Route details unavailable for this trip.</Text>
            )}

            {trip.route && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{trip.route.pricePerPerson}</Text>
              </View>
            )}
            <Text style={styles.feeNote}>No platform fee applies yet — this charges exactly the fare the driver set.</Text>
          </View>

          {alreadyPaid ? (
            <View style={styles.receiptCard}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>✅</Text>
              <Text style={styles.receiptTitle}>Payment Complete</Text>
              {existingPayment && <Text style={styles.receiptAmount}>₹{formatRupees(existingPayment.amount)}</Text>}
              {existingPayment?.providerPaymentId && <Text style={styles.receiptRef}>Ref: {existingPayment.providerPaymentId}</Text>}
              {existingPayment?.paidAt && <Text style={styles.receiptMeta}>{new Date(existingPayment.paidAt).toLocaleString()}</Text>}
            </View>
          ) : existingPayment?.status === 'FAILED' ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>Your last payment attempt failed. You can try again below.</Text>
            </View>
          ) : existingPayment?.status === 'REFUND_PENDING' || existingPayment?.status === 'REFUNDED' ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>This payment was refunded.</Text>
            </View>
          ) : null}

          {checkoutState === 'unavailable' && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                Secure checkout requires the ShareRide app build with payments enabled. It isn't available in this
                preview environment (Expo Go) — try again from a development build.
              </Text>
            </View>
          )}

          {checkoutState === 'verifying' && (
            <View style={styles.verifyingBox}>
              <ActivityIndicator color={colors.blue} />
              <Text style={styles.verifyingText}>Verifying payment…</Text>
            </View>
          )}

          {verifyFailed && checkoutState === 'idle' && (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {verifyErrorStatus === 400
                  ? "We couldn't verify that payment. If money was deducted, it will be reconciled automatically — check back shortly before paying again."
                  : 'Payment confirmation pending. Pull to refresh or try again in a moment.'}
              </Text>
            </View>
          )}

          {checkoutError && <Text style={styles.errorText}>{checkoutError}</Text>}
        </ScrollView>
      )}

      {trip && !alreadyPaid && (
        <View style={styles.footer}>
          <Pressable
            style={[styles.payButton, (checkoutState !== 'idle') && { opacity: 0.7 }]}
            onPress={() => void handlePay()}
            disabled={checkoutState !== 'idle'}
          >
            <Text style={styles.payButtonText}>
              {checkoutState === 'opening' ? 'Opening secure checkout…' : checkoutState === 'verifying' ? 'Verifying…' : trip.route ? `Pay ₹${trip.route.pricePerPerson} Securely` : 'Pay Securely'}
            </Text>
          </Pressable>
          <Text style={styles.footerNote}>🔒 Handled by Razorpay · ShareRide never stores your card details</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.slate100, paddingHorizontal: 16, paddingBottom: 14 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.slate900 },
  headerSub: { fontSize: 11, color: colors.slate500, marginTop: 2 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.slate700 },
  emptySub: { fontSize: 13, color: colors.slate400, textAlign: 'center' },
  card: { backgroundColor: 'white', borderRadius: radii.lg, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2, gap: 8 },
  cardLabel: { fontSize: 11, fontWeight: '700', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  summaryIcon: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  summaryRoute: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  summaryMeta: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  totalValue: { fontSize: 16, fontWeight: '800', color: colors.blue },
  feeNote: { fontSize: 10, color: colors.slate400 },
  receiptCard: { backgroundColor: '#ECFDF5', borderRadius: radii.lg, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: colors.greenBorder },
  receiptTitle: { fontSize: 15, fontWeight: '800', color: colors.greenDark, marginBottom: 4 },
  receiptAmount: { fontSize: 20, fontWeight: '800', color: colors.greenDark, marginBottom: 4 },
  receiptRef: { fontSize: 11, color: colors.green, fontFamily: 'monospace' },
  receiptMeta: { fontSize: 11, color: colors.green, marginTop: 2 },
  warningBox: { backgroundColor: colors.amberSoft, borderRadius: radii.lg, padding: 14, borderWidth: 1, borderColor: '#FDE68A' },
  warningText: { fontSize: 12, color: colors.amber, lineHeight: 17 },
  verifyingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.blueSoft, borderRadius: radii.lg, padding: 14, borderWidth: 1, borderColor: colors.blueBorder },
  verifyingText: { fontSize: 13, fontWeight: '600', color: colors.blueDark },
  errorText: { fontSize: 12, color: colors.red, textAlign: 'center' },
  footer: { padding: 16, paddingBottom: 24, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: colors.slate100 },
  payButton: { paddingVertical: 16, borderRadius: radii.xl, backgroundColor: colors.blue, alignItems: 'center' },
  payButtonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  footerNote: { textAlign: 'center', fontSize: 10, color: colors.slate400, marginTop: 8 },
})
