import { useEffect } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppNotification, NotificationType } from '@shareride/types'
import { colors, radii } from '../../lib/theme'
import { api } from '../../lib/api'
import { formatTimeAgo } from '../../lib/time'
import { ChevronLeftIcon } from '../../components/icons'
import { NOTIFICATIONS_QUERY_KEY } from '../../lib/realtime/useNotificationsRealtimeSync'

const TYPE_CONFIG: Record<NotificationType, { icon: string; bg: string; color: string; label: string }> = {
  match: { icon: '🤝', bg: '#D1FAE5', color: colors.green, label: 'Match' },
  message: { icon: '💬', bg: '#DBEAFE', color: colors.blue, label: 'Message' },
  ride: { icon: '🚗', bg: colors.blueSoft, color: colors.blueLight, label: 'Ride' },
  system: { icon: '🔔', bg: colors.slate100, color: colors.slate500, label: 'System' },
  promo: { icon: '🎉', bg: colors.amberSoft, color: colors.amber, label: 'Promo' },
  safety: { icon: '🛟', bg: '#FEE2E2', color: '#DC2626', label: 'Safety' },
}

// Ported from src/screens/NotificationDetailScreen.tsx onto real data
// (Phase 9). There is no GET /notifications/:id endpoint — only the
// already-scoped-to-the-caller GET /notifications list and POST
// /notifications/:id/read — so this reads from the same
// ['notifications'] query cache the list screen populates (shared
// queryKey, so TanStack Query dedupes/refetches rather than double-
// fetching) and finds its own id client-side. That also means a user can
// only ever land a notification here that the API already scoped to
// them; there's no separate ownership hole to close on this screen.
export default function NotificationDetailScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { id } = useLocalSearchParams<{ id: string }>()

  const notificationsQuery = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => api.notifications.list(),
  })
  const notification = notificationsQuery.data?.find((n) => n.id === id)

  const markReadMutation = useMutation({
    mutationFn: (notifId: string) => api.notifications.markRead(notifId),
    onSuccess: (updated) => {
      queryClient.setQueryData<AppNotification[]>(NOTIFICATIONS_QUERY_KEY, (old) => old?.map((n) => (n.id === updated.id ? updated : n)))
    },
  })

  useEffect(() => {
    if (notification && !notification.read && !markReadMutation.isPending) {
      markReadMutation.mutate(notification.id)
    }
    // Deliberately keyed on id/read only, not markReadMutation (a new
    // object identity every render) — this should fire once per
    // notification becoming visible, not on every re-render.
  }, [notification?.id, notification?.read])

  if (notificationsQuery.isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator color={colors.blue} />
      </View>
    )
  }

  if (notificationsQuery.isError) {
    return (
      <View style={styles.centerState}>
        <Text style={{ fontSize: 32 }}>📡</Text>
        <Text style={styles.emptyTitle}>Can't reach ShareRide right now</Text>
        <Pressable style={styles.retryButton} onPress={() => notificationsQuery.refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    )
  }

  if (!notification) {
    return (
      <View style={styles.centerState}>
        <Text style={{ fontSize: 32 }}>🔍</Text>
        <Text style={styles.emptyTitle}>Notification not found</Text>
        <Text style={styles.emptySub}>It may have been removed.</Text>
      </View>
    )
  }

  const config = TYPE_CONFIG[notification.type]

  const cta = (() => {
    if (notification.deepLink) {
      const deepLink = notification.deepLink
      return { label: 'View', onPress: () => router.push(deepLink) }
    }
    switch (notification.type) {
      case 'ride':
      case 'promo':
        return { label: '🔍 Browse Rides', onPress: () => router.push('/(tabs)/discover') }
      default:
        return null
    }
  })()

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <Text style={styles.headerTitle}>Notification</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.topRow}>
          <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
            <Text style={{ fontSize: 24 }}>{config.icon}</Text>
          </View>
          <View>
            <View style={[styles.typeBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label.toUpperCase()}</Text>
            </View>
            <Text style={styles.timeText}>{formatTimeAgo(notification.createdAt)}</Text>
          </View>
        </View>

        <View style={[styles.card, { borderColor: config.bg }]}>
          <View style={[styles.cardHeader, { backgroundColor: config.bg }]}>
            <Text style={styles.cardTitle}>{notification.title}</Text>
            <Text style={styles.cardBody}>{notification.body}</Text>
          </View>
        </View>

        {cta && (
          <Pressable style={[styles.ctaButton, { backgroundColor: config.color }]} onPress={cta.onPress}>
            <Text style={styles.ctaButtonText}>{cta.label}</Text>
          </Pressable>
        )}

        <View style={styles.metaBox}>
          <Text style={styles.metaText}>Received {formatTimeAgo(notification.createdAt)}</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'white' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32, backgroundColor: 'white' },
  retryButton: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.blueBorder },
  retryButtonText: { fontSize: 12, fontWeight: '700', color: colors.blue },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.slate900 },
  scrollContent: { padding: 20, gap: 20 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: { width: 56, height: 56, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  typeBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
  typeBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
  timeText: { fontSize: 11, color: colors.slate400, marginTop: 6 },
  card: { borderRadius: radii.lg, borderWidth: 1.5, overflow: 'hidden' },
  cardHeader: { paddingHorizontal: 18, paddingVertical: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.slate900, marginBottom: 6 },
  cardBody: { fontSize: 13, color: colors.slate600, lineHeight: 19 },
  ctaButton: { paddingVertical: 15, borderRadius: radii.lg, alignItems: 'center' },
  ctaButtonText: { fontSize: 14, fontWeight: '700', color: 'white' },
  metaBox: { backgroundColor: colors.slate50, borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 16 },
  metaText: { fontSize: 12, color: colors.slate500, textAlign: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.slate700, textAlign: 'center' },
  emptySub: { fontSize: 13, color: colors.slate400, textAlign: 'center' },
})
