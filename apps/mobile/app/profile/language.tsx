import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, radii } from '../../lib/theme'
import { CheckIcon, ChevronLeftIcon } from '../../components/icons'

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', region: 'Global' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳', region: 'India' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', region: 'Andhra Pradesh & Telangana' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳', region: 'Tamil Nadu' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳', region: 'Karnataka' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳', region: 'Maharashtra' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳', region: 'West Bengal' },
]

// Ported from src/screens/LanguageScreen.tsx. Telugu moved up the list
// since Hyderabad is this product's seed/demo city.
export default function LanguageScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [selected, setSelected] = useState('en')
  const [saved, setSaved] = useState(false)

  const select = (code: string) => {
    setSelected(code)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Language</Text>
        {saved && <Text style={styles.savedText}>✓ Saved</Text>}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={styles.banner}>
          <Text style={{ fontSize: 18 }}>🌐</Text>
          <Text style={styles.bannerText}>The app will restart to apply the selected language across all screens.</Text>
        </View>

        <View style={styles.card}>
          {LANGUAGES.map((lang, i) => {
            const active = selected === lang.code
            return (
              <Pressable
                key={lang.code}
                style={[styles.row, i < LANGUAGES.length - 1 && styles.rowBorder, active && styles.rowActive]}
                onPress={() => select(lang.code)}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.langName, active && styles.langNameActive]}>{lang.name}</Text>
                  <Text style={styles.langSub}>{lang.native} · {lang.region}</Text>
                </View>
                {active && <CheckIcon size={20} />}
              </Pressable>
            )
          })}
        </View>

        <Text style={styles.footer}>More languages coming soon. Help us translate ShareRide at translate.shareride.in</Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.slate900 },
  savedText: { fontSize: 12, fontWeight: '700', color: colors.green },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.blueSoft, borderRadius: radii.lg, padding: 14, borderWidth: 1, borderColor: colors.blueBorder, marginBottom: 16 },
  bannerText: { flex: 1, fontSize: 12, color: colors.blue, lineHeight: 17 },
  card: { backgroundColor: 'white', borderRadius: radii.lg, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  rowActive: { backgroundColor: colors.blueSoft },
  flag: { fontSize: 22, width: 32 },
  langName: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  langNameActive: { color: colors.blue },
  langSub: { fontSize: 11, color: colors.slate400, marginTop: 2 },
  footer: { fontSize: 11, color: colors.slate400, textAlign: 'center', marginTop: 16 },
})
