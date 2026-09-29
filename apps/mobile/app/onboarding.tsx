import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { colors, radii } from '../lib/theme'

// Ported from src/screens/OnboardingScreen.tsx. The elaborate inline SVG
// illustrations became emoji badges + decorative accent dots (this port's
// established convention for iconography — see components/icons.tsx and
// every ported profile/tab screen) rather than a 1:1 react-native-svg
// recreation of each scene.
//
// Stale-copy fix (see docs/migration-plan.md Phase 3 note): ShareRide has
// no seat-booking model. Slide 1 and slide 4 subtitles below were rewritten
// from "offer empty seats..." / "...book a seat in under 60 seconds" to
// request/offer/match language.
const slides = [
  {
    title: 'Share the Journey',
    subtitle: 'Find rides going your way or share your route with fellow travelers across the city.',
    color: colors.blueSoft,
    accent: colors.blue,
    emoji: '🚗',
  },
  {
    title: 'Save Fuel & Money',
    subtitle: 'Split travel costs with fellow passengers. Drivers earn back fuel costs on every trip.',
    color: colors.greenSoft,
    accent: colors.green,
    emoji: '💰',
  },
  {
    title: 'Safe & Verified',
    subtitle: 'Every driver and passenger is ID-verified. Share live trips with your emergency contacts.',
    color: colors.amberSoft,
    accent: colors.amber,
    emoji: '🛡️',
  },
  {
    title: 'Ready to Ride?',
    subtitle: 'Join 2 million+ verified riders across 500 cities. Post a ride or send a request in under 60 seconds.',
    color: colors.blueSoft,
    accent: colors.blue,
    emoji: '🗺️',
  },
] as const

export default function OnboardingScreen() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const slide = slides[current]
  const isLast = current === slides.length - 1

  const finish = () => router.replace('/login')

  const next = () => {
    if (isLast) finish()
    else setCurrent((c) => c + 1)
  }

  return (
    <View style={[styles.screen, { backgroundColor: slide.color }]}>
      <View style={styles.skipRow}>
        <Pressable onPress={finish}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.illustrationSection}>
        <View style={[styles.illustrationBadge, { backgroundColor: slide.accent }]}>
          <Text style={styles.illustrationEmoji}>{slide.emoji}</Text>
        </View>
        <View style={styles.dotsAccentRow}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dotAccent,
                { backgroundColor: slide.accent, opacity: 0.15 + i * 0.15, width: 10 + i * 10, height: 10 + i * 10 },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </View>

      <View style={styles.pagerRow}>
        {slides.map((s, i) => (
          <Pressable key={s.title} onPress={() => setCurrent(i)}>
            <View
              style={[
                styles.pagerDot,
                { width: i === current ? 24 : 7, backgroundColor: i === current ? slide.accent : colors.slate300 },
              ]}
            />
          </Pressable>
        ))}
      </View>

      <View style={styles.ctaSection}>
        <Pressable style={[styles.ctaButton, { backgroundColor: slide.accent }]} onPress={next}>
          <Text style={styles.ctaButtonText}>{isLast ? 'Get Started →' : 'Continue →'}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  skipRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 24, paddingTop: 56, paddingBottom: 8 },
  skipText: { fontSize: 14, color: colors.slate400, fontWeight: '500' },
  illustrationSection: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  illustrationBadge: { width: 140, height: 140, borderRadius: radii.xl * 2, alignItems: 'center', justifyContent: 'center' },
  illustrationEmoji: { fontSize: 64 },
  dotsAccentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dotAccent: { borderRadius: radii.pill },
  content: { paddingHorizontal: 32, paddingBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', color: colors.slate900, textAlign: 'center', lineHeight: 32 },
  subtitle: { fontSize: 14, color: colors.slate500, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  pagerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 },
  pagerDot: { height: 7, borderRadius: radii.pill },
  ctaSection: { paddingHorizontal: 24, paddingBottom: 40 },
  ctaButton: { paddingVertical: 16, borderRadius: radii.xl, alignItems: 'center' },
  ctaButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
})
