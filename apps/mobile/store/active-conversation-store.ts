import { create } from 'zustand'

interface ActiveConversationState {
  // Which conversation's screen (app/chat/[id].tsx) is currently mounted,
  // if any. The only thing this tracks — durable unread state itself now
  // lives server-side (ConversationSummary.unreadCount, from
  // GET /conversations) rather than in a client-only store; see
  // useChatRealtimeSync.ts, which reads this to decide whether an
  // incoming message should bump that cached count or not (the user is
  // already looking at that conversation, so it shouldn't).
  activeConversationId: string | null
  setActiveConversation: (conversationId: string | null) => void
}

export const useActiveConversationStore = create<ActiveConversationState>((set) => ({
  activeConversationId: null,
  setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),
}))
