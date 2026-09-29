import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppNotification, NotificationType } from '@shareride/types'
import { ApiRequestError } from '@shareride/api-client'
import { ChevronLeftIcon } from '../../components/icons'
import { colors, radii } from '../../lib/theme'
import { api } from '../../lib/api'
import { formatTimeAgo } from '../../lib/time'
import { NOTIFICATIONS_QUERY_KEY } from '../../lib/realtime/useNotificationsRealtimeSync'

const TYPE_CONFIG: Record<NotificationType, { icon: string; bg: string; color: string }> = {
  match: { icon: '🤝', bg: '#D1FAE5', color: colors.green },
  message: { icon: '💬', bg: '#DBEAFE', color: colors.blue },
  ride: { icon: '🚗', bg: colors.blueSoft, color: colors.blueLight },
  system: { icon: '🔔', bg: colors.slate100, color: colors.slate500 },
  promo: { icon: '🎉', bg: colors.amberSoft, color: colors.amber },
  safety: { icon: '🛟', bg: '#FEE2E2', color: '#DC2626' },
}

// Ported from src/screens/NotificationsScreen.tsx onto the real
// GET /notifications + POST /notifications/:id/read endpoints (Phase 9).
// There is no bulk "mark all read" endpoint — "Mark all read" below
// composes the existing per-notification endpoint across every unread id
// rather than inventing a new one.
export default function NotificationsScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const notificationsQuery = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => api.notifications.list(),
  })

  // Marking an individual notification read happens on open, in
  // app/notifications/[id].tsx — this screen only needs the bulk action.
  const markAllReadMutation = useMutation({
    mutationFn: async (unreadIds: string[]) => {
      await Promise.all(unreadIds.map((id) => api.notifications.markRead(id)))
    },
    onSuccess: () => {
      queryClient.setQueryData<AppNotification[]>(NOTIFICATIONS_QUERY_KEY, (old) => old?.map((n) => ({ ...n, read: true })))
    },
  })

  const notifications = notificationsQuery.data ?? []
  const unreadCount = notifications.filter((n) => !n.read).length
  const errorStatus = notificationsQuery.error instanceof ApiRequestError ? notificationsQuery.error.error.statusCode : null

  const openNotification = (id: string) => {
    router.push(`/notifications/${id}`)
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: 12 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <Text style={styles.headerSub}>{unreadCount} new</Text>}
        </View>
        {unreadCount > 0 && (
          <Pressable
            style={styles.markAllButton}
            disabled={markAllReadMutation.isPending}
            onPress={() => markAllReadMutation.mutate(notifications.filter((n) => !n.read).map((n) => n.id))}
          >
            <Text style={styles.markAllText}>{markAllReadMutation.isPending ? 'Marking…' : 'Mark all read'}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={notificationsQuery.isFetching && !notificationsQuery.isLoading} onRefresh={() => notificationsQuery.refetch()} />}
      >
        {notificationsQuery.isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.blue} />
          </View>
        )}

        {notificationsQuery.isError && (
          <View style={styles.centerState}>
            <Text style={{ fontSize: 32 }}>{errorStatus === 401 || errorStatus === 403 ? '🔒' : '📡'}</Text>
            <Text style={styles.emptyTitle}>{errorStatus === 401 || errorStatus === 403 ? 'Please sign in again' : "Can't reach ShareRide right now"}</Text>
            <Text style={styles.emptySub}>{errorStatus === 401 || errorStatus === 403 ? 'Your session may have expired.' : 'Check your connection and try again.'}</Text>
            <Pressable style={styles.retryButton} onPress={() => notificationsQuery.refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {notificationsQuery.isSuccess && notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔔</Text>
            <Text style={styles.emptyTitle}>No notifications</Text>
            <Text style={styles.emptySub}>You are all caught up!</Text>
          </View>
        ) : (
          notifications.map((notif) => {
            const config = TYPE_CONFIG[notif.type]
            return (
              <Pressable
                key={notif.id}
                style={[styles.row, !notif.read && styles.rowUnread]}
                onPress={() => openNotification(notif.id)}
              >
                <View style={[styles.iconCircle, { backgroundColor: config.bg }]}>
                  <Text style={{ fontSize: 18 }}>{config.icon}</Text>
                </View>

                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.notifTitle} numberOfLines={1}>{notif.title}</Text>
                    <View style={styles.rowTopRight}>
                      <Text style={styles.time}>{formatTimeAgo(notif.createdAt)}</Text>
                      {!notif.read && <View style={styles.unreadDot} />}
                    </View>
                  </View>
                  <Text style={styles.body} numberOfLines={2}>{notif.body}</Text>
                </View>
              </Pressable>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.slate900 },
  headerSub: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  markAllButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.blueBorder },
  markAllText: { fontSize: 11, fontWeight: '700', color: colors.blue },
  centerState: { alignItems: 'center', paddingVertical: 64, gap: 8, paddingHorizontal: 32 },
  retryButton: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.blueBorder },
  retryButtonText: { fontSize: 12, fontWeight: '700', color: colors.blue },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.slate50, backgroundColor: 'white' },
  rowUnread: { backgroundColor: '#F8FAFF' },
  iconCircle: { width: 44, height: 44, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  rowTopRight: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  notifTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.slate900 },
  time: { fontSize: 10, color: colors.slate400 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue },
  body: { fontSize: 12, color: colors.slate500, marginTop: 4, lineHeight: 17 },
  emptyState: { alignItems: 'center', paddingVertical: 80, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.slate700, marginBottom: 6, textAlign: 'center' },
  emptySub: { fontSize: 13, color: colors.slate400, textAlign: 'center' },
})
