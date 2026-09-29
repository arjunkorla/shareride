import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Message } from '@shareride/types'
import { ApiRequestError, type ConversationSummary } from '@shareride/api-client'
import { ChevronLeftIcon } from '../../components/icons'
import { colors, radii } from '../../lib/theme'
import { api } from '../../lib/api'
import { useAuthStore } from '../../store/auth-store'
import { useActiveConversationStore } from '../../store/active-conversation-store'
import { CONVERSATIONS_QUERY_KEY, conversationMessagesQueryKey } from '../../lib/realtime/useChatRealtimeSync'

interface PendingMessage {
  tempId: string
  text: string
  createdAt: string
  status: 'sending' | 'failed'
}

interface DisplayMessage {
  id: string
  senderId: string
  text?: string
  createdAt: string
  status: 'sent' | 'sending' | 'failed'
}

// Real Conversation/Message thread (Phase 9), replacing the Phase 3 fixture
// version. `id` is now a conversationId, not a fixture contact id — real
// entry points are app/matches/[requestId].tsx's "Message driver" and
// Discover's "Requests" tab "Message passenger" (both resolve a real
// conversation via ChatService.start() before navigating here). ride/
// [id].tsx, driver/[id].tsx and ride-tracking.tsx are still 100%
// fixture-driven screens with no real other-user id, so their own
// "Message" buttons remain unwired — tapping them lands on the "not
// available" state below instead of a crash, but isn't a working entry
// point (a pre-existing Phase 8 gap: those screens have no real backing
// offer/trip to resolve a participant from).
export default function ChatDetailScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const { id: conversationId } = useLocalSearchParams<{ id: string }>()
  const currentUserId = useAuthStore((s) => s.session?.user.id)
  const setActiveConversation = useActiveConversationStore((s) => s.setActiveConversation)
  const markedReadRef = useRef<string | null>(null)

  const [input, setInput] = useState('')
  const [pending, setPending] = useState<PendingMessage[]>([])

  useEffect(() => {
    setActiveConversation(conversationId)
    return () => setActiveConversation(null)
  }, [conversationId, setActiveConversation])

  const conversationsQuery = useQuery({ queryKey: CONVERSATIONS_QUERY_KEY, queryFn: () => api.chat.list() })
  const conversation: ConversationSummary | undefined = conversationsQuery.data?.find((c) => c.id === conversationId)

  const messagesQuery = useQuery({
    queryKey: conversationMessagesQueryKey(conversationId),
    queryFn: () => api.chat.messages(conversationId),
    enabled: Boolean(conversationId),
  })

  // Durable, server-backed read state (POST /conversations/:id/read —
  // ChatService.markRead()) — fires once per successful load of a given
  // conversation, not on every render/cache patch. Optimistically zeroes
  // this conversation's unreadCount in the ['conversations'] cache so the
  // chat tab badge updates immediately rather than waiting on a refetch.
  const markReadMutation = useMutation({
    mutationFn: () => api.chat.markRead(conversationId),
    onSuccess: () => {
      queryClient.setQueryData<ConversationSummary[]>(CONVERSATIONS_QUERY_KEY, (old) =>
        old?.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c)),
      )
    },
  })

  useEffect(() => {
    if (messagesQuery.isSuccess && markedReadRef.current !== conversationId) {
      markedReadRef.current = conversationId
      markReadMutation.mutate()
    }
    // Deliberately keyed on isSuccess/conversationId only, not
    // markReadMutation (a new object identity every render) — the ref
    // guard above already makes this fire once per conversation.
  }, [messagesQuery.isSuccess, conversationId])

  async function sendText(text: string, retryTempId?: string) {
    const tempId = retryTempId ?? `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
    setPending((prev) =>
      retryTempId
        ? prev.map((p) => (p.tempId === tempId ? { ...p, status: 'sending' } : p))
        : [...prev, { tempId, text, createdAt: new Date().toISOString(), status: 'sending' }],
    )

    try {
      const message = await api.chat.sendMessage(conversationId, { type: 'text', text })
      setPending((prev) => prev.filter((p) => p.tempId !== tempId))
      queryClient.setQueryData<Message[]>(conversationMessagesQueryKey(conversationId), (old) => {
        if (!old) return [message]
        if (old.some((m) => m.id === message.id)) return old
        return [...old, message]
      })
      queryClient.setQueryData<ConversationSummary[]>(CONVERSATIONS_QUERY_KEY, (old) => {
        if (!old) return old
        const index = old.findIndex((c) => c.id === conversationId)
        if (index === -1) return old
        const updated: ConversationSummary = { ...old[index], updatedAt: message.createdAt, lastMessage: { text: message.text ?? null, type: message.type, createdAt: message.createdAt } }
        return [updated, ...old.slice(0, index), ...old.slice(index + 1)]
      })
    } catch {
      setPending((prev) => prev.map((p) => (p.tempId === tempId ? { ...p, status: 'failed' } : p)))
    }
  }

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    void sendText(text)
  }

  const errorStatus = messagesQuery.error instanceof ApiRequestError ? messagesQuery.error.error.statusCode : null
  const notFound = errorStatus === 404
  const unauthorized = errorStatus === 401 || errorStatus === 403

  const displayMessages: DisplayMessage[] = [
    ...(messagesQuery.data ?? []).map((m) => ({ id: m.id, senderId: m.senderId, text: m.text, createdAt: m.createdAt, status: 'sent' as const })),
    ...pending.map((p) => ({ id: p.tempId, senderId: currentUserId ?? '', text: p.text, createdAt: p.createdAt, status: p.status })),
  ]
  const inverted = [...displayMessages].reverse()

  const headerName = conversation?.otherMember.fullName ?? (notFound ? 'Conversation' : 'Loading…')
  const headerAvatar = conversation?.otherMember.avatarUrl

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      <View style={styles.screen}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button">
            <ChevronLeftIcon />
          </Pressable>

          <View style={styles.avatarWrap}>
            {headerAvatar ? (
              <Image source={{ uri: headerAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{headerName.charAt(0).toUpperCase() || 'S'}</Text></View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.name} numberOfLines={1}>{headerName}</Text>
          </View>
        </View>

        {messagesQuery.isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.blue} />
          </View>
        )}

        {messagesQuery.isError && (
          <View style={styles.centerState}>
            <Text style={{ fontSize: 32 }}>{notFound ? '🔍' : unauthorized ? '🔒' : '📡'}</Text>
            <Text style={styles.emptyTitle}>
              {notFound ? 'This conversation isn\'t available' : unauthorized ? 'Please sign in again' : 'Can\'t reach ShareRide right now'}
            </Text>
            <Text style={styles.emptySub}>
              {notFound
                ? 'It may have been removed, or you may not have access to it.'
                : unauthorized
                  ? 'Your session may have expired.'
                  : 'Check your connection and try again.'}
            </Text>
            {!notFound && !unauthorized && (
              <Pressable style={styles.retryButton} onPress={() => messagesQuery.refetch()}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            )}
          </View>
        )}

        {messagesQuery.isSuccess && (
          <FlatList
            inverted
            data={inverted}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContent}
            ListEmptyComponent={
              <View style={[styles.emptyState, { transform: [{ scaleY: -1 }] }]}>
                <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.senderId === currentUserId
              return (
                <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
                  {!isMe && (
                    headerAvatar
                      ? <Image source={{ uri: headerAvatar }} style={styles.messageAvatar} />
                      : <View style={styles.messageAvatarFallback} />
                  )}
                  <View style={{ maxWidth: '75%' }}>
                    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther, item.status === 'failed' && styles.bubbleFailed]}>
                      <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
                    </View>
                    {item.status === 'sending' && <Text style={styles.statusLabel}>Sending…</Text>}
                    {item.status === 'failed' && (
                      <Pressable onPress={() => void sendText(item.text ?? '', item.id)}>
                        <Text style={[styles.statusLabel, styles.statusLabelFailed]}>Failed to send — tap to retry</Text>
                      </Pressable>
                    )}
                    {item.status === 'sent' && <Text style={[styles.timeLabel, isMe && styles.timeLabelMe]}>{new Date(item.createdAt).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</Text>}
                  </View>
                </View>
              )
            }}
          />
        )}

        {!notFound && !unauthorized && (
          <View style={[styles.inputBar, { paddingBottom: insets.bottom + 12 }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Type a message..."
              placeholderTextColor={colors.slate400}
              style={styles.textInput}
              multiline
              accessibilityLabel="Message"
            />
            <Pressable
              style={[styles.sendButton, input.trim().length > 0 && styles.sendButtonActive]}
              onPress={handleSend}
              disabled={input.trim().length === 0}
              accessibilityLabel="Send message"
              accessibilityRole="button"
            >
              <Text style={[styles.sendButtonText, input.trim().length > 0 && styles.sendButtonTextActive]}>➤</Text>
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  backButton: { width: 36, height: 36, borderRadius: radii.md, borderWidth: 1, borderColor: colors.slate200, alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { position: 'relative' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.slate100 },
  avatarFallback: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { color: 'white', fontWeight: '700' },
  name: { fontSize: 14, fontWeight: '700', color: colors.slate900 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.slate700, textAlign: 'center' },
  emptySub: { fontSize: 13, color: colors.slate400, textAlign: 'center', lineHeight: 18 },
  retryButton: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.blueBorder },
  retryButtonText: { fontSize: 12, fontWeight: '700', color: colors.blue },
  messagesContent: { padding: 16, gap: 12, flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 13, color: colors.slate400 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  messageAvatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.slate100 },
  messageAvatarFallback: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.slate200 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.lg },
  bubbleMe: { backgroundColor: colors.blue, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: 'white', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  bubbleFailed: { opacity: 0.5 },
  bubbleText: { fontSize: 13, color: colors.slate900, lineHeight: 18 },
  bubbleTextMe: { color: 'white' },
  timeLabel: { fontSize: 10, color: colors.slate400, marginTop: 4 },
  timeLabelMe: { textAlign: 'right' },
  statusLabel: { fontSize: 10, color: colors.slate400, marginTop: 4 },
  statusLabelFailed: { color: '#DC2626', fontWeight: '600' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, paddingHorizontal: 16, paddingTop: 10, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: colors.slate100 },
  textInput: { flex: 1, maxHeight: 100, minHeight: 42, borderRadius: radii.lg, borderWidth: 1.5, borderColor: colors.slate200, backgroundColor: colors.slate50, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: colors.slate900 },
  sendButton: { width: 40, height: 40, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.slate200 },
  sendButtonActive: { backgroundColor: colors.blue },
  sendButtonText: { fontSize: 15, color: colors.slate400, transform: [{ rotate: '90deg' }] },
  sendButtonTextActive: { color: 'white' },
})
