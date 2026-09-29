import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Avatar from '../../components/Avatar'
import StarRating from '../../components/StarRating'
import { amenityIcon, ChevronLeftIcon, VerifiedIcon } from '../../components/icons'
import { drivers, reviews, rideOffers } from '../../lib/fixtures'
import { colors, radii } from '../../lib/theme'

// Ported from src/screens/PublicProfileScreen.tsx. Reads driver-owned
// offer(s) for vehicle/amenity display; "Book a Ride" becomes "Send
// Request" and links to a specific offer, matching the no-seats model.
export default function PublicProfileScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const driver = drivers.find((d) => d.id === id) || drivers[0]
  const offer = rideOffers.find((r) => r.driver.id === driver.id)

  const stats = [
    { value: String(driver.rating), label: 'Rating' },
    { value: String(driver.totalTrips), label: 'Trips' },
    { value: `${driver.yearsActive}yr`, label: 'Active' },
  ]

  const amenities = offer
    ? [
        offer.preferences.acAvailable && 'AC',
        offer.preferences.womenOnly && 'Women Preferred',
        offer.preferences.luggageSpace && 'Luggage Space',
        offer.preferences.petsOk && 'Pets OK',
        offer.preferences.silentRide && 'Silent Ride',
      ].filter((a): a is string => Boolean(a))
    : []

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.hero}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon color="white" />
        </Pressable>
        {driver.verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
          </View>
        )}

        <View style={styles.avatarWrap}>
          <Avatar uri={driver.avatarUrl} name={driver.name} size={96} />
          <View style={styles.avatarCheck}>
            <VerifiedIcon size={22} />
          </View>
        </View>

        <Text style={styles.heroName}>{driver.name}</Text>
        <Text style={styles.heroSub}>Member since {driver.memberSinceLabel}</Text>

        <View style={styles.statsRow}>
          {stats.map(({ value, label }) => (
            <View key={label} style={{ alignItems: 'center' }}>
              <Text style={styles.statValue}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.bioBox}>
          <Text style={styles.bioText}>"{driver.bio}"</Text>
        </View>

        <View style={{ gap: 4 }}>
          <InfoRow icon="🌍" label="Languages" value={driver.languages.join(', ')} />
          <InfoRow icon="⏱️" label="Response time" value={driver.responseTimeLabel} />
          {offer && (
            <>
              <InfoRow icon="🚗" label="Vehicle" value={`${offer.vehicle.make} ${offer.vehicle.model} (${offer.vehicle.year})`} />
              <InfoRow icon="⛽" label="Fuel type" value={offer.vehicle.fuelType} />
            </>
          )}
        </View>

        {amenities.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Ride Amenities</Text>
            <View style={styles.chipWrap}>
              {amenities.map((a) => (
                <View key={a} style={styles.amenityChip}>
                  <Text style={styles.amenityText}>{amenityIcon(a)} {a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View>
          <Text style={styles.sectionLabel}>Recent Reviews</Text>
          <View style={{ gap: 12 }}>
            {reviews.map((rv) => (
              <View key={rv.id} style={styles.reviewRow}>
                <Avatar uri={rv.authorAvatarUrl} name={rv.authorName} size={36} />
                <View style={{ flex: 1 }}>
                  <View style={styles.reviewHeaderRow}>
                    <Text style={styles.reviewAuthor}>{rv.authorName}</Text>
                    <StarRating rating={rv.rating} size={10} />
                  </View>
                  <Text style={styles.reviewComment}>{rv.comment}</Text>
                  <Text style={styles.reviewDate}>{rv.dateLabel}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Pressable style={styles.messageButton} onPress={() => router.push(`/chat/${driver.id}`)}>
            <Text style={styles.messageButtonText}>Message</Text>
          </Pressable>
          {offer && (
            <Pressable style={styles.requestButton} onPress={() => router.push(`/payment?rideId=${offer.id}`)}>
              <Text style={styles.requestButtonText}>Send Request</Text>
            </Pressable>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: colors.slate900, alignItems: 'center', paddingTop: 56, paddingBottom: 28, paddingHorizontal: 20 },
  backButton: { position: 'absolute', top: 48, left: 16, width: 36, height: 36, borderRadius: radii.md, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  verifiedBadge: { position: 'absolute', top: 48, right: 16, backgroundColor: 'rgba(34,197,94,0.2)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)', borderRadius: radii.md, paddingHorizontal: 10, paddingVertical: 5 },
  verifiedBadgeText: { fontSize: 10, fontWeight: '700', color: '#4ADE80' },
  avatarWrap: { marginBottom: 12 },
  avatarCheck: { position: 'absolute', bottom: -2, right: -2, backgroundColor: colors.slate900, borderRadius: 14, padding: 2 },
  heroName: { fontSize: 20, fontWeight: '800', color: 'white', marginBottom: 2 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 32 },
  statValue: { fontSize: 22, fontWeight: '800', color: 'white' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  content: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -20, paddingHorizontal: 20, paddingTop: 20, gap: 20 },
  bioBox: { backgroundColor: colors.slate50, borderRadius: radii.lg, padding: 16 },
  bioText: { fontSize: 13, color: colors.slate600, lineHeight: 19 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  infoIcon: { fontSize: 17, width: 28 },
  infoLabel: { flex: 1, fontSize: 13, color: colors.slate500 },
  infoValue: { fontSize: 13, fontWeight: '600', color: colors.slate700 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip: { backgroundColor: colors.blueSoft, borderWidth: 1, borderColor: colors.blueBorder, borderRadius: radii.md, paddingHorizontal: 10, paddingVertical: 6 },
  amenityText: { fontSize: 12, fontWeight: '600', color: colors.blue },
  reviewRow: { flexDirection: 'row', gap: 12 },
  reviewHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewAuthor: { fontSize: 13, fontWeight: '700', color: colors.slate700 },
  reviewComment: { fontSize: 12, color: colors.slate500, marginTop: 3, lineHeight: 17 },
  reviewDate: { fontSize: 10, color: colors.slate400, marginTop: 3 },
  actionsRow: { flexDirection: 'row', gap: 12, paddingTop: 4, paddingBottom: 8 },
  messageButton: { flex: 1, paddingVertical: 14, borderRadius: radii.xl, borderWidth: 2, borderColor: colors.blue, alignItems: 'center' },
  messageButtonText: { color: colors.blue, fontWeight: '700', fontSize: 14 },
  requestButton: { flex: 2, paddingVertical: 14, borderRadius: radii.xl, backgroundColor: colors.blue, alignItems: 'center' },
  requestButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
})
