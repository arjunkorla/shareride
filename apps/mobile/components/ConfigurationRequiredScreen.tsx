import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { colors, radii } from '../lib/theme'

// Rendered by app/_layout.tsx instead of the real app tree when required
// Expo public env vars (Supabase URL/key, API URL) are missing or still
// REPLACE_WITH_* placeholders — see lib/startup-config.ts. Exists so a
// misconfigured build shows this instead of a blank screen: see
// docs/agent-handoff.md's Build 5 postmortem, where lib/supabase.ts used to
// throw at module-import time instead, unwinding before React ever mounted.
export function ConfigurationRequiredScreen({ reason }: { reason: string }) {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>ShareRide</Text>
        <Text style={styles.heading}>Development configuration required</Text>
        <Text style={styles.body}>Supabase and/or API configuration has not been provided for this build.</Text>
        <Text style={styles.body}>This is a development build configuration issue, not an app bug.</Text>
        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Details</Text>
          <Text style={styles.reasonText}>{reason}</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: colors.slate900 },
  heading: { fontSize: 18, fontWeight: '600', color: colors.slate700, textAlign: 'center' },
  body: { fontSize: 14, color: colors.slate600, textAlign: 'center' },
  reasonBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: radii.md,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: colors.slate200,
    alignSelf: 'stretch',
  },
  reasonLabel: { fontSize: 12, fontWeight: '600', color: colors.amber, marginBottom: 4 },
  reasonText: { fontSize: 13, color: colors.slate700 },
})
