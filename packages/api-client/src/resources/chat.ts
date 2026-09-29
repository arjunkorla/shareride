import type { Conversation, Message, MessageType } from '@shareride/types'
import type { HttpClient } from '../http'

// GET /conversations enriches each Conversation with the other member's
// name/avatar and the last message, the same "server already has to load
// this to build the list, so return it" reasoning as Phase 8's
// MatchWithOfferSummary/MatchWithRequestSummary.
export interface ConversationSummary extends Conversation {
  otherMember: { id: string; fullName: string; avatarUrl?: string }
  lastMessage: { text: string | null; type: MessageType; createdAt: string } | null
  // Messages from the other member created after the caller's own
  // ConversationRead.lastReadAt (or since the conversation was created, if
  // they've never read it) — server-computed, durable across
  // restarts/devices, see apps/api/src/chat/chat.service.ts's `list()`.
  unreadCount: number
}

export interface ConversationReadReceipt {
  conversationId: string
  lastReadAt: string
}

export function chatResource(http: HttpClient) {
  return {
    start: (otherUserId: string) => http.post<Conversation>('/conversations', { otherUserId }),
    list: () => http.get<ConversationSummary[]>('/conversations'),
    messages: (conversationId: string) => http.get<Message[]>(`/conversations/${conversationId}/messages`),
    sendMessage: (conversationId: string, input: { type?: MessageType; text?: string; attachmentUrl?: string }) =>
      http.post<Message>(`/conversations/${conversationId}/messages`, input),
    markRead: (conversationId: string) => http.post<ConversationReadReceipt>(`/conversations/${conversationId}/read`),
  }
}
