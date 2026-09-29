export type NotificationType = 'ride' | 'message' | 'match' | 'system' | 'promo' | 'safety'

export interface AppNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  createdAt: string
  avatarUrl?: string
  deepLink?: string
}
