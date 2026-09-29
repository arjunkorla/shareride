import { useState } from 'react'
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MatchWithRequestSummary } from '@shareride/api-client'
import RouteFields from '../../components/RouteFields'
import DateTimeFields from '../../components/DateTimeFields'
import RideOfferCard from '../../components/RideOfferCard'
import { ChevronLeftIcon, FilterIcon } from '../../components/icons'
import { recentSearches, rideOffers } from '../../lib/fixtures'
import { colors, matchColors, matchLabels, radii } from '../../lib/theme'
import { useSearchStore } from '../../store/search-store'
import { api } from '../../lib/api'
import { computeMatchLabel, formatDistance } from '../../lib/matchLabel'

type DiscoverTab = 'offered' | 'requests' | 'nearby'
type MatchCategory = 'all' | 'best-match' | 'closest-pickup' | 'verified' | 'instant'

const MATCH_CATEGORIES: { id: MatchCategory; label: string }[] = [
  { id: 'all', label: '✦ All' },
  { id: 'best-match', label: '🎯 Best Match' },
  { id: 'closest-pickup', label: '📍 Closest Pickup' },
  { id: 'verified', label: '✓ Verified' },
  { id: 'instant', label: '⚡ Instant' },
]

const PRICE_BANDS: { id: string; label: string; min: number; max: number }[] = [
  { id: 'any', label: 'Any price', min: 0, max: 99999 },
  { id: 'low', label: '₹50 - ₹150', min: 50, max: 150 },
  { id: 'mid', label: '₹150 - ₹300', min: 150, max: 300 },
  { id: 'high', label: '₹300+', min: 300, max: 99999 },
]

function proximityKm(p?: string) {
  return p ? parseFloat(p) : 999
}
function matchRank(m?: string) {
  return m === 'great' ? 0 : m === 'good' ? 1 : m === 'ok' ? 2 : 3
}

