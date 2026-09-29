import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RideOfferStatus, RideRequest, RideRequestStatus } from '@shareride/types'
import { colors, radii } from '../../lib/theme'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth-store'

const REAL_TRIP_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED: { label: 'Confirmed', color: colors.green, bg: '#D1FAE5' },
  DRIVER_ARRIVING: { label: 'Driver arriving', color: colors.blue, bg: colors.blueSoft },
  AT_PICKUP: { label: 'At pickup', color: colors.blue, bg: colors.blueSoft },
  STARTED: { label: 'In progress', color: colors.blue, bg: colors.blueSoft },
  ONGOING: { label: 'In progress', color: colors.blue, bg: colors.blueSoft },
  COMPLETED: { label: 'Completed', color: colors.blue, bg: '#DBEAFE' },
  CANCELLED: { label: 'Cancelled', color: colors.red, bg: colors.redSoft },
}

const REQUEST_STATUS_CONFIG: Record<RideRequestStatus, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Finding matches', color: colors.blue, bg: colors.blueSoft },
  MATCHED: { label: 'Matched', color: colors.green, bg: '#D1FAE5' },
  CONFIRMED: { label: 'Confirmed', color: colors.green, bg: '#D1FAE5' },
  CANCELLED: { label: 'Cancelled', color: colors.red, bg: colors.redSoft },
  EXPIRED: { label: 'Expired', color: colors.slate500, bg: colors.slate100 },
  COMPLETED: { label: 'Completed', color: colors.blue, bg: '#DBEAFE' },
}
const OPEN_REQUEST_STATUSES = new Set<RideRequestStatus>(['ACTIVE', 'MATCHED', 'CONFIRMED'])

const OFFER_STATUS_CONFIG: Record<RideOfferStatus, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Visible to passengers', color: colors.blue, bg: colors.blueSoft },
  MATCHED: { label: 'Matched', color: colors.green, bg: '#D1FAE5' },
  CONFIRMED: { label: 'Confirmed', color: colors.green, bg: '#D1FAE5' },
  CANCELLED: { label: 'Cancelled', color: colors.red, bg: colors.redSoft },
  EXPIRED: { label: 'Expired', color: colors.slate500, bg: colors.slate100 },
  COMPLETED: { label: 'Completed', color: colors.blue, bg: '#DBEAFE' },
}
const OPEN_OFFER_STATUSES = new Set<RideOfferStatus>(['ACTIVE', 'MATCHED', 'CONFIRMED'])

function formatTimeRange(request: RideRequest) {
  return `${request.preferredTimeStart} - ${request.preferredTimeEnd}`
}

