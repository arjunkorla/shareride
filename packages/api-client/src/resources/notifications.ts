import type { AppNotification } from '@shareride/types'
import type { HttpClient } from '../http'

export function notificationsResource(http: HttpClient) {
  return {
    list: () => http.get<AppNotification[]>('/notifications'),
    markRead: (id: string) => http.post<AppNotification>(`/notifications/${id}/read`),
  }
}
