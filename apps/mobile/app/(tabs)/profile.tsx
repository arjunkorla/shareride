import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { drivers } from '../../lib/fixtures'
import { colors, radii } from '../../lib/theme'
import { ChevronRightIcon, CheckIcon } from '../../components/icons'
import StarRating from '../../components/StarRating'
import Avatar from '../../components/Avatar'
import { useAuthStore } from '../../store/auth-store'
import { api } from '../../lib/api'

// Bio/languages/response-time/member-since have no real backend field yet
// — those stay fixture-sourced. Rating/trips/verification status and the
// vehicles/reviews tabs are real (Phase 10): GET /verification/me and
// GET /reviews?userId=. Identity (name, contact line, avatar) already used
// the real signed-in user via GET /auth/me / the Supabase session.
const fixtureProfile = drivers[0]

const SETTINGS_LINKS = [
  { icon: '🔔', label: 'Notifications', href: '/profile/notification-settings' as const },
  { icon: '🔒', label: 'Privacy & Security', href: '/profile/privacy-security' as const },
  { icon: '🌙', label: 'Dark Mode', href: '/profile/dark-mode' as const },
  { icon: '🌐', label: 'Language', href: '/profile/language' as const },
  { icon: '🚗', label: 'My Vehicles', href: '/profile/vehicles' as const },
  { icon: '📞', label: 'Emergency Contacts', href: '/profile/emergency-contacts' as const },
  { icon: '❓', label: 'Help & Support', href: '/profile/help-support' as const },
  { icon: '📋', label: 'Terms & Conditions', href: '/profile/legal/terms' as const },
  { icon: '🔐', label: 'Privacy Policy', href: '/profile/legal/privacy' as const },
]