// Ported from src/screens/TripsScreen.tsx. "Upcoming" reads the passenger's
// real RideRequests (Phase 5), "Offered" reads the driver's real
// RideOffers (Phase 6), and "Completed" now reads real Trips (Phase 10 —
// apps/api/src/trips, which didn't exist before this phase).
export default function MyRidesScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const currentUserId = useAuthStore((s) => s.session?.user.id)
  const [tab, setTab] = useState<'upcoming' | 'completed' | 'offered'>('upcoming')
  const [cancelingId, setCancelingId] = useState<string | null>(null)

  const requestsQuery = useQuery({
    queryKey: ['ride-requests'],
    queryFn: () => api.rideRequests.list(),
    enabled: tab === 'upcoming',
  })
  const cancelRequestMutation = useMutation({
    mutationFn: (id: string) => api.rideRequests.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ride-requests'] }),
  })

  const offersQuery = useQuery({
    queryKey: ['ride-offers'],
    queryFn: () => api.rideOffers.list(),
    enabled: tab === 'offered',
  })
  const cancelOfferMutation = useMutation({
    mutationFn: (id: string) => api.rideOffers.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ride-offers'] }),
  })

  const tripsQuery = useQuery({
    queryKey: ['trips'],
    queryFn: () => api.trips.list(),
    enabled: tab === 'completed' || tab === 'upcoming',
  })
  const completedTrips = (tripsQuery.data ?? []).filter((t) => t.status === 'COMPLETED' || t.status === 'CANCELLED')
  // A Trip only exists once a match is CONFIRMED (apps/api's accept()) —
  // this is Phase 11's real payment entry point, alongside the passenger's
  // still-pending RideRequests in the same tab.
  const payableTrips = (tripsQuery.data ?? []).filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED')

  const openRequests = (requestsQuery.data ?? []).filter((r) => OPEN_REQUEST_STATUSES.has(r.status))
  const openOffers = (offersQuery.data ?? []).filter((o) => OPEN_OFFER_STATUSES.has(o.status))

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Rides</Text>
        <View style={styles.tabRow}>
          {([
            { id: 'upcoming' as const, label: 'Upcoming' },
            { id: 'completed' as const, label: 'Completed' },
            { id: 'offered' as const, label: 'Offered' },
          ]).map((t) => (
            <Pressable key={t.id} style={styles.tabButton} onPress={() => setTab(t.id)}>
              <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
              {tab === t.id && <View style={styles.tabUnderline} />}
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {tab === 'upcoming' && (
          <>
            {payableTrips.length > 0 && (
              <View style={{ gap: 12 }}>
                <Text style={styles.sectionHeading}>Confirmed trips</Text>
                {payableTrips.map((trip) => {
                  const status = REAL_TRIP_STATUS_CONFIG[trip.status] ?? { label: trip.status, color: colors.slate500, bg: colors.slate100 }
                  const otherParty = trip.driverId === currentUserId ? trip.passenger : trip.driver
                  return (
                    <Pressable key={trip.id} style={styles.card} onPress={() => router.push(`/payment?tripId=${trip.id}`)}>
                      <View style={[styles.statusBar, { backgroundColor: status.bg }]}>
                        <Text style={[styles.statusText, { color: status.color }]}>● {status.label}</Text>
                        <Text style={styles.statusDate}>{new Date(trip.scheduledAt).toLocaleDateString()}</Text>
                      </View>
                      <View style={styles.cardBody}>
                        {trip.route && (
                          <View style={styles.routeRow}>
                            <View style={styles.timeline}>
                              <View style={styles.dotBlue} />
                              <View style={styles.timelineLine} />
                              <View style={styles.squareRed} />
                            </View>
                            <View style={styles.routeLabels}>
                              <View><Text style={styles.routeCity}>{trip.route.origin}</Text></View>
                              <View><Text style={styles.routeCity}>{trip.route.destination}</Text></View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={styles.amount}>₹{trip.route.pricePerPerson}</Text>
                              <Text style={styles.amountSub}>per person</Text>
                            </View>
                          </View>
                        )}
                        <View style={styles.driverRow}>
                          <View style={styles.driverAvatarFallback}><Text style={styles.driverAvatarFallbackText}>{otherParty.fullName.charAt(0)}</Text></View>
                          <Text style={styles.driverText}>{trip.driverId === currentUserId ? 'Passenger' : 'Driver'}: <Text style={{ fontWeight: '700' }}>{otherParty.fullName}</Text></Text>
                        </View>
                      </View>
                      {trip.driverId !== currentUserId && (
                        <View style={styles.actionsRow}>
                          <View style={styles.payButton}>
                            <Text style={styles.payButtonText}>💳 View / Pay</Text>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  )
                })}
              </View>
            )}

            {requestsQuery.isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator color={colors.blue} />
              </View>
            )}
            {requestsQuery.isError && (
              <View style={styles.centerState}>
                <Text style={{ fontSize: 32 }}>📡</Text>
                <Text style={styles.emptyTitle}>Can't reach ShareRide right now</Text>
                <Text style={styles.emptySub}>Check your connection and pull down to try again.</Text>
              </View>
            )}
            {requestsQuery.isSuccess && openRequests.length === 0 && <EmptyTrips tab="upcoming" />}
            {requestsQuery.isSuccess && openRequests.map((request) => {
              const status = REQUEST_STATUS_CONFIG[request.status]
              return (
                <View key={request.id} style={styles.card}>
                  <View style={[styles.statusBar, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>● {status.label}</Text>
                    <Text style={styles.statusDate}>{request.preferredDate}</Text>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.routeRow}>
                      <View style={styles.timeline}>
                        <View style={styles.dotBlue} />
                        <View style={styles.timelineLine} />
                        <View style={styles.squareRed} />
                      </View>
                      <View style={styles.routeLabels}>
                        <View>
                          <Text style={styles.routeCity}>{request.origin}</Text>
                          <Text style={styles.routeMeta}>{formatTimeRange(request)}</Text>
                        </View>
                        <View>
                          <Text style={styles.routeCity}>{request.destination}</Text>
                        </View>
                      </View>
                    </View>
                    {request.notes && <Text style={styles.notesText}>"{request.notes}"</Text>}
                  </View>

                  {cancelingId === request.id && (
                    <View style={styles.cancelBox}>
                      <Text style={styles.cancelTitle}>Cancel this request?</Text>
                      <Text style={styles.cancelSub}>Matching drivers won't be able to confirm it anymore.</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable style={styles.keepButton} onPress={() => setCancelingId(null)}>
                          <Text style={styles.keepButtonText}>Keep Request</Text>
                        </Pressable>
                        <Pressable
                          style={styles.confirmCancelButton}
                          onPress={() => { cancelRequestMutation.mutate(request.id); setCancelingId(null) }}
                        >
                          <Text style={styles.confirmCancelText}>Yes, Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  <View style={styles.actionsRow}>
                    <Pressable style={styles.trackButton} onPress={() => router.push(`/matches/${request.id}`)}>
                      <Text style={styles.trackButtonText}>🔍 View Matches</Text>
                    </Pressable>
                    <Pressable style={styles.cancelActionButton} onPress={() => setCancelingId(request.id)}>
                      <Text style={styles.cancelActionText}>Cancel Request</Text>
                    </Pressable>
                  </View>
                </View>
              )
            })}
          </>
        )}

        {tab === 'completed' && (
          <>
            {tripsQuery.isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator color={colors.blue} />
              </View>
            )}
            {tripsQuery.isError && (
              <View style={styles.centerState}>
                <Text style={{ fontSize: 32 }}>📡</Text>
                <Text style={styles.emptyTitle}>Can't reach ShareRide right now</Text>
                <Text style={styles.emptySub}>Check your connection and pull down to try again.</Text>
              </View>
            )}
            {tripsQuery.isSuccess && completedTrips.length === 0 && <EmptyTrips tab="completed" />}
            {tripsQuery.isSuccess && completedTrips.map((trip) => {
              const status = REAL_TRIP_STATUS_CONFIG[trip.status] ?? { label: trip.status, color: colors.slate500, bg: colors.slate100 }
              const otherParty = trip.driverId === currentUserId ? trip.passenger : trip.driver
              const otherPartyRole = trip.driverId === currentUserId ? 'Passenger' : 'Driver'
              return (
                <View key={trip.id} style={styles.card}>
                  <View style={[styles.statusBar, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>● {status.label}</Text>
                    <Text style={styles.statusDate}>{new Date(trip.scheduledAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    {trip.route ? (
                      <View style={styles.routeRow}>
                        <View style={styles.timeline}>
                          <View style={styles.dotBlue} />
                          <View style={styles.timelineLine} />
                          <View style={styles.squareRed} />
                        </View>
                        <View style={styles.routeLabels}>
                          <View><Text style={styles.routeCity}>{trip.route.origin}</Text></View>
                          <View><Text style={styles.routeCity}>{trip.route.destination}</Text></View>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.amount}>₹{trip.route.pricePerPerson}</Text>
                          <Text style={styles.amountSub}>per person</Text>
                        </View>
                      </View>
                    ) : (
                      <Text style={styles.notesText}>Route details unavailable for this trip.</Text>
                    )}
                    <View style={styles.driverRow}>
                      <View style={styles.driverAvatarFallback}><Text style={styles.driverAvatarFallbackText}>{otherParty.fullName.charAt(0)}</Text></View>
                      <Text style={styles.driverText}>{otherPartyRole}: <Text style={{ fontWeight: '700' }}>{otherParty.fullName}</Text></Text>
                    </View>
                  </View>
                  {trip.status === 'COMPLETED' && (
                    <View style={styles.actionsRow}>
                      <Pressable style={styles.rateButton} onPress={() => router.push(`/rate-review?tripId=${trip.id}`)}>
                        <Text style={styles.rateButtonText}>⭐ Rate Ride</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )
            })}
          </>
        )}

        {tab === 'offered' && (
          <>
            {offersQuery.isLoading && (
              <View style={styles.centerState}>
                <ActivityIndicator color={colors.blue} />
              </View>
            )}
            {offersQuery.isError && (
              <View style={styles.centerState}>
                <Text style={{ fontSize: 32 }}>📡</Text>
                <Text style={styles.emptyTitle}>Can't reach ShareRide right now</Text>
                <Text style={styles.emptySub}>Check your connection and pull down to try again.</Text>
              </View>
            )}
            {offersQuery.isSuccess && openOffers.length === 0 && <EmptyTrips tab="offered" />}
            {offersQuery.isSuccess && openOffers.map((offer) => {
              const status = OFFER_STATUS_CONFIG[offer.status]
              return (
                <View key={offer.id} style={styles.card}>
                  <View style={[styles.statusBar, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>● {status.label}</Text>
                    <Text style={styles.statusDate}>{offer.departureDate}</Text>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.routeRow}>
                      <View style={styles.timeline}>
                        <View style={styles.dotBlue} />
                        <View style={styles.timelineLine} />
                        <View style={styles.squareRed} />
                      </View>
                      <View style={styles.routeLabels}>
                        <View>
                          <Text style={styles.routeCity}>{offer.origin}</Text>
                          <Text style={styles.routeMeta}>{offer.departureTime}{offer.stops.length > 0 ? ` · via ${offer.stops.join(', ')}` : ''}</Text>
                        </View>
                        <View>
                          <Text style={styles.routeCity}>{offer.destination}</Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.amount}>₹{offer.pricePerPerson}</Text>
                        <Text style={styles.amountSub}>per person</Text>
                      </View>
                    </View>
                    {offer.notes && <Text style={styles.notesText}>"{offer.notes}"</Text>}
                  </View>

                  {cancelingId === offer.id && (
                    <View style={styles.cancelBox}>
                      <Text style={styles.cancelTitle}>Cancel this ride?</Text>
                      <Text style={styles.cancelSub}>Passengers won't be able to request a match anymore.</Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <Pressable style={styles.keepButton} onPress={() => setCancelingId(null)}>
                          <Text style={styles.keepButtonText}>Keep Ride</Text>
                        </Pressable>
                        <Pressable
                          style={styles.confirmCancelButton}
                          onPress={() => { cancelOfferMutation.mutate(offer.id); setCancelingId(null) }}
                        >
                          <Text style={styles.confirmCancelText}>Yes, Cancel</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}

                  <View style={styles.actionsRow}>
                    <Pressable style={styles.cancelActionButton} onPress={() => setCancelingId(offer.id)}>
                      <Text style={styles.cancelActionText}>Cancel Ride</Text>
                    </Pressable>
                  </View>
                </View>
              )
            })}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function EmptyTrips({ tab }: { tab: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 40 }}>{tab === 'upcoming' ? '🗓️' : tab === 'completed' ? '✅' : '🚗'}</Text>
      <Text style={styles.emptyTitle}>No {tab} {tab === 'upcoming' ? 'requests' : 'trips'}</Text>
      <Text style={styles.emptySub}>
        {tab === 'upcoming' ? 'Request a ride or offer one to get started!' : tab === 'completed' ? "You haven't completed any trips yet." : "You haven't offered any rides yet."}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 16, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.slate900, marginBottom: 12 },
  tabRow: { flexDirection: 'row', gap: 20 },
  tabButton: { paddingBottom: 12 },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.slate400 },
  tabTextActive: { color: colors.blue },
  tabUnderline: { height: 2, backgroundColor: colors.blue, marginTop: 8, borderRadius: 1 },
  card: { backgroundColor: 'white', borderRadius: radii.lg, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  statusBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusDate: { fontSize: 11, color: colors.slate500 },
  cardBody: { paddingHorizontal: 16, paddingVertical: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  timeline: { alignItems: 'center', paddingTop: 4 },
  dotBlue: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.blue },
  timelineLine: { width: 2, height: 32, backgroundColor: colors.slate200, marginVertical: 2 },
  squareRed: { width: 10, height: 10, borderRadius: 2, backgroundColor: colors.red },
  routeLabels: { flex: 1, justifyContent: 'space-between', gap: 8 },
  routeCity: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  routeMeta: { fontSize: 11, color: colors.slate500, marginTop: 2 },
  notesText: { fontSize: 12, color: colors.slate500, fontStyle: 'italic', marginTop: 4 },
  amount: { fontSize: 17, fontWeight: '800', color: colors.slate900 },
  amountSub: { fontSize: 10, color: colors.slate400 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.slate50 },
  driverAvatarFallback: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  driverAvatarFallbackText: { fontSize: 12, fontWeight: '700', color: colors.blue },
  driverText: { fontSize: 12, color: colors.slate600, flex: 1 },
  cancelBox: { marginHorizontal: 16, marginBottom: 12, backgroundColor: colors.redSoft, borderRadius: radii.lg, padding: 12, borderWidth: 1, borderColor: colors.redBorder, gap: 6 },
  cancelTitle: { fontSize: 12, fontWeight: '700', color: '#B91C1C' },
  cancelSub: { fontSize: 10, color: colors.red },
  keepButton: { flex: 1, paddingVertical: 8, borderRadius: radii.md, backgroundColor: 'white', borderWidth: 1, borderColor: colors.redBorder, alignItems: 'center' },
  keepButtonText: { fontSize: 11, fontWeight: '700', color: colors.red },
  confirmCancelButton: { flex: 1, paddingVertical: 8, borderRadius: radii.md, backgroundColor: colors.red, alignItems: 'center' },
  confirmCancelText: { fontSize: 11, fontWeight: '700', color: 'white' },
  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14 },
  trackButton: { flex: 1, paddingVertical: 9, borderRadius: radii.md, backgroundColor: colors.blue, alignItems: 'center' },
  trackButtonText: { fontSize: 11, fontWeight: '700', color: 'white' },
  viewButton: { flex: 1, paddingVertical: 9, borderRadius: radii.md, backgroundColor: colors.blueSoft, borderWidth: 1, borderColor: colors.blueBorder, alignItems: 'center' },
  viewButtonText: { fontSize: 11, fontWeight: '700', color: colors.blue },
  cancelActionButton: { flex: 1, paddingVertical: 9, borderRadius: radii.md, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center' },
  cancelActionText: { fontSize: 11, fontWeight: '700', color: colors.slate600 },
  rateButton: { flex: 1, paddingVertical: 9, borderRadius: radii.md, backgroundColor: colors.amberSoft, borderWidth: 1, borderColor: '#FDE68A', alignItems: 'center' },
  rateButtonText: { fontSize: 11, fontWeight: '700', color: colors.amber },
  sectionHeading: { fontSize: 13, fontWeight: '800', color: colors.slate700, marginBottom: -4 },
  payButton: { flex: 1, paddingVertical: 9, borderRadius: radii.md, backgroundColor: colors.blue, alignItems: 'center' },
  payButtonText: { fontSize: 11, fontWeight: '700', color: 'white' },
  centerState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.slate700, marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 13, color: colors.slate400, textAlign: 'center', maxWidth: 220, lineHeight: 18 },
})
