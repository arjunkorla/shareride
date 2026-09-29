import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MatchWithOfferSummary } from '@shareride/api-client'
import { colors, matchColors, matchLabels, radii } from '../../lib/theme'
import { api } from '../../lib/api'
import { computeMatchLabel, formatDistance } from '../../lib/matchLabel'
import { ChevronLeftIcon } from '../../components/icons'

// New Phase 8 screen: a passenger's real candidate matches for one of
// their own RideRequests (from Phase 7's matching engine), with a real
// "Send Request" action per candidate. Reached from my-rides.tsx's
// Upcoming tab rather than routed through ride/[id].tsx — that screen is
// still entirely fixture-driven (no public "browse any offer" endpoint
// exists yet), so bolting a second, real data path onto it would mean
// half-fixture/half-real logic in one already-large file. This is the
// same "adapt the flow to what real data actually supports" pattern
// Phase 5/6 used (lib/geocoding.ts, the vehicles module) — see
// docs/migration-plan.md's Phase 8 entry for the reasoning.
export default function RequestMatchesScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { requestId } = useLocalSearchParams<{ requestId: string }>()
  const queryClient = useQueryClient()

  const matchesQuery = useQuery({
    queryKey: ['matches', 'for-request', requestId],
    queryFn: () => api.matches.listForRideRequest(requestId),
  })
  const requestMutation = useMutation({
    mutationFn: (matchId: string) => api.matches.request(matchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matches', 'for-request', requestId] })
      queryClient.invalidateQueries({ queryKey: ['ride-requests'] })
    },
  })
  // ChatService.start() (apps/api/src/chat/chat.service.ts) only allows
  // this once a real (non-SUGGESTED) Match connects the two users — same
  // rule this screen already enforces client-side by only showing the
  // button once matchStatus has moved past SUGGESTED.
  const messageMutation = useMutation({
    mutationFn: (driverId: string) => api.chat.start(driverId),
    onSuccess: (conversation) => router.push(`/chat/${conversation.id}`),
  })

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Candidate Matches</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {matchesQuery.isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.blue} />
          </View>
        )}
        {matchesQuery.isError && (
          <View style={styles.centerState}>
            <Text style={{ fontSize: 32 }}>📡</Text>
            <Text style={styles.emptyTitle}>Can't reach ShareRide right now</Text>
            <Text style={styles.emptySub}>Check your connection and try again.</Text>
          </View>
        )}
        {matchesQuery.isSuccess && matchesQuery.data.length === 0 && (
          <View style={styles.centerState}>
            <Text style={{ fontSize: 32 }}>🔍</Text>
            <Text style={styles.emptyTitle}>No candidate matches yet</Text>
            <Text style={styles.emptySub}>We'll keep looking for drivers heading your way.</Text>
          </View>
        )}
        {matchesQuery.isSuccess && matchesQuery.data.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            onSendRequest={() => requestMutation.mutate(match.id)}
            sending={requestMutation.isPending && requestMutation.variables === match.id}
            onMessage={() => messageMutation.mutate(match.offer.driverId)}
            messaging={messageMutation.isPending && messageMutation.variables === match.offer.driverId}
          />
        ))}
      </ScrollView>
    </View>
  )
}

function MatchCard({ match, onSendRequest, sending, onMessage, messaging }: {
  match: MatchWithOfferSummary
  onSendRequest: () => void
  sending: boolean
  onMessage: () => void
  messaging: boolean
}) {
  const label = computeMatchLabel(match)
  const canRequest = match.matchStatus === 'SUGGESTED'
  const canMessage = match.matchStatus !== 'SUGGESTED'

  return (
    <View style={styles.card}>
      <View style={styles.cardTopRow}>
        <Text style={styles.driverName}>{match.offer.driverName}</Text>
        <View style={[styles.matchPill, { backgroundColor: matchColors[label].bg }]}>
          <Text style={[styles.matchPillText, { color: matchColors[label].text }]}>{matchLabels[label]}</Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <Text style={styles.routeText}>{match.offer.origin} → {match.offer.destination}</Text>
        <Text style={styles.routeMeta}>{match.offer.departureDate} · {match.offer.departureTime}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.priceText}>₹{match.offer.pricePerPerson} / person</Text>
        <Text style={styles.distanceText}>Pickup {formatDistance(match.originDistanceMeters)}</Text>
      </View>

      {match.matchStatus !== 'SUGGESTED' && (
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{formatStatus(match.matchStatus)}</Text>
        </View>
      )}

      {canRequest && (
        <Pressable style={[styles.requestButton, sending && styles.requestButtonDisabled]} disabled={sending} onPress={onSendRequest}>
          <Text style={styles.requestButtonText}>{sending ? 'Sending…' : 'Send Request'}</Text>
        </Pressable>
      )}

      {canMessage && (
        <Pressable style={[styles.messageButton, messaging && styles.requestButtonDisabled]} disabled={messaging} onPress={onMessage}>
          <Text style={styles.messageButtonText}>{messaging ? 'Opening…' : `💬 Message ${match.offer.driverName.split(' ')[0]}`}</Text>
        </Pressable>
      )}
    </View>
  )
}

function formatStatus(status: string): string {
  switch (status) {
    case 'REQUESTED': return 'Request sent — waiting on the driver'
    case 'CONFIRMED': return '✅ Confirmed'
    case 'DECLINED': return 'Declined by driver'
    case 'CANCELLED': return 'No longer available'
    case 'EXPIRED': return 'Expired'
    default: return status
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.slate900 },
  centerState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.slate700 },
  emptySub: { fontSize: 13, color: colors.slate400, textAlign: 'center', maxWidth: 240, lineHeight: 18 },
  card: { backgroundColor: 'white', borderRadius: radii.lg, padding: 16, gap: 10, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  driverName: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  matchPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill },
  matchPillText: { fontSize: 10, fontWeight: '700' },
  routeRow: { gap: 2 },
  routeText: { fontSize: 14, fontWeight: '600', color: colors.slate700 },
  routeMeta: { fontSize: 11, color: colors.slate500 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceText: { fontSize: 13, fontWeight: '700', color: colors.slate900 },
  distanceText: { fontSize: 11, color: colors.slate400 },
  statusBadge: { backgroundColor: colors.slate50, borderRadius: radii.md, paddingVertical: 8, alignItems: 'center' },
  statusBadgeText: { fontSize: 12, fontWeight: '600', color: colors.slate600 },
  requestButton: { backgroundColor: colors.blue, borderRadius: radii.md, paddingVertical: 12, alignItems: 'center' },
  requestButtonDisabled: { opacity: 0.6 },
  requestButtonText: { fontSize: 13, fontWeight: '700', color: 'white' },
  messageButton: { borderRadius: radii.md, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.blueBorder, backgroundColor: colors.blueSoft },
  messageButtonText: { fontSize: 13, fontWeight: '700', color: colors.blue },
})