// Ported from src/screens/ProfileScreen.tsx. Sign Out calls the real
// Supabase sign-out (store/auth-store.ts) instead of a local state reset.
export default function ProfileScreen() {
  const router = useRouter()
  const signOut = useAuthStore((s) => s.signOut)
  const profile = useAuthStore((s) => s.profile)
  const session = useAuthStore((s) => s.session)
  const [tab, setTab] = useState<'about' | 'reviews' | 'vehicles'>('about')

  const displayName = profile?.fullName ?? session?.user.phone ?? fixtureProfile.name
  const contactLine = profile?.phone ?? profile?.email ?? session?.user.phone ?? session?.user.email ?? fixtureProfile.name
  const userId = session?.user.id

  const verificationQuery = useQuery({ queryKey: ['verification', 'me'], queryFn: () => api.verification.me() })
  const reviewsQuery = useQuery({
    queryKey: ['reviews', 'for-user', userId],
    queryFn: () => api.reviews.forUser(userId as string),
    enabled: tab === 'reviews' && Boolean(userId),
  })

  const driver = verificationQuery.data?.driver
  const isVerified = driver?.verificationStatus === 'APPROVED'
  const ratingValue = driver ? driver.rating.toFixed(1) : String(fixtureProfile.rating)
  const tripsValue = driver ? String(driver.totalTrips) : String(fixtureProfile.totalTrips)

  return (
    <View style={styles.screen}>
      <ScrollView>
        <View style={styles.headerGradient}>
          <Pressable style={styles.settingsButton}>
            <Text style={{ color: 'white' }}>⚙️</Text>
          </Pressable>

          <View style={{ alignItems: 'center' }}>
            <View style={styles.avatarWrap}>
              <Avatar uri={fixtureProfile.avatarUrl} name={displayName} size={80} />
              {isVerified && (
                <View style={styles.verifiedBadge}>
                  <CheckIcon size={12} />
                </View>
              )}
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.memberSince}>{contactLine}</Text>

            <View style={styles.statsRow}>
              <Stat value={ratingValue} label="Rating" />
              <Stat value={tripsValue} label="Trips" />
              <Stat value={`${fixtureProfile.yearsActive} yrs`} label="Experience" />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.actionsRow}>
            <Pressable style={styles.actionBlue} onPress={() => router.push('/profile/edit')}>
              <Text style={styles.actionEmoji}>✏️</Text>
              <Text style={[styles.actionLabel, { color: colors.blue }]}>Edit Profile</Text>
            </Pressable>
            <Pressable style={styles.actionAmber} onPress={() => router.push('/profile/verification')}>
              <Text style={styles.actionEmoji}>🪪</Text>
              <Text style={[styles.actionLabel, { color: colors.amber }]}>Verification</Text>
            </Pressable>
            <Pressable style={styles.actionGreen} onPress={() => router.push('/profile/wallet')}>
              <Text style={styles.actionEmoji}>💳</Text>
              <Text style={[styles.actionLabel, { color: colors.green }]}>Wallet</Text>
            </Pressable>
          </View>

          <View style={styles.tabRow}>
            {(['about', 'reviews', 'vehicles'] as const).map((t) => (
              <Pressable key={t} style={styles.tabButton} onPress={() => setTab(t)}>
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t[0].toUpperCase() + t.slice(1)}</Text>
                {tab === t && <View style={styles.tabUnderline} />}
              </Pressable>
            ))}
          </View>

          {tab === 'about' && (
            <View style={styles.tabContent}>
              <View style={styles.bioBox}>
                <Text style={styles.bioText}>"{fixtureProfile.bio}"</Text>
              </View>
              {[
                { icon: '🌍', label: 'Languages', value: fixtureProfile.languages.join(', ') },
                { icon: '⏱️', label: 'Response Time', value: fixtureProfile.responseTimeLabel },
                { icon: '📅', label: 'Member Since', value: fixtureProfile.memberSinceLabel },
                { icon: '✅', label: 'Verification', value: driver ? formatVerificationStatus(driver.verificationStatus) : '—' },
              ].map(({ icon, label, value }) => (
                <View key={label} style={styles.infoRow}>
                  <Text style={styles.infoIcon}>{icon}</Text>
                  <Text style={styles.infoLabel}>{label}</Text>
                  <Text style={styles.infoValue}>{value}</Text>
                </View>
              ))}
            </View>
          )}

          {tab === 'reviews' && (
            <View style={styles.tabContent}>
              {reviewsQuery.isLoading && <Text style={styles.emptyTabText}>Loading reviews…</Text>}
              {reviewsQuery.isSuccess && reviewsQuery.data.items.length === 0 && (
                <Text style={styles.emptyTabText}>No reviews yet.</Text>
              )}
              {reviewsQuery.isSuccess && reviewsQuery.data.items.map((rv) => (
                <View key={rv.id} style={styles.reviewRow}>
                  <View style={styles.reviewAvatarFallback}><Text style={styles.reviewAvatarFallbackText}>{rv.author.fullName.charAt(0)}</Text></View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.reviewAuthor}>{rv.author.fullName}</Text>
                      <StarRating rating={rv.rating} />
                    </View>
                    {rv.comment && <Text style={styles.reviewComment}>{rv.comment}</Text>}
                    <Text style={styles.reviewMeta}>{new Date(rv.createdAt).toLocaleDateString()}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {tab === 'vehicles' && (
            <View style={styles.tabContent}>
              {verificationQuery.isLoading && <Text style={styles.emptyTabText}>Loading vehicles…</Text>}
              {verificationQuery.isSuccess && verificationQuery.data.vehicles.filter((v) => v.isActive).length === 0 && (
                <Text style={styles.emptyTabText}>No vehicles added yet.</Text>
              )}
              {verificationQuery.isSuccess && verificationQuery.data.vehicles.filter((v) => v.isActive).map((vehicle) => (
                <View key={vehicle.id} style={styles.vehicleCard}>
                  <Text style={{ fontSize: 28 }}>🚗</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.vehicleName}>{vehicle.make} {vehicle.model}</Text>
                    <Text style={styles.vehicleMeta}>{vehicle.year} · {vehicle.color} · {vehicle.fuelType}</Text>
                  </View>
                  <Text style={styles.vehicleStatus}>{formatVerificationStatus(vehicle.verificationStatus)}</Text>
                </View>
              ))}
              <Pressable style={styles.manageVehiclesLink} onPress={() => router.push('/profile/vehicles')}>
                <Text style={styles.manageVehiclesLinkText}>Manage vehicles →</Text>
              </Pressable>
            </View>
          )}

          <View style={styles.settingsList}>
            {SETTINGS_LINKS.map((item, i) => (
              <Pressable
                key={item.label}
                style={[styles.settingsRow, i < SETTINGS_LINKS.length - 1 && styles.settingsRowBorder]}
                onPress={() => router.push(item.href)}
              >
                <Text style={styles.settingsIcon}>{item.icon}</Text>
                <Text style={styles.settingsLabel}>{item.label}</Text>
                <ChevronRightIcon />
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.signOutButton} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

function formatVerificationStatus(status: string): string {
  switch (status) {
    case 'NOT_STARTED': return 'Not started'
    case 'SUBMITTED': return 'Submitted'
    case 'UNDER_REVIEW': return 'Under review'
    case 'APPROVED': return 'Verified'
    case 'REJECTED': return 'Rejected'
    case 'ACTION_REQUIRED': return 'Action required'
    default: return status
  }
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  headerGradient: { backgroundColor: colors.slate900, paddingTop: 24, paddingBottom: 48, paddingHorizontal: 24 },
  settingsButton: { position: 'absolute', top: 24, right: 16, width: 36, height: 36, borderRadius: radii.md, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 24, borderWidth: 3, borderColor: 'rgba(255,255,255,0.3)' },
  verifiedBadge: { position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.blue, borderWidth: 2, borderColor: 'white', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '800', color: 'white', marginBottom: 2 },
  memberSince: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 24 },
  statValue: { fontSize: 22, fontWeight: '800', color: 'white' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  card: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -32 },
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16 },
  actionBlue: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: colors.blueSoft, borderRadius: radii.lg, paddingVertical: 12, borderWidth: 1, borderColor: colors.blueBorder },
  actionAmber: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: colors.amberSoft, borderRadius: radii.lg, paddingVertical: 12, borderWidth: 1, borderColor: '#FDE68A' },
  actionGreen: { flex: 1, alignItems: 'center', gap: 6, backgroundColor: colors.greenSoft, borderRadius: radii.lg, paddingVertical: 12, borderWidth: 1, borderColor: colors.greenBorder },
  actionEmoji: { fontSize: 20 },
  actionLabel: { fontSize: 12, fontWeight: '600' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.slate100, paddingHorizontal: 20 },
  tabButton: { flex: 1, alignItems: 'center', paddingBottom: 12 },
  tabText: { fontSize: 14, fontWeight: '600', color: colors.slate400 },
  tabTextActive: { color: colors.blue },
  tabUnderline: { height: 2, width: '60%', backgroundColor: colors.blue, marginTop: 8, borderRadius: 1 },
  tabContent: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  bioBox: { backgroundColor: colors.slate50, borderRadius: radii.lg, padding: 16 },
  bioText: { fontSize: 14, color: colors.slate600, lineHeight: 20 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  infoIcon: { fontSize: 18, width: 28 },
  infoLabel: { fontSize: 13, color: colors.slate500, flex: 1 },
  infoValue: { fontSize: 13, fontWeight: '600', color: colors.slate700 },
  reviewRow: { flexDirection: 'row', gap: 12 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.slate100 },
  reviewAuthor: { fontSize: 13, fontWeight: '600', color: colors.slate700 },
  reviewComment: { fontSize: 12, color: colors.slate500, marginTop: 4, lineHeight: 17 },
  reviewMeta: { fontSize: 10, color: colors.slate400, marginTop: 4 },
  vehicleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.slate50, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.slate100 },
  vehicleName: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  vehicleMeta: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  vehicleStatus: { fontSize: 10, fontWeight: '700', color: colors.slate500 },
  emptyTabText: { fontSize: 13, color: colors.slate400, textAlign: 'center', paddingVertical: 12 },
  reviewAvatarFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center' },
  reviewAvatarFallbackText: { fontSize: 14, fontWeight: '700', color: colors.blue },
  manageVehiclesLink: { alignItems: 'center', paddingVertical: 10 },
  manageVehiclesLinkText: { fontSize: 12, fontWeight: '700', color: colors.blue },
  settingsList: { marginHorizontal: 20, marginTop: 8, backgroundColor: 'white', borderRadius: radii.lg, borderWidth: 1, borderColor: colors.slate100, overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  settingsRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  settingsIcon: { fontSize: 18, width: 28 },
  settingsLabel: { flex: 1, fontSize: 14, color: colors.slate700, fontWeight: '500' },
  signOutButton: { marginHorizontal: 20, marginTop: 12, marginBottom: 32, paddingVertical: 14, borderRadius: radii.xl, borderWidth: 2, borderColor: colors.redBorder, backgroundColor: colors.redSoft, alignItems: 'center' },
  signOutText: { fontSize: 14, fontWeight: '700', color: colors.red },
})
