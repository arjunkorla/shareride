import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Vehicle, VerificationStatus } from '@shareride/types'
import { colors, radii } from '../../lib/theme'
import { api } from '../../lib/api'
import { ChevronLeftIcon } from '../../components/icons'

const STATUS_CONFIG: Record<VerificationStatus, { label: string; bg: string; color: string; icon: string }> = {
  NOT_STARTED: { label: 'Not Started', bg: colors.slate100, color: colors.slate500, icon: '○' },
  SUBMITTED: { label: 'Submitted', bg: colors.amberSoft, color: colors.amber, icon: '⏳' },
  UNDER_REVIEW: { label: 'Under Review', bg: colors.amberSoft, color: colors.amber, icon: '⏳' },
  APPROVED: { label: 'Verified', bg: '#D1FAE5', color: colors.green, icon: '✓' },
  REJECTED: { label: 'Rejected', bg: colors.redSoft, color: colors.red, icon: '✗' },
  ACTION_REQUIRED: { label: 'Action Required', bg: colors.redSoft, color: colors.red, icon: '!' },
}

const RESUBMITTABLE = new Set<VerificationStatus>(['NOT_STARTED', 'REJECTED', 'ACTION_REQUIRED'])

// Real driver-identity + per-vehicle verification status (Phase 10),
// replacing the Phase 3 fixture's per-document (photo/ID/selfie/license/
// RC/insurance/vehicle-photo) tracking — the schema only models ONE
// status for a driver's identity (DriverProfile) and ONE per vehicle
// (Vehicle), not per-document, so this shows that real granularity
// instead. No document/photo upload here: no object storage is
// configured in this environment (see docs/migration-plan.md Phase 10) —
// this is the submit-for-review workflow boundary only.
export default function VerificationScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()

  const verificationQuery = useQuery({ queryKey: ['verification', 'me'], queryFn: () => api.verification.me() })
  const submitMutation = useMutation({
    mutationFn: () => api.verification.submitDriverVerification(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['verification', 'me'] }),
  })

  const driver = verificationQuery.data?.driver
  const vehicles = verificationQuery.data?.vehicles.filter((v) => v.isActive) ?? []
  const canSubmit = driver ? RESUBMITTABLE.has(driver.verificationStatus) : false

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Verification</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {verificationQuery.isLoading && (
          <View style={styles.centerState}><ActivityIndicator color={colors.blue} /></View>
        )}

        {verificationQuery.isError && (
          <View style={styles.centerState}>
            <Text style={styles.emptyTitle}>Can't reach ShareRide right now</Text>
            <Pressable style={styles.retryButton} onPress={() => verificationQuery.refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {driver && (
          <>
            <StatusCard title="Driver Identity" status={driver.verificationStatus} note={undefined} />
            {canSubmit && (
              <Pressable
                style={[styles.submitButton, submitMutation.isPending && styles.disabledButton]}
                disabled={submitMutation.isPending}
                onPress={() => submitMutation.mutate()}
              >
                <Text style={styles.submitButtonText}>
                  {submitMutation.isPending ? 'Submitting…' : driver.verificationStatus === 'NOT_STARTED' ? 'Submit for Review' : 'Resubmit for Review'}
                </Text>
              </Pressable>
            )}
            {submitMutation.isError && <Text style={styles.errorText}>Couldn't submit — please try again.</Text>}

            <Text style={styles.sectionLabel}>Vehicles</Text>
            {vehicles.length === 0 && (
              <Text style={styles.emptySub}>Add a vehicle from My Vehicles to start driver verification for it.</Text>
            )}
            {vehicles.map((v) => (
              <StatusCard key={v.id} title={`${v.make} ${v.model}`} status={v.verificationStatus} note={v.verificationNote} />
            ))}
            <Pressable style={styles.manageLink} onPress={() => router.push('/profile/vehicles')}>
              <Text style={styles.manageLinkText}>Manage vehicles →</Text>
            </Pressable>
          </>
        )}

        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            🔒 Document upload isn't available yet in this environment — submitting starts the review workflow, and an
            admin decides the outcome. Your data is never used to approve yourself.
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

function StatusCard({ title, status, note }: { title: string; status: Vehicle['verificationStatus']; note?: string }) {
  const sc = STATUS_CONFIG[status]
  return (
    <View style={styles.statusCard}>
      <View style={[styles.statusIcon, { backgroundColor: sc.bg }]}>
        <Text style={{ fontSize: 20 }}>{sc.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statusTitle}>{title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
        </View>
        {note && <Text style={styles.statusNote}>{note}</Text>}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { backgroundColor: colors.white, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.slate900 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  centerState: { alignItems: 'center', paddingVertical: 48, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.slate700 },
  emptySub: { fontSize: 13, color: colors.slate400, lineHeight: 18 },
  retryButton: { marginTop: 4, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.blueBorder },
  retryButtonText: { fontSize: 12, fontWeight: '700', color: colors.blue },
  statusCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, backgroundColor: 'white', borderRadius: radii.lg, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  statusIcon: { width: 44, height: 44, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  statusTitle: { fontSize: 14, fontWeight: '700', color: colors.slate900, marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.pill },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  statusNote: { fontSize: 11, color: colors.slate500, marginTop: 6 },
  submitButton: { backgroundColor: colors.blue, borderRadius: radii.md, paddingVertical: 14, alignItems: 'center' },
  submitButtonText: { color: 'white', fontWeight: '700', fontSize: 14 },
  disabledButton: { opacity: 0.6 },
  errorText: { fontSize: 12, color: colors.red, textAlign: 'center' },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.slate400, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  manageLink: { alignItems: 'center', paddingVertical: 8 },
  manageLinkText: { fontSize: 12, fontWeight: '700', color: colors.blue },
  noticeBox: { backgroundColor: colors.blueSoft, borderRadius: radii.lg, padding: 16, borderWidth: 1, borderColor: colors.blueBorder, marginTop: 8 },
  noticeText: { fontSize: 12, color: colors.blueDark, lineHeight: 18 },
})
