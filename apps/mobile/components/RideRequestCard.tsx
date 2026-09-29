import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import type { RideRequestView } from '../lib/fixtures'
import { colors, matchColors, matchLabels, radii } from '../lib/theme'
import { VerifiedIcon } from './icons'
import StarRating from './StarRating'

interface Props {
  request: RideRequestView
  onPress?: () => void
  onAccept?: () => void
}

// Ported from src/components/RequestCard.tsx.
export default function RideRequestCard({ request, onPress, onAccept }: Props) {
  const match = matchColors[request.matchScore]

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <Image source={{ uri: request.passenger.avatarUrl }} style={styles.avatar} />
          {request.passenger.verified && (
            <View style={styles.verifiedBadge}>
              <VerifiedIcon />
            </View>
          )}
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{request.passenger.name}</Text>
            <View style={styles.passengerBadge}>
              <Text style={styles.passengerBadgeText}>Passenger</Text>
            </View>
          </View>
          <View style={styles.ratingRow}>
            <StarRating rating={request.passenger.rating} size={10} />
            <Text style={styles.ratingText}>{request.passenger.rating}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.dimText}>{request.passenger.totalTrips} rides</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.dimText}>Posted {request.postedAtLabel}</Text>
          </View>
        </View>
        <View style={[styles.matchPill, { backgroundColor: match.bg }]}>
          <Text style={[styles.matchPillText, { color: match.text }]}>{matchLabels[request.matchScore]}</Text>
        </View>
      </View>

      <View style={styles.routeSection}>
        <View style={styles.routeRow}>
          <View style={styles.timeline}>
            <View style={styles.dotBlue} />
            <View style={styles.timelineLine} />
            <View style={styles.squareRed} />
          </View>
          <View style={styles.routeLabels}>
            <View>
              <Text style={styles.routeCity}>{request.origin}</Text>
              <Text style={styles.routeMeta}>{request.preferredDateLabel} · {request.preferredTimeLabel}</Text>
            </View>
            <View>
              <Text style={styles.routeCity}>{request.destination}</Text>
              <Text style={styles.routeMeta}>{request.distanceFromRouteLabel}</Text>
            </View>
          </View>
        </View>
        {request.notes && (
          <View style={styles.noteBox}>
            <Text style={styles.noteText}>"{request.notes}"</Text>
          </View>
        )}
      </View>

      {onAccept && (
        <View style={styles.actionsRow}>
          <Pressable style={styles.acceptButton} onPress={onAccept}>
            <Text style={styles.acceptButtonText}>✅ Accept Request</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: 'white', borderRadius: radii.lg, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  avatarWrap: {},
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.slate100 },
  verifiedBadge: { position: 'absolute', bottom: -2, right: -2 },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 14, fontWeight: '600', color: colors.slate900 },
  passengerBadge: { backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#EDE9FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill },
  passengerBadgeText: { fontSize: 9, fontWeight: '700', color: colors.purple },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText: { fontSize: 11, color: colors.slate600 },
  dot: { color: colors.slate300, fontSize: 11 },
  dimText: { fontSize: 11, color: colors.slate400 },
  matchPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill },
  matchPillText: { fontSize: 9, fontWeight: '700' },
  routeSection: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.slate50 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  timeline: { alignItems: 'center', marginTop: 4 },
  dotBlue: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue },
  timelineLine: { width: 2, height: 28, backgroundColor: colors.slate200, marginVertical: 4 },
  squareRed: { width: 8, height: 8, borderRadius: 2, backgroundColor: colors.red },
  routeLabels: { flex: 1, gap: 8 },
  routeCity: { fontSize: 14, fontWeight: '600', color: colors.slate900 },
  routeMeta: { fontSize: 11, color: colors.slate400, marginTop: 2 },
  noteBox: { marginTop: 10, backgroundColor: colors.slate50, borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 8 },
  noteText: { fontSize: 12, color: colors.slate500, lineHeight: 18 },
  actionsRow: { paddingHorizontal: 16, paddingBottom: 16 },
  acceptButton: { paddingVertical: 10, borderRadius: radii.lg, backgroundColor: colors.green, alignItems: 'center' },
  acceptButtonText: { color: 'white', fontSize: 13, fontWeight: '700' },
})
