import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radii } from '../../lib/theme'
import { ChevronLeftIcon } from '../../components/icons'

interface SettingItem {
  id: string
  label: string
  desc?: string
  default: boolean
}
interface SettingGroup {
  title: string
  items: SettingItem[]
}

// Ported from src/screens/profile/NotificationSettingsScreen.tsx. "Booking
// Confirmed" became "Match Confirmed" — no booking language anywhere.
const GROUPS: SettingGroup[] = [
  {
    title: 'Ride Activity',
    items: [
      { id: 'ride_req', label: 'Ride Requests', desc: 'When a passenger requests your ride', default: true },
      { id: 'match_conf', label: 'Match Confirmed', desc: 'When a match is accepted', default: true },
      { id: 'ride_cancel', label: 'Ride Cancelled', desc: 'When a match or trip is cancelled', default: true },
      { id: 'ride_update', label: 'Ride Updates', desc: 'Driver arriving, trip started, completed', default: true },
    ],
  },
  {
    title: 'Messages',
    items: [
      { id: 'new_msg', label: 'New Messages', desc: 'Chat messages from drivers or passengers', default: true },
      { id: 'typing', label: 'Typing Indicators', default: false },
      { id: 'read_rcpts', label: 'Read Receipts', default: true },
    ],
  },
  {
    title: 'Nearby & Discovery',
    items: [
      { id: 'nearby_rides', label: 'Nearby Rides', desc: 'New rides matching your saved routes', default: true },
      { id: 'price_drop', label: 'Price Drops', desc: 'When ride prices on your route drop', default: false },
    ],
  },
  {
    title: 'Account & Security',
    items: [
      { id: 'verify_update', label: 'Verification Updates', desc: 'Status changes on your documents', default: true },
      { id: 'login_alert', label: 'Login Alerts', desc: 'New sign-in from unfamiliar device', default: true },
    ],
  },
  {
    title: 'Promotions',
    items: [
      { id: 'offers', label: 'Offers & Discounts', desc: 'Special deals and promo codes', default: false },
      { id: 'newsletter', label: 'Newsletter', default: false },
    ],
  },
]

export default function NotificationSettingsScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(GROUPS.flatMap((g) => g.items.map((i) => [i.id, i.default]))),
  )
  const toggle = (id: string) => setEnabled((e) => ({ ...e, [id]: !e[id] }))

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Notification Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View style={styles.banner}>
          <Text style={{ fontSize: 22 }}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Push Notifications Enabled</Text>
            <Text style={styles.bannerSub}>Notifications are allowed for ShareRide</Text>
          </View>
          <Text style={styles.bannerAction}>Change</Text>
        </View>

        {GROUPS.map((group) => (
          <View key={group.title}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.card}>
              {group.items.map((item, i) => (
                <View key={item.id} style={[styles.row, i < group.items.length - 1 && styles.rowBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                    {item.desc && <Text style={styles.itemDesc}>{item.desc}</Text>}
                  </View>
                  <Pressable style={[styles.toggleTrack, enabled[item.id] && styles.toggleTrackActive]} onPress={() => toggle(item.id)}>
                    <View style={[styles.toggleThumb, enabled[item.id] && styles.toggleThumbActive]} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.slate900 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.blueSoft, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.blueBorder },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: colors.blue },
  bannerSub: { fontSize: 11, color: colors.slate500, marginTop: 2 },
  bannerAction: { fontSize: 12, fontWeight: '700', color: colors.blue },
  groupTitle: { fontSize: 11, fontWeight: '700', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: 'white', borderRadius: radii.lg, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  itemLabel: { fontSize: 13, fontWeight: '500', color: colors.slate700 },
  itemDesc: { fontSize: 11, color: colors.slate400, marginTop: 2 },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.slate300, justifyContent: 'center' },
  toggleTrackActive: { backgroundColor: colors.blue },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', marginLeft: 2 },
  toggleThumbActive: { marginLeft: 22 },
})
