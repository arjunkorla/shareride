import { useState } from 'react'
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Avatar from '../../components/Avatar'
import StarRating from '../../components/StarRating'
import MapView from '../../components/MapView'
import { amenityIcon, ChatBubbleIcon, ChevronLeftIcon, VerifiedIcon } from '../../components/icons'
import { reviews, rideOffers } from '../../lib/fixtures'
import { colors, matchColors, matchLabels, radii } from '../../lib/theme'

type Tab = 'details' | 'reviews' | 'rules'

const RULES: { icon: string; rule: string }[] = [
  { icon: '🚭', rule: 'No smoking inside the vehicle' },
  { icon: '🎧', rule: 'Headphones for calls, please' },
  { icon: '🍕', rule: 'No strong-smelling food' },
  { icon: '🐾', rule: 'Small pets in carrier only' },
  { icon: '⏰', rule: 'Please be on time at pickup' },
  { icon: '💬', rule: 'Respect fellow passengers' },
]

// Ported from src/screens/RideDetailScreen.tsx. No seat count anywhere —
// the sticky bar always shows offer.pricePerPerson, charged once per match.
export default function RideDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const offer = rideOffers.find((r) => r.id === id) || rideOffers[0]
  const [tab, setTab] = useState<Tab>('details')
  const [shareShown, setShareShown] = useState(false)

  const match = offer.matchScore ? matchColors[offer.matchScore] : null

  const amenities = [
    offer.preferences.acAvailable && 'AC',
    offer.preferences.womenOnly && 'Women Preferred',
    offer.preferences.luggageSpace && 'Luggage Space',
    offer.preferences.petsOk && 'Pets OK',
    offer.preferences.silentRide && 'Silent Ride',
  ].filter((a): a is string => Boolean(a))

  return (
    <View style={styles.screen}>
      <View style={styles.mapWrap}>
        <MapView
          height={220}
          markers={[
            { coordinate: offer.originCoordinates, kind: 'user' },
            { coordinate: offer.destinationCoordinates, kind: 'destination' },
          ]}
        />
        <Pressable style={[styles.overlayButton, styles.backOverlay]} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Pressable style={[styles.overlayButton, styles.shareOverlay]} onPress={() => setShareShown(true)}>
          <Text style={{ fontSize: 15 }}>⋯</Text>
        </Pressable>
        <View style={styles.routeBadge}>
          <Text style={styles.routeBadgeText}>
            {offer.durationLabel} · {offer.distanceLabel}{offer.routeNote ? ` · ${offer.routeNote}` : ''}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {(match || offer.pickupProximityLabel || offer.preferences.autoConfirm) && (
          <View style={styles.badgeRow}>
            {match && offer.matchScore && (
              <View style={[styles.matchPill, { backgroundColor: match.bg }]}>
                <Text style={[styles.matchPillText, { color: match.text }]}>{matchLabels[offer.matchScore]}</Text>
              </View>
            )}
            {offer.pickupProximityLabel && (
              <View style={styles.proximityPill}>
                <Text style={styles.proximityText}>📍 Pickup {offer.pickupProximityLabel}</Text>
              </View>
            )}
            {offer.preferences.autoConfirm && (
              <View style={styles.instantPill}>
                <Text style={styles.instantPillText}>⚡ Instant confirm</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.driverRow}>
          <Pressable onPress={() => router.push(`/driver/${offer.driver.id}`)}>
            <View>
              <Avatar uri={offer.driver.avatarUrl} name={offer.driver.name} size={56} />
              <View style={styles.verifiedBadgeAbs}>
                <VerifiedIcon size={16} />
              </View>
            </View>
          </Pressable>
          <Pressable style={{ flex: 1 }} onPress={() => router.push(`/driver/${offer.driver.id}`)}>
            <View style={styles.driverNameRow}>
              <Text style={styles.driverName}>{offer.driver.name}</Text>
              {offer.driver.verified && (
                <View style={styles.verifiedChip}>
                  <VerifiedIcon size={11} />
                  <Text style={styles.verifiedChipText}>Verified</Text>
                </View>
              )}
            </View>
            <View style={styles.ratingRow}>
              <StarRating rating={offer.driver.rating} size={12} />
              <Text style={styles.ratingText}>{offer.driver.rating}</Text>
              <Text style={styles.dimText}>({offer.reviewCount} reviews)</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.dimText}>🚗 {offer.driver.totalTrips} rides</Text>
              <Text style={styles.dimText}>📅 Since {offer.driver.memberSinceLabel}</Text>
            </View>
          </Pressable>
          <View style={{ gap: 8 }}>
            <Pressable style={styles.chatButton} onPress={() => router.push(`/chat/${offer.driver.id}`)}>
              <ChatBubbleIcon size={16} />
            </Pressable>
            <View style={styles.callButton}>
              <Text style={{ fontSize: 14 }}>📞</Text>
            </View>
          </View>
        </View>

        <View style={styles.timelineSection}>
          <View style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View style={styles.dotBlue} />
              <View style={styles.timelineLine} />
              {offer.stops.length > 0 && (
                <>
                  <View style={styles.stopDot} />
                  <View style={[styles.timelineLine, { height: 24 }]} />
                </>
              )}
              <View style={styles.dotRed} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ paddingBottom: 16 }}>
                <Text style={styles.stopCity}>{offer.originShort}</Text>
                <Text style={styles.stopMeta}>{offer.departureDateLabel} · <Text style={styles.stopMetaStrong}>{offer.departureTimeLabel}</Text></Text>
              </View>
              {offer.stops.map((stop) => (
                <View key={stop} style={{ paddingBottom: 16 }}>
                  <Text style={styles.stopCityMuted}>{stop}</Text>
                  <Text style={styles.stopMetaAmber}>Brief stop · ~10 min</Text>
                </View>
              ))}
              <View>
                <Text style={styles.stopCity}>{offer.destinationShort}</Text>
                <Text style={styles.stopMeta}>Est. arrival <Text style={styles.stopMetaStrong}>~{offer.durationLabel} later</Text></Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.vehicleSection}>
          <Text style={styles.sectionLabel}>Vehicle</Text>
          <View style={styles.vehicleRow}>
            <View style={styles.vehiclePhotoWrap}>
              {offer.vehicle.photoUrl ? (
                <Avatar uri={offer.vehicle.photoUrl} name={offer.vehicle.model} size={56} />
              ) : (
                <Text style={{ fontSize: 24 }}>🚗</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.vehicleName}>{offer.vehicle.make} {offer.vehicle.model}</Text>
              <Text style={styles.dimText}>{offer.vehicle.year} · {offer.vehicle.color} · {offer.vehicle.fuelType}</Text>
              <Text style={styles.regText}>{offer.vehicle.registrationNumber}</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                {offer.vehicle.rcVerified && <Text style={styles.miniBadgeGreen}>✓ RC</Text>}
                {offer.vehicle.insuranceVerified && <Text style={styles.miniBadgeGreen}>✓ Insured</Text>}
                {offer.vehicle.ac && <Text style={styles.miniBadgeBlue}>❄️ AC</Text>}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.tabRow}>
          {(['details', 'reviews', 'rules'] as const).map((t) => (
            <Pressable key={t} style={[styles.tabButton, tab === t && styles.tabButtonActive]} onPress={() => setTab(t)}>
              <Text style={[styles.tabButtonText, tab === t && styles.tabButtonTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'details' && (
          <View style={styles.tabContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amenities</Text>
              <View style={styles.chipWrap}>
                {amenities.map((a) => (
                  <View key={a} style={styles.amenityChip}>
                    <Text style={styles.amenityText}>{amenityIcon(a)} {a}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Response time</Text>
              <Text style={styles.detailValue}>{offer.driver.responseTimeLabel}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Languages</Text>
              <Text style={styles.detailValue}>{offer.driver.languages.join(', ')}</Text>
            </View>
            <View style={styles.bioBox}>
              <Text style={{ fontSize: 16 }}>👤</Text>
              <Text style={styles.bioText}>"{offer.driver.bio}"</Text>
            </View>
          </View>
        )}

        {tab === 'reviews' && (
          <View style={styles.tabContent}>
            {reviews.map((rv) => (
              <View key={rv.id} style={styles.reviewRow}>
                <Avatar uri={rv.authorAvatarUrl} name={rv.authorName} size={36} />
                <View style={{ flex: 1 }}>
                  <View style={styles.reviewHeaderRow}>
                    <Text style={styles.reviewAuthor}>{rv.authorName}</Text>
                    <StarRating rating={rv.rating} size={10} />
                  </View>
                  <Text style={styles.reviewComment}>{rv.comment}</Text>
                  <Text style={styles.reviewMeta}>{rv.dateLabel}{rv.routeLabel ? ` · ${rv.routeLabel}` : ''}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {tab === 'rules' && (
          <View style={styles.tabContent}>
            {RULES.map(({ icon, rule }) => (
              <View key={rule} style={styles.ruleRow}>
                <Text style={styles.ruleIcon}>{icon}</Text>
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bookingBar}>
        <View>
          <Text style={styles.price}>₹{offer.pricePerPerson}</Text>
          <Text style={styles.priceSub}>per person</Text>
        </View>
        <Pressable
          style={[styles.sendButton, offer.preferences.autoConfirm && styles.sendButtonInstant]}
          onPress={() => router.push(`/payment?rideId=${offer.id}`)}
        >
          <Text style={styles.sendButtonText}>{offer.preferences.autoConfirm ? '⚡ Send Request' : '✉️ Send Request'}</Text>
        </Pressable>
      </View>

      <Modal visible={shareShown} transparent animationType="slide" onRequestClose={() => setShareShown(false)}>
        <Pressable style={styles.backdrop} onPress={() => setShareShown(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>Share this Ride</Text>
            <View style={styles.shareInfoBox}>
              <Text style={styles.shareInfoText}>
                🚗 {offer.originShort} → {offer.destinationShort} · {offer.departureDateLabel} · ₹{offer.pricePerPerson}/person
              </Text>
              <Text style={styles.shareLink}>shareride.in/ride/{offer.id}</Text>
            </View>
            <View style={styles.shareGrid}>
              {[
                { icon: '📋', label: 'Copy Link' },
                { icon: '💬', label: 'WhatsApp' },
                { icon: '✈️', label: 'Telegram' },
                { icon: '📨', label: 'More' },
              ].map(({ icon, label }) => (
                <Pressable key={label} style={styles.shareOption} onPress={() => setShareShown(false)}>
                  <View style={styles.shareOptionIcon}><Text style={{ fontSize: 22 }}>{icon}</Text></View>
                  <Text style={styles.shareOptionLabel}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Pressable style={styles.cancelButton} onPress={() => setShareShown(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'white' },
  mapWrap: { height: 220 },
  overlayButton: { position: 'absolute', top: 48, width: 36, height: 36, borderRadius: radii.md, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  backOverlay: { left: 16 },
  shareOverlay: { right: 16 },
  routeBadge: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
  routeBadgeText: { backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: radii.pill, fontSize: 12, fontWeight: '600', color: colors.slate700, overflow: 'hidden' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  matchPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill },
  matchPillText: { fontSize: 12, fontWeight: '600' },
  proximityPill: { backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate100, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill },
  proximityText: { fontSize: 12, color: colors.slate500 },
  instantPill: { backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: colors.greenBorder, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill },
  instantPillText: { fontSize: 12, fontWeight: '600', color: colors.greenDark },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  verifiedBadgeAbs: { position: 'absolute', bottom: -2, right: -2 },
  driverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  driverName: { fontSize: 16, fontWeight: '800', color: colors.slate900 },
  verifiedChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.blueSoft, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill },
  verifiedChipText: { fontSize: 10, fontWeight: '600', color: colors.blue },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  ratingText: { fontSize: 12, fontWeight: '600', color: colors.slate700 },
  dimText: { fontSize: 12, color: colors.slate500 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  chatButton: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  callButton: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.slate100, alignItems: 'center', justifyContent: 'center' },
  timelineSection: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  timelineRail: { alignItems: 'center', paddingTop: 2 },
  dotBlue: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.blue },
  dotRed: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.red },
  stopDot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.amber, backgroundColor: 'white' },
  timelineLine: { width: 2, height: 40, backgroundColor: colors.slate200, marginVertical: 4 },
  stopCity: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  stopCityMuted: { fontSize: 14, fontWeight: '600', color: colors.slate700 },
  stopMeta: { fontSize: 12, color: colors.slate400, marginTop: 2 },
  stopMetaAmber: { fontSize: 12, color: colors.amber, marginTop: 2 },
  stopMetaStrong: { fontWeight: '600', color: colors.slate600 },
  vehicleSection: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  vehiclePhotoWrap: { width: 72, height: 56, borderRadius: radii.md, backgroundColor: colors.slate100, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  vehicleName: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  regText: { fontSize: 11, color: colors.slate400, marginTop: 2 },
  miniBadgeGreen: { fontSize: 9, fontWeight: '700', color: colors.greenDark, backgroundColor: colors.greenSoft, borderWidth: 1, borderColor: colors.greenBorder, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill, overflow: 'hidden' },
  miniBadgeBlue: { fontSize: 9, fontWeight: '700', color: colors.blue, backgroundColor: colors.blueSoft, borderWidth: 1, borderColor: colors.blueBorder, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill, overflow: 'hidden' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  tabButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabButtonActive: { borderBottomColor: colors.blue },
  tabButtonText: { fontSize: 13, fontWeight: '600', color: colors.slate400 },
  tabButtonTextActive: { color: colors.blue },
  tabContent: { paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  detailLabel: { fontSize: 13, color: colors.slate600 },
  detailValue: { fontSize: 13, fontWeight: '600', color: colors.slate700, textAlign: 'right', flexShrink: 1 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', flex: 1 },
  amenityChip: { backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate100, borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 3 },
  amenityText: { fontSize: 11, color: colors.slate600 },
  bioBox: { flexDirection: 'row', gap: 10, backgroundColor: colors.slate50, borderRadius: radii.md, padding: 12 },
  bioText: { flex: 1, fontSize: 12, color: colors.slate500, lineHeight: 18 },
  reviewRow: { flexDirection: 'row', gap: 12 },
  reviewHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewAuthor: { fontSize: 13, fontWeight: '700', color: colors.slate700 },
  reviewComment: { fontSize: 12, color: colors.slate500, marginTop: 4, lineHeight: 17 },
  reviewMeta: { fontSize: 10, color: colors.slate400, marginTop: 4 },
  ruleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  ruleIcon: { fontSize: 17, width: 28, textAlign: 'center' },
  ruleText: { fontSize: 13, color: colors.slate700 },
  bookingBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: colors.slate100, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24 },
  price: { fontSize: 22, fontWeight: '800', color: colors.slate900 },
  priceSub: { fontSize: 11, color: colors.slate400 },
  sendButton: { flex: 1, paddingVertical: 14, borderRadius: radii.xl, backgroundColor: colors.blue, alignItems: 'center' },
  sendButtonInstant: { backgroundColor: colors.green },
  sendButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.slate200, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 16, fontWeight: '800', color: colors.slate900, marginBottom: 16 },
  shareInfoBox: { backgroundColor: colors.slate50, borderRadius: radii.lg, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.slate100 },
  shareInfoText: { fontSize: 12, color: colors.slate600 },
  shareLink: { fontSize: 11, color: colors.blue, marginTop: 4 },
  shareGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  shareOption: { alignItems: 'center', gap: 6 },
  shareOptionIcon: { width: 48, height: 48, borderRadius: radii.lg, backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate100, alignItems: 'center', justifyContent: 'center' },
  shareOptionLabel: { fontSize: 10, color: colors.slate500 },
  cancelButton: { paddingVertical: 14, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center' },
  cancelButtonText: { fontSize: 14, fontWeight: '600', color: colors.slate500 },
})
