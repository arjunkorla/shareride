import { useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radii } from '../../lib/theme'
import { ChevronLeftIcon, ChevronRightIcon } from '../../components/icons'

// Ported from src/screens/profile/PrivacySecurityScreen.tsx.
export default function PrivacySecurityScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [biometric, setBiometric] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)
  const [locationAlways, setLocationAlways] = useState(false)
  const [showActivity, setShowActivity] = useState(true)
  const [showPhone, setShowPhone] = useState(false)
  const [changePass, setChangePass] = useState(false)
  const [passForm, setPassForm] = useState({ current: '', newPass: '', confirm: '' })

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Section title="Security">
          <ToggleRow icon="🔐" label="Biometric Login" desc="Use Face ID / fingerprint to sign in" value={biometric} onChange={setBiometric} />
          <ToggleRow icon="🛡️" label="Two-Factor Authentication" desc="Extra OTP verification on login" value={twoFactor} onChange={setTwoFactor} />
          <ActionRow icon="🔑" label="Change Password" desc="Update your account password" badge={changePass ? 'Hide' : 'Change'} onPress={() => setChangePass((v) => !v)} />
          {changePass && (
            <View style={styles.passwordForm}>
              {[
                { key: 'current' as const, label: 'Current Password' },
                { key: 'newPass' as const, label: 'New Password' },
                { key: 'confirm' as const, label: 'Confirm New Password' },
              ].map(({ key, label }) => (
                <View key={key}>
                  <Text style={styles.fieldLabel}>{label}</Text>
                  <TextInput
                    style={styles.input}
                    secureTextEntry
                    value={passForm[key]}
                    onChangeText={(v) => setPassForm((f) => ({ ...f, [key]: v }))}
                    placeholder="••••••••"
                  />
                </View>
              ))}
              <Pressable style={styles.updateButton}>
                <Text style={styles.updateButtonText}>Update Password</Text>
              </Pressable>
            </View>
          )}
          <ActionRow icon="📱" label="Active Sessions" desc="Manage where you're logged in" badge="View" onPress={() => {}} />
          <ActionRow icon="🚫" label="Blocked Users" desc="People you've blocked" badge="2" badgeDanger onPress={() => {}} last />
        </Section>

        <Section title="Privacy">
          <ToggleRow icon="🟢" label="Show Online Status" desc="Let others see when you're active" value={showActivity} onChange={setShowActivity} />
          <ToggleRow icon="📞" label="Show Phone Number" desc="Visible to matched ride partners only" value={showPhone} onChange={setShowPhone} />
          <ToggleRow icon="📍" label="Always-On Location" desc="Share location even when app is closed" value={locationAlways} onChange={setLocationAlways} />
          <ActionRow icon="📊" label="Data & Privacy" desc="Download or delete your data" badge="Manage" onPress={() => {}} last />
        </Section>

        <View style={styles.dangerZone}>
          <View style={styles.dangerHeader}>
            <Text style={styles.dangerHeaderText}>Danger Zone</Text>
          </View>
          <Pressable style={styles.dangerRow}>
            <Text style={{ fontSize: 18 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.dangerLabel}>Delete Account</Text>
              <Text style={styles.dangerDesc}>Permanently remove your data</Text>
            </View>
            <ChevronRightIcon />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  )
}

function ToggleRow({ icon, label, desc, value, onChange }: { icon: string; label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={[styles.row, styles.rowBorder]}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemLabel}>{label}</Text>
        {desc && <Text style={styles.itemDesc}>{desc}</Text>}
      </View>
      <Pressable style={[styles.toggleTrack, value && styles.toggleTrackActive]} onPress={() => onChange(!value)}>
        <View style={[styles.toggleThumb, value && styles.toggleThumbActive]} />
      </Pressable>
    </View>
  )
}

function ActionRow({ icon, label, desc, badge, badgeDanger, onPress, last }: { icon: string; label: string; desc?: string; badge?: string; badgeDanger?: boolean; onPress: () => void; last?: boolean }) {
  return (
    <Pressable style={[styles.row, !last && styles.rowBorder]} onPress={onPress}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemLabel}>{label}</Text>
        {desc && <Text style={styles.itemDesc}>{desc}</Text>}
      </View>
      {badge && (
        <View style={[styles.badge, badgeDanger && styles.badgeDanger]}>
          <Text style={[styles.badgeText, badgeDanger && styles.badgeTextDanger]}>{badge}</Text>
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.slate900 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: 'white', borderRadius: radii.lg, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  rowIcon: { fontSize: 18, width: 28 },
  itemLabel: { fontSize: 13, fontWeight: '500', color: colors.slate700 },
  itemDesc: { fontSize: 11, color: colors.slate400, marginTop: 2 },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: colors.slate300, justifyContent: 'center' },
  toggleTrackActive: { backgroundColor: colors.blue },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'white', marginLeft: 2 },
  toggleThumbActive: { marginLeft: 22 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: colors.blueSoft },
  badgeDanger: { backgroundColor: colors.redSoft },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.blue },
  badgeTextDanger: { color: colors.red },
  passwordForm: { backgroundColor: colors.slate50, padding: 16, gap: 12 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: 'white', borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  updateButton: { backgroundColor: colors.blue, borderRadius: radii.md, paddingVertical: 10, alignItems: 'center' },
  updateButtonText: { color: 'white', fontSize: 12, fontWeight: '700' },
  dangerZone: { backgroundColor: colors.redSoft, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.redBorder, overflow: 'hidden' },
  dangerHeader: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.redBorder },
  dangerHeaderText: { fontSize: 11, fontWeight: '700', color: colors.red, textTransform: 'uppercase', letterSpacing: 0.5 },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  dangerLabel: { fontSize: 13, fontWeight: '500', color: colors.red },
  dangerDesc: { fontSize: 11, color: colors.slate500, marginTop: 2 },
})
