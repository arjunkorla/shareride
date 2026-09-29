import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReportType } from '@shareride/types'
import { colors, radii } from '../../lib/theme'
import { api } from '../../lib/api'
import { ChevronLeftIcon } from '../../components/icons'

// New Phase 10 screen — the fixture Help & Support screen's "Safety
// Center" banner pointed nowhere real; this is the actual user-facing
// report workflow (POST /reports), reached from there. Not tied to a
// specific trip/user id — a general-purpose "something went wrong" entry
// point; reports filed against a specific trip/driver still go through
// this same endpoint with more context once a screen wires it that way.
const TYPES: { id: ReportType; label: string }[] = [
  { id: 'SAFETY_INCIDENT', label: 'Safety incident' },
  { id: 'USER', label: 'A user' },
  { id: 'RIDE', label: 'A ride' },
  { id: 'FRAUD', label: 'Fraud' },
]

const REASON_SUGGESTIONS = ['Unsafe behaviour', 'Harassment', 'Spam', 'Fake profile', 'Inappropriate communication', 'Ride issue', 'Other']

export default function ReportScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()

  const [type, setType] = useState<ReportType>('SAFETY_INCIDENT')
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')

  const myReportsQuery = useQuery({ queryKey: ['reports', 'own'], queryFn: () => api.safety.reports.listOwn() })
  const submitMutation = useMutation({
    mutationFn: () => api.safety.reports.create({ type, reason, description: description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'own'] })
      setReason('')
      setDescription('')
    },
  })

  const canSubmit = reason.trim().length > 0

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Report a Safety Issue</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <View>
          <Text style={styles.sectionLabel}>What is this about?</Text>
          <View style={styles.chipRow}>
            {TYPES.map((t) => (
              <Pressable key={t.id} style={[styles.chip, type === t.id && styles.chipActive]} onPress={() => setType(t.id)}>
                <Text style={[styles.chipText, type === t.id && styles.chipTextActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text style={styles.sectionLabel}>Reason</Text>
          <View style={styles.chipRow}>
            {REASON_SUGGESTIONS.map((r) => (
              <Pressable key={r} style={[styles.chip, reason === r && styles.chipActive]} onPress={() => setReason(r)}>
                <Text style={[styles.chipText, reason === r && styles.chipTextActive]}>{r}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={reason}
            onChangeText={setReason}
            placeholder="Or type your own reason"
            placeholderTextColor={colors.slate400}
          />
        </View>

        <View>
          <Text style={styles.sectionLabel}>Details (optional)</Text>
          <TextInput
            style={styles.textarea}
            value={description}
            onChangeText={setDescription}
            placeholder="Anything else that would help us look into this..."
            placeholderTextColor={colors.slate400}
            multiline
            numberOfLines={4}
          />
        </View>

        {submitMutation.isError && <Text style={styles.errorText}>Couldn't submit your report — please try again.</Text>}
        {submitMutation.isSuccess && <Text style={styles.successText}>Report submitted. Our safety team will review it.</Text>}

        <Pressable
          style={[styles.submitButton, (!canSubmit || submitMutation.isPending) && styles.disabledButton]}
          disabled={!canSubmit || submitMutation.isPending}
          onPress={() => submitMutation.mutate()}
        >
          <Text style={styles.submitButtonText}>{submitMutation.isPending ? 'Submitting…' : 'Submit Report'}</Text>
        </Pressable>

        {myReportsQuery.isSuccess && myReportsQuery.data.length > 0 && (
          <View>
            <Text style={styles.sectionLabel}>Your reports</Text>
            {myReportsQuery.data.map((r) => (
              <View key={r.id} style={styles.reportRow}>
                <Text style={styles.reportReason}>{r.reason}</Text>
                <Text style={styles.reportStatus}>{r.status}</Text>
              </View>
            ))}
          </View>
        )}
        {myReportsQuery.isLoading && <ActivityIndicator color={colors.blue} />}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white', paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.slate900 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.slate500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, backgroundColor: 'white' },
  chipActive: { borderColor: colors.red, backgroundColor: colors.redSoft },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.slate600 },
  chipTextActive: { color: colors.red },
  input: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: 'white', borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.slate900 },
  textarea: { borderWidth: 1, borderColor: colors.slate200, backgroundColor: 'white', borderRadius: radii.lg, paddingHorizontal: 16, paddingVertical: 12, fontSize: 13, color: colors.slate900, textAlignVertical: 'top', minHeight: 90 },
  errorText: { fontSize: 12, color: colors.red },
  successText: { fontSize: 12, color: colors.green },
  submitButton: { backgroundColor: colors.red, borderRadius: radii.lg, paddingVertical: 14, alignItems: 'center' },
  submitButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  disabledButton: { opacity: 0.5 },
  reportRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  reportReason: { fontSize: 13, color: colors.slate700, flex: 1 },
  reportStatus: { fontSize: 11, fontWeight: '700', color: colors.slate400 },
})
