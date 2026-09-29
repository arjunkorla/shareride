import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radii } from '../../lib/theme'
import { ChevronLeftIcon } from '../../components/icons'

type Mode = 'light' | 'dark' | 'system'

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: 'light', label: 'Light', desc: 'Always use light theme' },
  { id: 'dark', label: 'Dark', desc: 'Always use dark theme' },
  { id: 'system', label: 'System Default', desc: 'Follow your device setting' },
]

// Ported from src/screens/profile/DarkModeScreen.tsx. The web version had
// hand-built mini device-preview mockups per mode (nested divs simulating a
// light/dark screenshot) — kept as a simple color swatch preview here
// instead of recreating that layout pixel-for-pixel in RN.
export default function DarkModeScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [current, setCurrent] = useState<Mode>('light')

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Appearance</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text style={styles.intro}>Choose how ShareRide looks on this device.</Text>

        {MODES.map((mode) => {
          const active = current === mode.id
          return (
            <Pressable key={mode.id} style={[styles.card, active && styles.cardActive]} onPress={() => setCurrent(mode.id)}>
              <View style={[styles.preview, mode.id === 'dark' ? styles.previewDark : mode.id === 'system' ? styles.previewSplit : styles.previewLight]}>
                {mode.id === 'system' && <View style={styles.previewDarkHalf} />}
              </View>
              <View style={styles.cardBottomRow}>
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioDot} />}
                </View>
                <View>
                  <Text style={styles.modeLabel}>{mode.label}</Text>
                  <Text style={styles.modeDesc}>{mode.desc}</Text>
                </View>
              </View>
            </Pressable>
          )
        })}

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>Appearance changes apply immediately and are saved to your account across all your devices.</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.slate900 },
  intro: { fontSize: 13, color: colors.slate500, textAlign: 'center' },
  card: { borderRadius: radii.lg, borderWidth: 2, borderColor: colors.slate200, backgroundColor: 'white', padding: 16 },
  cardActive: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  preview: { height: 80, borderRadius: radii.md, marginBottom: 12, overflow: 'hidden', flexDirection: 'row' },
  previewLight: { backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200 },
  previewDark: { backgroundColor: colors.slate900 },
  previewSplit: { backgroundColor: colors.slate50, borderWidth: 1, borderColor: colors.slate200 },
  previewDarkHalf: { flex: 1, backgroundColor: colors.slate900 },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.slate300, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.blue, backgroundColor: colors.blue },
  radioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'white' },
  modeLabel: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  modeDesc: { fontSize: 11, color: colors.slate500, marginTop: 2 },
  noteBox: { backgroundColor: colors.slate50, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.slate100, padding: 16 },
  noteText: { fontSize: 12, color: colors.slate500, textAlign: 'center', lineHeight: 18 },
})
