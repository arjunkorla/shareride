import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Avatar from '../components/Avatar'
import { rideOffers } from '../lib/fixtures'
import { colors, matchLabels, radii } from '../lib/theme'

// Consolidates src/screens/BookingConfirmationScreen.tsx (type=requested)
// and src/screens/SuccessScreen.tsx (type=published) into one parametrized
// route, per docs/migration-plan.md's rename of the legacy "booking" name —
// this screen already avoided booking/seat language, only the filename did.
export default function SuccessScreen() {
  const router = useRouter()
  const { type, rideId } = useLocalSearchParams<{ type?: string; rideId?: string }>()
  const isRequested = type !== 'published'
  const offer = rideOffers.find((r) => r.id === rideId) || rideOffers[0]
  const requestCode = `SR-REQ-${offer.id.toUpperCase()}-2026`

  if (isRequested) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.heroDark}>
          <View style={styles.heroIconWrap}>
            <Text style={{ fontSize: 32 }}>✈️</Text>
          </View>
          <Text style={styles.heroTitle}>Request Sent!</Text>
          <Text style={styles.heroSub}>The driver will confirm your ride shortly.</Text>
          <View style={styles.codePill}>
            <Text style={styles.codePillLabel}>Request ID</Text>
            <Text style={styles.codePillValue}>{requestCode}</Text>
          </View>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.timelineLabel}>What happens next</Text>
          {[
            { step: '✉️', label: 'Request Sent', done: true },
            { step: '⏳', label: 'Waiting for Driver Acceptance', done: false },
            { step: '✅', label: 'Ride Confirmed', done: false },
            { step: '🚗', label: 'Driver Arriving', done: false },
          ].map(({ step, label, done }) => (
            <View key={label} style={styles.timelineRow}>
              <View style={[styles.timelineStepIcon, done && styles.timelineStepIconDone]}>
                <Text style={{ fontSize: 15 }}>{step}</Text>
              </View>
              <Text style={[styles.timelineStepLabel, done && styles.timelineStepLabelDone]}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.contentPad}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeaderRow}>
              <Avatar uri={offer.driver.avatarUrl} name={offer.driver.name} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryName}>{offer.driver.name}</Text>
                <Text style={styles.summaryDim}>⭐ {offer.driver.rating} · {offer.driver.totalTrips} rides</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.summaryDimSmall}>Vehicle</Text>
                <Text style={styles.summaryVehicle}>{offer.vehicle.make} {offer.vehicle.model}</Text>
              </View>
            </View>

            <View style={styles.summaryRouteRow}>
              <View style={styles.summaryRail}>
                <View style={styles.railDotOutline} />
                <View style={styles.railLine} />
                <View style={styles.railDotFilled} />
              </View>
              <View style={{ flex: 1, justifyContent: 'space-between' }}>
                <View>
                  <Text style={styles.summaryCity}>{offer.origin}</Text>
                  <Text style={styles.summaryDimSmall}>{offer.departureDateLabel} · {offer.departureTimeLabel}</Text>
                </View>
                <View>
                  <Text style={styles.summaryCity}>{offer.destination}</Text>
                  <Text style={styles.summaryDimSmall}>{offer.durationLabel} · {offer.distanceLabel}</Text>
                </View>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Price</Text>
                <Text style={styles.statValueBlue}>₹{offer.pricePerPerson}</Text>
                <Text style={styles.statSub}>per person</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Status</Text>
                <Text style={styles.statValueBlue}>Pending</Text>
                <Text style={styles.statSub}>awaiting driver</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Match</Text>
                <Text style={styles.statValueGreen}>{offer.matchScore ? matchLabels[offer.matchScore] : '—'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <Pressable
              style={styles.trackButton}
              onPress={() => router.push(`/ride-tracking?tripId=${offer.id}`)}
            >
              <Text style={styles.trackButtonText}>Track Ride</Text>
            </Pressable>
            <Pressable style={styles.doneButton} onPress={() => router.push('/(tabs)/my-rides')}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    )
  }

  return (
    <View style={styles.publishedScreen}>
      <View style={styles.publishedIconWrap}>
        <Text style={{ fontSize: 44 }}>✅</Text>
      </View>
      <Text style={styles.publishedTitle}>Ride Published!</Text>
      <Text style={styles.publishedSub}>
        Your offered ride is live! Passengers on matching routes can now send you a ride request.
      </Text>

      <View style={styles.publishedInfoCard}>
        {[
          { icon: '🗺️', label: `${offer.origin} → ${offer.destination}` },
          { icon: '📅', label: `${offer.departureDateLabel} · ${offer.departureTimeLabel}` },
          { icon: '📢', label: 'Visible to matching passengers' },
          { icon: '🔔', label: 'Notify me when someone requests' },
        ].map(({ icon, label }) => (
          <View key={label} style={styles.publishedInfoRow}>
            <Text style={{ fontSize: 15 }}>{icon}</Text>
            <Text style={styles.publishedInfoText}>{label}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.publishedButton} onPress={() => router.push('/(tabs)')}>
        <Text style={styles.publishedButtonText}>Done</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  heroDark: { backgroundColor: colors.slate900, alignItems: 'center', paddingTop: 56, paddingBottom: 32, paddingHorizontal: 24 },
  heroIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: 'white', marginBottom: 4 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center' },
  codePill: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.lg, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  codePillLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  codePillValue: { fontSize: 13, fontWeight: '700', color: 'white', letterSpacing: 0.5 },
  timelineCard: { margin: 16, backgroundColor: 'white', borderRadius: radii.lg, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  timelineLabel: { fontSize: 10, fontWeight: '700', color: colors.slate400, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  timelineStepIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  timelineStepIconDone: { backgroundColor: colors.blueSoft, borderColor: colors.blueBorder },
  timelineStepLabel: { fontSize: 13, color: colors.slate400 },
  timelineStepLabelDone: { color: colors.blueDark, fontWeight: '600' },
  contentPad: { paddingHorizontal: 16, gap: 16 },
  summaryCard: { backgroundColor: 'white', borderRadius: radii.xl, padding: 20, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3, gap: 16 },
  summaryHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  summaryName: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  summaryDim: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  summaryDimSmall: { fontSize: 11, color: colors.slate400 },
  summaryVehicle: { fontSize: 12, fontWeight: '600', color: colors.slate700, marginTop: 2 },
  summaryRouteRow: { flexDirection: 'row', gap: 12 },
  summaryRail: { alignItems: 'center', gap: 4, paddingTop: 4 },
  railDotOutline: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.blue, backgroundColor: 'white' },
  railLine: { width: 2, height: 32, backgroundColor: colors.slate200 },
  railDotFilled: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.blue },
  summaryCity: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  statRow: { flexDirection: 'row', gap: 12 },
  statBox: { flex: 1, backgroundColor: colors.slate50, borderRadius: radii.lg, paddingVertical: 10, alignItems: 'center' },
  statLabel: { fontSize: 9, color: colors.slate400, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValueBlue: { fontSize: 14, fontWeight: '800', color: colors.blue, marginTop: 3 },
  statValueGreen: { fontSize: 13, fontWeight: '800', color: colors.green, marginTop: 3, textAlign: 'center' },
  statSub: { fontSize: 9, color: colors.slate400, marginTop: 2 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  trackButton: { flex: 1, paddingVertical: 14, borderRadius: radii.xl, backgroundColor: colors.blue, alignItems: 'center' },
  trackButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  doneButton: { flex: 1, paddingVertical: 14, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center' },
  doneButtonText: { color: colors.slate700, fontWeight: '700', fontSize: 14 },
  publishedScreen: { flex: 1, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  publishedIconWrap: { width: 112, height: 112, borderRadius: 56, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  publishedTitle: { fontSize: 26, fontWeight: '800', color: colors.greenDark, marginBottom: 10, textAlign: 'center' },
  publishedSub: { fontSize: 13, color: colors.greenDark, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  publishedInfoCard: { width: '100%', backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: radii.lg, borderWidth: 1, borderColor: colors.greenBorder, padding: 16, gap: 10, marginBottom: 24 },
  publishedInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  publishedInfoText: { fontSize: 13, color: colors.slate700, flexShrink: 1 },
  publishedButton: { width: '100%', paddingVertical: 15, borderRadius: radii.xl, backgroundColor: colors.green, alignItems: 'center' },
  publishedButtonText: { color: 'white', fontWeight: '700', fontSize: 15 },
})
