import { useEffect, useState } from 'react'
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { type MapMarker } from '../components/MapView'
import { ChevronLeftIcon } from '../components/icons'
import { chatContacts, trips } from '../lib/fixtures'
import { colors, radii } from '../lib/theme'

// Ported from src/screens/RideTrackingScreen.tsx — post-confirmation live
// tracking. The prototype's hand-drawn SVG map is replaced by the real
// components/MapView (Google Maps), and the "driver dot on top of a fake
// map image" trick becomes a proper `offer` marker positioned along the
// route. No seat/booking language — this is a matched ride between a
// requester and an offer, tracked by trip id.
export default function RideTrackingScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { tripId } = useLocalSearchParams<{ tripId?: string }>()

  const trip = trips.find((t) => t.id === tripId) ?? trips[0]
  const offer = trip.rideOffer

  const [etaMinutes, setEtaMinutes] = useState(12)
  const [progress, setProgress] = useState(35)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setEtaMinutes((m) => Math.max(0, m - 1))
      setProgress((p) => Math.min(100, p + 4))
    }, 8000)
    return () => clearInterval(timer)
  }, [])

  const formatEta = (m: number) => {
    if (m <= 0) return 'Arriving now'
    const h = Math.floor(m / 60)
    const min = m % 60
    return h > 0 ? `${h}h ${min}m` : `${min} min`
  }

  // Driver's live position approximated as the midpoint of the matched
  // route until Phase 7's matching engine supplies real GPS pings.
  const driverPosition = {
    lat: (offer.originCoordinates.lat + offer.destinationCoordinates.lat) / 2,
    lng: (offer.originCoordinates.lng + offer.destinationCoordinates.lng) / 2,
  }
  const markers: MapMarker[] = [
    { coordinate: offer.originCoordinates, kind: 'user' },
    { coordinate: driverPosition, kind: 'offer', priceLabel: String(offer.pricePerPerson) },
  ]

  const mapHeight = Math.max(280, Dimensions.get('window').height - 320)
  const driverChatId = chatContacts.find((c) => c.name === offer.driver.name)?.id ?? chatContacts[0].id

  return (
    <View style={styles.screen}>
      <View style={[styles.mapArea, { height: mapHeight }]}>
        <MapView markers={markers} height={mapHeight} />

        <View style={[styles.topOverlay, { top: insets.top + 12 }]}>
          <Pressable style={styles.circleButton} onPress={() => router.back()}>
            <ChevronLeftIcon />
          </Pressable>

          <View style={styles.titlePill}>
            <Text style={styles.titlePillText}>Live Tracking</Text>
          </View>

          <Pressable style={styles.sosButton} onPress={() => router.push('/sos')}>
            <Text style={styles.sosButtonText}>🆘 SOS</Text>
          </Pressable>
        </View>

        <View style={styles.etaPill}>
          <Text style={styles.etaText}>ETA: {formatEta(etaMinutes)}</Text>
        </View>
      </View>

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />

        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{offer.originShort}</Text>
          <Text style={styles.progressLabel}>{offer.destinationShort}</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressSub}>{progress}% complete · {offer.distanceLabel}</Text>

        <View style={styles.driverCard}>
          <Image source={{ uri: offer.driver.avatarUrl }} style={styles.driverAvatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName}>{offer.driver.name}</Text>
            <Text style={styles.driverMeta}>
              {offer.vehicle.make} {offer.vehicle.model} · {offer.vehicle.registrationNumber}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable style={styles.iconButton}>
              <Text style={{ fontSize: 16 }}>📞</Text>
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => router.push(`/chat/${driverChatId}`)}>
              <Text style={{ fontSize: 16 }}>💬</Text>
            </Pressable>
          </View>
        </View>

        <Pressable
          style={[styles.shareButton, shared && styles.shareButtonActive]}
          onPress={() => setShared(true)}
        >
          <Text style={{ fontSize: 16 }}>{shared ? '✅' : '📡'}</Text>
          <Text style={[styles.shareButtonText, shared && styles.shareButtonTextActive]}>
            {shared ? 'Location shared with emergency contacts' : 'Share live location with contacts'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate900 },
  mapArea: { position: 'relative', overflow: 'hidden' },
  topOverlay: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circleButton: {
    width: 40, height: 40, borderRadius: radii.lg, backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  titlePill: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.lg, backgroundColor: 'rgba(255,255,255,0.92)',
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  titlePillText: { fontSize: 12, fontWeight: '700', color: colors.slate700 },
  sosButton: {
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: radii.lg, backgroundColor: colors.red,
    shadowColor: colors.red, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  sosButtonText: { fontSize: 12, fontWeight: '800', color: 'white' },
  etaPill: {
    position: 'absolute', bottom: 16, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: radii.lg, backgroundColor: 'rgba(15,23,42,0.85)',
  },
  etaText: { fontSize: 14, fontWeight: '800', color: 'white' },
  sheet: { backgroundColor: 'white', borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, paddingHorizontal: 20, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.slate200, alignSelf: 'center', marginBottom: 16 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: colors.slate500 },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.slate100, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.blue },
  progressSub: { fontSize: 10, color: colors.slate400, textAlign: 'center', marginTop: 6, marginBottom: 16 },
  driverCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.slate50, borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  driverAvatar: { width: 48, height: 48, borderRadius: radii.lg, backgroundColor: colors.slate100 },
  driverName: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  driverMeta: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  iconButton: { width: 40, height: 40, borderRadius: radii.md, backgroundColor: 'white', borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  shareButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14,
    borderRadius: radii.lg, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.blueBorder, backgroundColor: colors.blueSoft,
  },
  shareButtonActive: { borderColor: colors.greenBorder, backgroundColor: colors.greenSoft },
  shareButtonText: { fontSize: 13, fontWeight: '600', color: colors.blue },
  shareButtonTextActive: { color: colors.green },
})
