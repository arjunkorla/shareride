import { useQueryClient } from '@tanstack/react-query'
import type { AppNotification } from '@shareride/types'
import { useSocketEvent } from './useSocketEvent'

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const

// Mounted once from app/_layout.tsx so the unread badge (Home's bell,
// wherever else reads the same query) updates the moment a
// 'notification:new' event arrives, not only when the notifications
// screen itself is open and refetches. REST stays authoritative — this
// only patches the existing TanStack Query cache, it never seeds it.
export function useNotificationsRealtimeSync(): void {
  const queryClient = useQueryClient()

  useSocketEvent<AppNotification>('notification:new', (notification) => {
    queryClient.setQueryData<AppNotification[]>(NOTIFICATIONS_QUERY_KEY, (old) => {
      if (!old) return old
      if (old.some((n) => n.id === notification.id)) return old
      return [notification, ...old]
    })
  })
}
