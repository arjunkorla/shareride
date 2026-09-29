export interface Conversation {
  id: string
  tripId?: string
  memberIds: string[]
  createdAt: string
  updatedAt: string
}

export type MessageType = 'text' | 'image' | 'location' | 'ride' | 'quick_reply'

export interface Message {
  id: string
  conversationId: string
  senderId: string
  type: MessageType
  text?: string
  attachmentUrl?: string
  createdAt: string
}

export interface MessageRead {
  messageId: string
  userId: string
  readAt: string
}
