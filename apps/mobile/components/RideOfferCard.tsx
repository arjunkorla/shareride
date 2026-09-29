import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import type { RideOfferView } from '../lib/fixtures'
import { colors, matchColors, matchLabels, radii } from '../lib/theme'
import { amenityIcon, ChatBubbleIcon, LightningIcon, VerifiedIcon } from './icons'
import StarRating from './StarRating'

interface Props {
  offer: RideOfferView
  onPress?: () => void
}

// Ported from src/components/RideCard.tsx. "Send Request" replaces any
// booking language, and there is no seat count anywhere on this card.
export default function RideOfferCard({ offer, onPress }: Props) {
  const match = offer.matchScore ? matchColors[offer.matchScore] : null

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: offer.driver.avatarUrl }} style={styles.avatar} />
          {offer.driver.verified && (
            <View style={styles.verifiedBadge}>
              <VerifiedIcon />
            </View>
          )}
        </View>
        <View style={styles.driverInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.driverName} numberOfLines={1}>{offer.driver.name}</Text>
            {offer.preferences.autoConfirm && (
              <View style={styles.instantBadge}>
                <LightningIcon />
                <Text style={styles.instantText}>Instant</Text>
              </View>
            )}
          </View>
          <View style={styles.ratingRow}>
            <StarRating rating={offer.driver.rating} size={11} />
            <Text style={styles.ratingText}>{offer.driver.rating}</Text>
            <Text style={styles.dimText}>({offer.reviewCount})</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.dimText}>{offer.vehicle.make} {offer.vehicle.model}</Text>
          </View>
        </View>
        <View style={styles.priceWrap}>
          <Text style={styles.price}>₹{offer.pricePerPerson}</Text>
          <Text style={styles.priceSub}>per person</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.routeRow}>
        <View style={styles.timeline}>
          <View style={styles.dotBlue} />
          <View style={styles.timelineLine} />
          <View style={styles.squareOutline} />
        </View>
        <View style={styles.routeLabels}>
          <View>
            <Text style={styles.routeCity}>{offer.originShort}</Text>
            <Text style={styles.routeMeta}>{offer.departureDateLabel} · {offer.departureTimeLabel}</Text>
          </View>
          <View>
            <Text style={styles.routeCity}>{offer.destinationShort}</Text>
            <Text style={styles.routeMeta}>{offer.durationLabel} · {offer.distanceLabel}</Text>
          </View>
        </View>
        <View style={styles.matchWrap}>
          {match && offer.matchScore && (
            <View style={[styles.matchPill, { backgroundColor: match.bg }]}>
              <Text style={[styles.matchPillText, { color: match.text }]}>{matchLabels[offer.matchScore]}</Text>
            </View>
          )}
          {offer.pickupProximityLabel && <Text style={styles.proximity}>📍 {offer.pickupProximityLabel}</Text>}
        </View>
      </View>

      <View style={styles.amenitiesRow}>
        {[
          offer.preferences.acAvailable && 'AC',
          offer.preferences.womenOnly && 'Women Preferred',
          offer.preferences.luggageSpace && 'Luggage Space',
          offer.preferences.petsOk && 'Pets OK',
          offer.preferences.silentRide && 'Silent Ride',
        ].filter((a): a is string => Boolean(a)).slice(0, 4).map((a) => (
          <View key={a} style={styles.amenityChip}>
            <Text style={styles.amenityText}>{amenityIcon(a)} {a}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.primaryButton} onPress={onPress}>
          <Text style={styles.primaryButtonText}>{offer.preferences.autoConfirm ? '⚡ Send Request' : '✉️ Send Request'}</Text>
        </Pressable>
        <View style={styles.iconButton}>
          <ChatBubbleIcon size={16} color={colors.slate500} />
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: radii.lg, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  avatarWrap: { marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.slate100 },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2 },
  driverInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  driverName: { fontSize: 14, fontWeight: '600', color: colors.slate900 },
  instantBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#ECFDF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill },
  instantText: { fontSize: 9, fontWeight: '700', color: colors.green },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 11, fontWeight: '600', color: colors.slate700 },
  dimText: { fontSize: 11, color: colors.slate400 },
  dot: { color: colors.slate300 },
  priceWrap: { alignItems: 'flex-end', marginLeft: 8 },
  price: { fontSize: 20, fontWeight: '800', color: colors.slate900 },
  priceSub: { fontSize: 10, color: colors.slate400 },
  divider: { borderTopWidth: 1, borderTopColor: colors.slate50, marginHorizontal: 16 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  timeline: { alignItems: 'center', marginTop: 4 },
  dotBlue: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue },
  timelineLine: { width: 2, height: 32, backgroundColor: colors.slate200, marginVertical: 4 },
  squareOutline: { width: 8, height: 8, borderRadius: 2, borderWidth: 2, borderColor: colors.blue, backgroundColor: 'white' },
  routeLabels: { flex: 1, gap: 8 },
  routeCity: { fontSize: 14, fontWeight: '600', color: colors.slate900 },
  routeMeta: { fontSize: 11, color: colors.slate500, marginTop: 2 },
  matchWrap: { alignItems: 'flex-end', gap: 4 },
  matchPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill },
  matchPillText: { fontSize: 9, fontWeight: '700' },
  proximity: { fontSize: 10, color: colors.slate400 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingHorizontal: 16, paddingBottom: 12 },
  amenityChip: { backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate100, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 },
  amenityText: { fontSize: 10, color: colors.slate600 },
  actionsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  primaryButton: { flex: 1, paddingVertical: 10, borderRadius: radii.lg, backgroundColor: colors.blue, alignItems: 'center' },
  primaryButtonText: { color: 'white', fontSize: 13, fontWeight: '700' },
  iconButton: { width: 40, height: 40, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
})
