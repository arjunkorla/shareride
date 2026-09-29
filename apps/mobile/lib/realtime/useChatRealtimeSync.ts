import { useQueryClient } from '@tanstack/react-query'
import type { Message } from '@shareride/types'
import type { ConversationSummary } from '@shareride/api-client'
import { useActiveConversationStore } from '../../store/active-conversation-store'
import { useSocketEvent } from './useSocketEvent'

export const CONVERSATIONS_QUERY_KEY = ['conversations'] as const
export const conversationMessagesQueryKey = (conversationId: string) => ['conversation-messages', conversationId] as const

// Mounted once from app/_layout.tsx. ChatService.sendMessage only emits
// 'message:new' to the OTHER member (see apps/api/src/chat/chat.service.ts)
// — the sender already has the message from their own POST response — so
// this only ever needs to handle messages this device didn't just send.
//
// unreadCount is server-backed (GET /conversations, durable across
// restarts/devices — see ChatService.list()); this only patches the
// TanStack Query cache for an immediate UI update, the same "cache may
// give immediate feedback, the query itself stays authoritative" pattern
// used for notifications. It's never bumped for the conversation the user
// currently has open (app/chat/[id].tsx marks that one active and calls
// POST /conversations/:id/read itself).
export function useChatRealtimeSync(): void {
  const queryClient = useQueryClient()

  useSocketEvent<Message>('message:new', (message) => {
    queryClient.setQueryData<Message[]>(conversationMessagesQueryKey(message.conversationId), (old) => {
      if (!old) return old
      if (old.some((m) => m.id === message.id)) return old
      return [...old, message]
    })

    const isActive = useActiveConversationStore.getState().activeConversationId === message.conversationId

    queryClient.setQueryData<ConversationSummary[]>(CONVERSATIONS_QUERY_KEY, (old) => {
      if (!old) return old
      const index = old.findIndex((c) => c.id === message.conversationId)
      if (index === -1) {
        // A conversation we don't have cached yet (e.g. the other person
        // started it) — refetch to pick up its otherMember/lastMessage/
        // unreadCount rather than guessing at a summary from a bare Message.
        void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_QUERY_KEY })
        return old
      }
      const updated: ConversationSummary = {
        ...old[index],
        updatedAt: message.createdAt,
        lastMessage: { text: message.text ?? null, type: message.type, createdAt: message.createdAt },
        unreadCount: isActive ? old[index].unreadCount : old[index].unreadCount + 1,
      }
      return [updated, ...old.slice(0, index), ...old.slice(index + 1)]
    })
  })
}