// Ported from src/screens/SearchScreen.tsx's two-mode (form/results) flow.
// The price-range slider became preset bands (no native slider dependency
// added for Phase 3); everything else — tabs, match categories, filter
// sheet, empty state — carries over.
export default function DiscoverScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const query = useSearchStore((s) => s.query)
  const updateQuery = useSearchStore((s) => s.updateQuery)

  // Match-request notifications (apps/api/src/matching/matching.service.ts's
  // request()) deep-link here as /(tabs)/discover?tab=requests so tapping
  // one lands the driver directly on their pending requests instead of the
  // default "Offered" tab.
  const { tab: tabParam } = useLocalSearchParams<{ tab?: string }>()
  const [mode, setMode] = useState<'form' | 'results'>(tabParam === 'requests' || (query.pickup && query.dropoff) ? 'results' : 'form')
  const [tab, setTab] = useState<DiscoverTab>(tabParam === 'requests' ? 'requests' : 'offered')
  const [category, setCategory] = useState<MatchCategory>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [priceBandId, setPriceBandId] = useState('any')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const priceBand = PRICE_BANDS.find((b) => b.id === priceBandId)!

  const filteredOffers = rideOffers.filter((r) => {
    if (category === 'best-match' && r.matchScore !== 'great') return false
    if (category === 'closest-pickup' && proximityKm(r.pickupProximityLabel) > 1.5) return false
    if (category === 'verified' && !r.driver.verified) return false
    if (category === 'instant' && !r.preferences.autoConfirm) return false
    if (verifiedOnly && !r.driver.verified) return false
    if (r.pricePerPerson < priceBand.min || r.pricePerPerson > priceBand.max) return false
    return true
  }).sort((a, b) => matchRank(a.matchScore) - matchRank(b.matchScore))

  // Real data (Phase 8): requests other passengers have sent against any
  // of MY OWN ride offers, across all of them — not a fixture and not
  // filtered by the search form above (this tab is "manage my incoming
  // requests," not a search result).
  const pendingRequestsQuery = useQuery({
    queryKey: ['pending-match-requests'],
    queryFn: async () => {
      const offers = await api.rideOffers.list()
      const perOffer = await Promise.all(offers.map((o) => api.matches.listForRideOffer(o.id)))
      return perOffer.flat().filter((m) => m.matchStatus === 'REQUESTED')
    },
    enabled: tab === 'requests',
  })
  const acceptMutation = useMutation({
    mutationFn: (matchId: string) => api.matches.accept(matchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-match-requests'] }),
  })
  const declineMutation = useMutation({
    mutationFn: (matchId: string) => api.matches.decline(matchId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-match-requests'] }),
  })
  // Same real conversation resolution as app/matches/[requestId].tsx's
  // "Message driver" button, mirrored for the driver side.
  const messageMutation = useMutation({
    mutationFn: (passengerId: string) => api.chat.start(passengerId),
    onSuccess: (conversation) => router.push(`/chat/${conversation.id}`),
  })

  const filtersActive = priceBandId !== 'any' || verifiedOnly
  const noResults = tab === 'offered' && filteredOffers.length === 0
  const changeSearch = () => setMode('form')

  if (mode === 'form') {
    return (
      <View style={styles.screen}>
        <View style={styles.formHeader}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeftIcon />
          </Pressable>
          <Text style={styles.headerTitle}>Search Rides</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
          <RouteFields query={query} onChange={updateQuery} />
          <DateTimeFields query={query} onChange={updateQuery} />

          {recentSearches.length > 0 && (
            <View>
              <Text style={styles.label}>Recent Searches</Text>
              <View style={{ gap: 8 }}>
                {recentSearches.map((s) => (
                  <Pressable
                    key={s.from + s.to}
                    style={styles.recentRow}
                    onPress={() => { updateQuery({ pickup: s.from, pickupSubtitle: 'Hyderabad', dropoff: s.to, dropoffSubtitle: 'Hyderabad' }); setMode('results') }}
                  >
                    <Text style={{ fontSize: 16 }}>🕐</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentRoute}>{s.from} → {s.to}</Text>
                      <Text style={styles.recentDate}>{s.date}</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.formFooter}>
          <Pressable
            style={[styles.primaryButton, (!query.pickup || !query.dropoff) && styles.disabledButton]}
            disabled={!query.pickup || !query.dropoff}
            onPress={() => setMode('results')}
          >
            <Text style={styles.primaryButtonText}>Search Rides</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.screen}>
      <View style={styles.resultsHeader}>
        <View style={styles.resultsHeaderRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeftIcon />
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={changeSearch}>
            <Text style={styles.routeSummary} numberOfLines={1}>{query.pickup || 'Pickup'} → {query.dropoff || 'Drop-off'}</Text>
            <Text style={styles.routeSummarySub}>{query.date || 'Today'} · {query.timeLabel || 'Any Time'} · Hyderabad</Text>
          </Pressable>
          <Pressable style={[styles.filterButton, filtersActive && styles.filterButtonActive]} onPress={() => setShowFilters(true)}>
            <FilterIcon color={filtersActive ? 'white' : colors.blue} />
            <Text style={[styles.filterButtonText, filtersActive && { color: 'white' }]}>{filtersActive ? 'Filtered ✓' : 'Filter'}</Text>
          </Pressable>
        </View>

        <View style={styles.tabRow}>
          {([
            { id: 'offered' as DiscoverTab, label: '🚗 Offered' },
            { id: 'requests' as DiscoverTab, label: '🧳 Requests' },
            { id: 'nearby' as DiscoverTab, label: '📍 Near Me' },
          ]).map((t) => (
            <Pressable key={t.id} style={[styles.tabButton, tab === t.id && styles.tabButtonActive]} onPress={() => setTab(t.id)}>
              <Text style={[styles.tabButtonText, tab === t.id && styles.tabButtonTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {MATCH_CATEGORIES.map((c) => (
            <Pressable key={c.id} style={[styles.categoryChip, category === c.id && styles.categoryChipActive]} onPress={() => setCategory(c.id)}>
              <Text style={[styles.categoryChipText, category === c.id && styles.categoryChipTextActive]}>{c.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {tab === 'offered' ? `${filteredOffers.length} offered rides` : tab === 'requests' ? `${(pendingRequestsQuery.data ?? []).length} requests waiting on you` : `${rideOffers.length} nearby matches`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {tab === 'offered' && (noResults
          ? <EmptyState onChangeSearch={changeSearch} onRequestRide={() => router.push('/post-ride')} />
          : filteredOffers.map((offer) => <RideOfferCard key={offer.id} offer={offer} onPress={() => router.push(`/ride/${offer.id}`)} />))}
        {tab === 'requests' && (
          <>
            {pendingRequestsQuery.isLoading && (
              <View style={styles.emptyState}>
                <ActivityIndicator color={colors.blue} />
              </View>
            )}
            {pendingRequestsQuery.isError && (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 32 }}>📡</Text>
                <Text style={styles.emptyTitle}>Can't reach ShareRide right now</Text>
                <Text style={styles.emptySub}>Check your connection and try again.</Text>
              </View>
            )}
            {pendingRequestsQuery.isSuccess && pendingRequestsQuery.data.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={{ fontSize: 32 }}>🧳</Text>
                <Text style={styles.emptyTitle}>No pending requests</Text>
                <Text style={styles.emptySub}>Passenger requests against your offered rides will show up here.</Text>
              </View>
            )}
            {pendingRequestsQuery.isSuccess && pendingRequestsQuery.data.map((match) => (
              <PendingRequestCard
                key={match.id}
                match={match}
                onAccept={() => acceptMutation.mutate(match.id)}
                onDecline={() => declineMutation.mutate(match.id)}
                onMessage={() => messageMutation.mutate(match.request.passengerId)}
                messaging={messageMutation.isPending && messageMutation.variables === match.request.passengerId}
                busy={
                  (acceptMutation.isPending && acceptMutation.variables === match.id) ||
                  (declineMutation.isPending && declineMutation.variables === match.id)
                }
              />
            ))}
          </>
        )}
        {tab === 'nearby' && (
          <>
            <View style={styles.nearbyBanner}>
              <Text style={{ fontSize: 22 }}>📍</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.nearbyTitle}>Rides within 2 km of you</Text>
                <Text style={styles.nearbySub}>Showing all route activity near {query.pickup || 'Madhapur'}</Text>
              </View>
            </View>
            {rideOffers.map((offer) => <RideOfferCard key={offer.id} offer={offer} onPress={() => router.push(`/ride/${offer.id}`)} />)}
          </>
        )}
      </ScrollView>

      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShowFilters(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>Filters</Text>

            <Text style={styles.label}>Verification</Text>
            <Pressable style={styles.toggleRow} onPress={() => setVerifiedOnly((v) => !v)}>
              <Text style={styles.toggleLabel}>Verified users only</Text>
              <View style={[styles.toggleTrack, verifiedOnly && styles.toggleTrackActive]}>
                <View style={[styles.toggleThumb, verifiedOnly && styles.toggleThumbActive]} />
              </View>
            </Pressable>

            <Text style={[styles.label, { marginTop: 16 }]}>Price Range</Text>
            <View style={styles.chipWrap}>
              {PRICE_BANDS.map((b) => (
                <Pressable key={b.id} style={[styles.bandChip, priceBandId === b.id && styles.bandChipActive]} onPress={() => setPriceBandId(b.id)}>
                  <Text style={[styles.bandChipText, priceBandId === b.id && styles.bandChipTextActive]}>{b.label}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.sheetActions}>
              <Pressable style={styles.cancelButton} onPress={() => setShowFilters(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.applyButton} onPress={() => setShowFilters(false)}>
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

function PendingRequestCard({ match, onAccept, onDecline, onMessage, messaging, busy }: {
  match: MatchWithRequestSummary
  onAccept: () => void
  onDecline: () => void
  onMessage: () => void
  messaging: boolean
  busy: boolean
}) {
  const label = computeMatchLabel(match)
  return (
    <View style={styles.requestCard}>
      <View style={styles.requestTopRow}>
        <Text style={styles.requestPassengerName}>{match.request.passengerName}</Text>
        <View style={[styles.requestMatchPill, { backgroundColor: matchColors[label].bg }]}>
          <Text style={[styles.requestMatchPillText, { color: matchColors[label].text }]}>{matchLabels[label]}</Text>
        </View>
      </View>
      <Text style={styles.requestRoute}>{match.request.origin} → {match.request.destination}</Text>
      <Text style={styles.requestMeta}>{match.request.preferredDate} · {match.request.preferredTimeStart} - {match.request.preferredTimeEnd}</Text>
      <Text style={styles.requestDistance}>Pickup {formatDistance(match.originDistanceMeters)}</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <Pressable style={[styles.declineButton, busy && styles.disabledButton]} disabled={busy} onPress={onDecline}>
          <Text style={styles.declineButtonText}>Decline</Text>
        </Pressable>
        <Pressable style={[styles.acceptButton, busy && styles.disabledButton]} disabled={busy} onPress={onAccept}>
          <Text style={styles.acceptButtonText}>✅ Accept</Text>
        </Pressable>
      </View>
      <Pressable style={[styles.messageButton, messaging && styles.disabledButton]} disabled={messaging} onPress={onMessage}>
        <Text style={styles.messageButtonText}>{messaging ? 'Opening…' : `💬 Message ${match.request.passengerName.split(' ')[0]}`}</Text>
      </Pressable>
    </View>
  )
}

function EmptyState({ onChangeSearch, onRequestRide }: { onChangeSearch: () => void; onRequestRide: () => void }) {
  return (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 40 }}>🔍</Text>
      <Text style={styles.emptyTitle}>No matching rides found</Text>
      <Text style={styles.emptySub}>Try changing your pickup, drop-off, date, or preferred time.</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <Pressable style={styles.emptySecondaryButton} onPress={onChangeSearch}>
          <Text style={styles.emptySecondaryText}>Change Search</Text>
        </Pressable>
        <Pressable style={styles.emptyPrimaryButton} onPress={onRequestRide}>
          <Text style={styles.emptyPrimaryText}>Request a Ride</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  formHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100, backgroundColor: 'white' },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.slate900 },
  label: { fontSize: 10, fontWeight: '700', color: colors.slate400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  recentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.slate50, borderRadius: radii.md, paddingHorizontal: 16, paddingVertical: 12, minHeight: 48 },
  recentRoute: { fontSize: 14, fontWeight: '600', color: colors.slate700 },
  recentDate: { fontSize: 11, color: colors.slate400 },
  formFooter: { padding: 20, borderTopWidth: 1, borderTopColor: colors.slate100 },
  primaryButton: { paddingVertical: 14, borderRadius: radii.xl, backgroundColor: colors.blue, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  disabledButton: { opacity: 0.4 },
  primaryButtonText: { color: 'white', fontWeight: '700', fontSize: 15 },
  resultsHeader: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.slate100, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 12 },
  resultsHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeSummary: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  routeSummarySub: { fontSize: 11, color: colors.slate400, marginTop: 2 },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, minHeight: 36, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.blueBorder },
  filterButtonActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  filterButtonText: { fontSize: 12, fontWeight: '600', color: colors.blue },
  tabRow: { flexDirection: 'row', backgroundColor: colors.slate50, borderRadius: radii.lg, padding: 2, borderWidth: 1, borderColor: colors.slate100 },
  tabButton: { flex: 1, paddingVertical: 8, borderRadius: radii.md, alignItems: 'center' },
  tabButtonActive: { backgroundColor: colors.blue },
  tabButtonText: { fontSize: 12, fontWeight: '700', color: colors.slate400 },
  tabButtonTextActive: { color: 'white' },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.slate200, backgroundColor: 'white' },
  categoryChipActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  categoryChipText: { fontSize: 12, fontWeight: '500', color: colors.slate600 },
  categoryChipTextActive: { color: 'white' },
  countRow: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  countText: { fontSize: 13, fontWeight: '600', color: colors.slate700 },
  nearbyBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.blueSoft, borderWidth: 1, borderColor: colors.blueBorder, borderRadius: radii.lg, padding: 12 },
  nearbyTitle: { fontSize: 13, fontWeight: '700', color: '#1E40AF' },
  nearbySub: { fontSize: 11, color: '#2563EB' },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.slate700, marginTop: 12, marginBottom: 6 },
  emptySub: { fontSize: 13, color: colors.slate400, textAlign: 'center', maxWidth: 240, lineHeight: 18 },
  emptySecondaryButton: { paddingHorizontal: 16, minHeight: 44, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  emptySecondaryText: { fontSize: 13, fontWeight: '600', color: colors.slate700 },
  emptyPrimaryButton: { paddingHorizontal: 16, minHeight: 44, borderRadius: radii.md, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  emptyPrimaryText: { fontSize: 13, fontWeight: '600', color: 'white' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.slate200, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: colors.slate900, marginBottom: 16 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 40 },
  toggleLabel: { fontSize: 14, color: colors.slate700 },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.slate300, justifyContent: 'center' },
  toggleTrackActive: { backgroundColor: colors.blue },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', marginLeft: 2 },
  toggleThumbActive: { marginLeft: 22 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bandChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200 },
  bandChipActive: { backgroundColor: colors.blue, borderColor: colors.blue },
  bandChipText: { fontSize: 12, fontWeight: '600', color: colors.slate600 },
  bandChipTextActive: { color: 'white' },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelButton: { flex: 1, paddingVertical: 12, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center' },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: colors.slate600 },
  applyButton: { flex: 1, paddingVertical: 12, borderRadius: radii.xl, backgroundColor: colors.blue, alignItems: 'center' },
  applyButtonText: { fontSize: 14, fontWeight: '700', color: 'white' },
  requestCard: { backgroundColor: 'white', borderRadius: radii.lg, padding: 16, gap: 6, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  requestTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  requestPassengerName: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  requestMatchPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill },
  requestMatchPillText: { fontSize: 10, fontWeight: '700' },
  requestRoute: { fontSize: 14, fontWeight: '600', color: colors.slate700 },
  requestMeta: { fontSize: 11, color: colors.slate500 },
  requestDistance: { fontSize: 11, color: colors.slate400 },
  declineButton: { flex: 1, paddingVertical: 10, borderRadius: radii.md, borderWidth: 1, borderColor: colors.redBorder, backgroundColor: colors.redSoft, alignItems: 'center' },
  declineButtonText: { fontSize: 12, fontWeight: '700', color: colors.red },
  acceptButton: { flex: 1, paddingVertical: 10, borderRadius: radii.md, backgroundColor: colors.green, alignItems: 'center' },
  acceptButtonText: { fontSize: 12, fontWeight: '700', color: 'white' },
  messageButton: { marginTop: 8, paddingVertical: 10, borderRadius: radii.md, alignItems: 'center', borderWidth: 1, borderColor: colors.blueBorder, backgroundColor: colors.blueSoft },
  messageButtonText: { fontSize: 12, fontWeight: '700', color: colors.blue },
})
