import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import Avatar from '../../components/Avatar'
import RouteFields from '../../components/RouteFields'
import RideRequestCard from '../../components/RideRequestCard'
import { BellIcon, SosIcon } from '../../components/icons'
import { currentUser, popularLocations, popularRoutes, recentSearches, rideOffers, rideRequests } from '../../lib/fixtures'
import { colors, matchColors, matchLabels, radii } from '../../lib/theme'
import { useSearchStore } from '../../store/search-store'
import { useAuthStore } from '../../store/auth-store'
import { api } from '../../lib/api'
import { NOTIFICATIONS_QUERY_KEY } from '../../lib/realtime/useNotificationsRealtimeSync'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function postedMinutesAgo(label: string): number {
  const m = /^(\d+)\s*(min|h)/.exec(label)
  if (!m) return 9999
  return m[2] === 'h' ? Number(m[1]) * 60 : Number(m[1])
}

// Ported from src/screens/HomeScreen.tsx (post-map-removal rework — see
// docs/migration-plan.md's "Home & Search rework" entry): header -> primary
// search card -> quick actions -> Latest Rides -> Recommended -> Popular
// Locations -> Popular Routes -> SOS/role-switch.
export default function HomeScreen() {
  const router = useRouter()
  const profile = useAuthStore((s) => s.profile)
  const session = useAuthStore((s) => s.session)
  // Real name/phone from GET /auth/me when the API is reachable; falls back
  // to the fixture display name only when it isn't (see auth-store.ts's
  // refreshProfile) — never a fabricated fixture identity for a real session.
  const displayName = profile?.fullName ?? session?.user.phone ?? currentUser.name
  const query = useSearchStore((s) => s.query)
  const updateQuery = useSearchStore((s) => s.updateQuery)
  const [driverMode, setDriverMode] = useState(false)

  const notificationsQuery = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => api.notifications.list(),
  })
  const unreadNotifications = notificationsQuery.data?.filter((n) => !n.read).length ?? 0

  const latestItems = [
    ...rideOffers.map((r) => ({ kind: 'offer' as const, item: r, minutesAgo: postedMinutesAgo(r.postedAtLabel) })),
    ...rideRequests.map((r) => ({ kind: 'request' as const, item: r, minutesAgo: postedMinutesAgo(r.postedAtLabel) })),
  ].sort((a, b) => a.minutesAgo - b.minutesAgo).slice(0, 4)

  const recommendedOffers = rideOffers.filter((r) =>
    recentSearches.some((s) => r.originShort === s.from && r.destinationShort === s.to),
  )
  const fallbackRoutes = recommendedOffers.length === 0 ? popularRoutes.slice(0, 2) : []

  const goToSearch = () => router.push('/discover')
  const goToDestination = (name: string, subtitle: string) => {
    updateQuery({ dropoff: name, dropoffSubtitle: subtitle })
    goToSearch()
  }
  const goToRoute = (from: string, to: string) => {
    updateQuery({ pickup: from, pickupSubtitle: 'Hyderabad', dropoff: to, dropoffSubtitle: 'Hyderabad' })
    goToSearch()
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <View style={styles.brandRow}>
              <View style={styles.brandIcon}><Text style={{ color: 'white', fontSize: 12 }}>SR</Text></View>
              <Text style={styles.brandText}>Share<Text style={{ color: colors.blue }}>Ride</Text></Text>
            </View>
            <Text style={styles.cityText}>📍 Hyderabad</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton} onPress={() => router.push('/notifications')} accessibilityLabel={unreadNotifications > 0 ? `Notifications, ${unreadNotifications} unread` : 'Notifications'}>
              <BellIcon />
              {unreadNotifications > 0 && (
                <View style={styles.notificationDot}>
                  <Text style={styles.notificationDotText}>{unreadNotifications > 9 ? '9+' : unreadNotifications}</Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={() => router.push('/profile')}>
              <Avatar uri={currentUser.avatarUrl} name={displayName} size={40} />
            </Pressable>
          </View>
        </View>
        <Text style={styles.greeting}>{getGreeting()}, <Text style={styles.greetingName}>{displayName.split(' ')[0]}</Text> 👋</Text>
      </View>

      <View style={styles.searchSection}>
        <Text style={styles.sectionTitleLg}>Where do you want to go?</Text>
        <RouteFields query={query} onChange={updateQuery} />
        <Pressable
          style={[styles.searchButton, (!query.pickup || !query.dropoff) && styles.disabledButton]}
          disabled={!query.pickup || !query.dropoff}
          onPress={goToSearch}
        >
          <Text style={styles.searchButtonText}>Search Rides</Text>
        </Pressable>

        <View style={styles.quickActionsRow}>
          <Pressable style={styles.quickActionBlue} onPress={goToSearch}>
            <Text style={styles.quickActionText}>🧳 Request a Ride</Text>
          </Pressable>
          <Pressable style={styles.quickActionGreen} onPress={() => router.push('/post-ride')}>
            <Text style={[styles.quickActionText, { color: colors.green }]}>🚗 Offer a Ride</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Latest Rides</Text>
          <Pressable onPress={goToSearch}><Text style={styles.seeAll}>See all →</Text></Pressable>
        </View>
        <View style={{ gap: 12 }}>
          {latestItems.map(({ kind, item }) =>
            kind === 'offer' ? (
              <Pressable key={item.id} style={styles.latestCard} onPress={() => router.push(`/ride/${item.id}`)}>
                <View style={styles.latestRow}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.latestTitleRow}>
                      <Text style={styles.latestTitle} numberOfLines={1}>{item.originShort} → {item.destinationShort}</Text>
                      {item.driver.verified && <Text style={styles.verifiedChip}>✓ Verified</Text>}
                    </View>
                    <Text style={styles.latestMeta}>{item.departureDateLabel} · {item.departureTimeLabel} · ⭐ {item.driver.rating}</Text>
                    <Text style={styles.latestPosted}>Posted {item.postedAtLabel}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    {item.matchScore && (
                      <View style={[styles.matchPill, { backgroundColor: matchColors[item.matchScore].bg }]}>
                        <Text style={[styles.matchPillText, { color: matchColors[item.matchScore].text }]}>{matchLabels[item.matchScore]}</Text>
                      </View>
                    )}
                    <Text style={styles.viewLink}>View Ride →</Text>
                  </View>
                </View>
              </Pressable>
            ) : (
              <RideRequestCard key={item.id} request={item} onPress={goToSearch} />
            ),
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <View style={{ gap: 12 }}>
          {recommendedOffers.map((r) => (
            <Pressable key={r.id} style={styles.recommendedCard} onPress={() => router.push(`/ride/${r.id}`)}>
              <View style={styles.latestTitleRow}>
                <Text style={styles.latestTitle}>{r.originShort} → {r.destinationShort}</Text>
                <Text style={styles.matchesUsualBadge}>Matches your usual route</Text>
              </View>
              <Text style={styles.latestMeta}>{r.departureDateLabel} · {r.departureTimeLabel}</Text>
            </Pressable>
          ))}
          {fallbackRoutes.map(({ from, to }) => (
            <Pressable key={from + to} style={styles.recommendedCardMuted} onPress={() => goToRoute(from, to)}>
              <View style={styles.latestTitleRow}>
                <Text style={styles.latestTitle}>{from} → {to}</Text>
                <Text style={styles.popularBadge}>Popular in Hyderabad</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Locations</Text>
        <View style={styles.chipWrap}>
          {popularLocations.map((loc) => (
            <Pressable key={loc.name} style={styles.locationChip} onPress={() => goToDestination(loc.name, loc.subtitle)}>
              <Text style={styles.locationChipText}>{loc.name}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Popular Routes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {popularRoutes.map(({ from, to }) => (
            <Pressable key={from + to} style={styles.routeChip} onPress={() => goToRoute(from, to)}>
              <Text style={styles.routeChipText}>{from} → {to}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={[styles.section, styles.footerRow]}>
        <Pressable style={styles.sosButton} onPress={() => router.push('/sos')}>
          <SosIcon />
          <Text style={styles.sosText}>SOS</Text>
        </Pressable>
        <View style={styles.modeSwitch}>
          {(['passenger', 'driver'] as const).map((mode) => (
            <Pressable
              key={mode}
              style={[styles.modeButton, (driverMode ? 'driver' : 'passenger') === mode && styles.modeButtonActive]}
              onPress={() => setDriverMode((m) => !m)}
            >
              <Text style={[styles.modeButtonText, (driverMode ? 'driver' : 'passenger') === mode && styles.modeButtonTextActive]}>
                {mode === 'passenger' ? '🧳' : '🚗'} {mode}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: 'white', paddingTop: 16, paddingHorizontal: 20, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandIcon: { width: 28, height: 28, borderRadius: 10, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: 16, fontWeight: '800', color: colors.slate900 },
  cityText: { fontSize: 11, color: colors.slate600, fontWeight: '500', marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate100, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notificationDot: { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: '#DC2626', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3, borderWidth: 1.5, borderColor: 'white' },
  notificationDotText: { fontSize: 9, fontWeight: '800', color: 'white' },
  greeting: { fontSize: 14, color: colors.slate600, fontWeight: '500', paddingTop: 8, paddingBottom: 4 },
  greetingName: { fontWeight: '700', color: colors.slate900 },
  searchSection: { backgroundColor: 'white', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 8, borderBottomColor: colors.slate50 },
  sectionTitleLg: { fontSize: 18, fontWeight: '800', color: colors.slate900, marginBottom: 12 },
  searchButton: { marginTop: 12, paddingVertical: 14, borderRadius: radii.xl, backgroundColor: colors.blue, alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  disabledButton: { opacity: 0.4 },
  searchButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  quickActionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  quickActionBlue: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: radii.xl, backgroundColor: colors.blueSoft, borderWidth: 1, borderColor: colors.blueBorder, minHeight: 48 },
  quickActionGreen: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: radii.xl, backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: colors.greenBorder, minHeight: 48 },
  quickActionText: { fontSize: 13, fontWeight: '700', color: colors.blue },
  section: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.slate900, marginBottom: 12 },
  seeAll: { fontSize: 12, fontWeight: '700', color: colors.blue },
  latestCard: { backgroundColor: 'white', borderRadius: radii.lg, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  latestRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  latestTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  latestTitle: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  verifiedChip: { fontSize: 9, fontWeight: '600', color: colors.blue, backgroundColor: colors.blueSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill },
  latestMeta: { fontSize: 11, color: colors.slate500, marginTop: 2 },
  latestPosted: { fontSize: 10, color: colors.slate400, marginTop: 2 },
  matchPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill, marginBottom: 4 },
  matchPillText: { fontSize: 9, fontWeight: '700' },
  viewLink: { fontSize: 12, fontWeight: '600', color: colors.blue },
  recommendedCard: { backgroundColor: 'white', borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.blueSoft },
  recommendedCardMuted: { backgroundColor: 'white', borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.slate100 },
  matchesUsualBadge: { fontSize: 9, fontWeight: '700', color: colors.blue, backgroundColor: colors.blueSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill },
  popularBadge: { fontSize: 9, fontWeight: '700', color: colors.slate500, backgroundColor: colors.slate50, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  locationChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.md, backgroundColor: 'white', borderWidth: 1, borderColor: colors.slate100, minHeight: 44, justifyContent: 'center' },
  locationChipText: { fontSize: 12, fontWeight: '600', color: colors.slate700 },
  routeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 12, minHeight: 44 },
  routeChipText: { fontSize: 12, fontWeight: '700', color: colors.slate700 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sosButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, minHeight: 44, borderRadius: radii.md, backgroundColor: colors.red, justifyContent: 'center' },
  sosText: { color: 'white', fontWeight: '700', fontSize: 12 },
  modeSwitch: { flexDirection: 'row', backgroundColor: colors.slate100, borderRadius: radii.lg, padding: 4 },
  modeButton: { paddingHorizontal: 12, minHeight: 36, borderRadius: radii.md, justifyContent: 'center' },
  modeButtonActive: { backgroundColor: colors.blue },
  modeButtonText: { fontSize: 11, fontWeight: '700', color: colors.slate500, textTransform: 'capitalize' },
  modeButtonTextActive: { color: 'white' },
})
