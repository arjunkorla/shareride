import { ActivityIndicator, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import type { ConversationSummary } from '@shareride/api-client'
import { colors, radii } from '../../lib/theme'
import { api } from '../../lib/api'
import { formatTimeAgo } from '../../lib/time'
import { SearchIconGlyph } from '../../components/icons'
import { CONVERSATIONS_QUERY_KEY } from '../../lib/realtime/useChatRealtimeSync'

// Ported from src/screens/ChatListScreen.tsx (Phase 3 fixture version) onto
// real Conversation/Message models (Phase 9). ConversationSummary has no
// presence ("online") field and no ride-route banner — those came from the
// fixture's chatContacts, which the real /conversations endpoint doesn't
// return (no presence tracking, and a Conversation only optionally carries
// a tripId, not a route summary) — dropped rather than faked. unreadCount
// is server-backed (ConversationRead.lastReadAt — see
// apps/api/src/chat/chat.service.ts), durable across restarts/devices,
// patched live by useChatRealtimeSync.ts on 'message:new'.
export default function ChatListScreen() {
  const router = useRouter()

  const conversationsQuery = useQuery({
    queryKey: CONVERSATIONS_QUERY_KEY,
    queryFn: () => api.chat.list(),
  })

  const totalUnread = conversationsQuery.data?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Messages</Text>
            {totalUnread > 0 && <Text style={styles.subtitle}>{totalUnread} unread message{totalUnread !== 1 ? 's' : ''}</Text>}
          </View>
          <View style={styles.searchButton}>
            <SearchIconGlyph />
          </View>
        </View>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={conversationsQuery.isFetching && !conversationsQuery.isLoading} onRefresh={() => conversationsQuery.refetch()} />}
      >
        {conversationsQuery.isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.blue} />
          </View>
        )}

        {conversationsQuery.isError && (
          <View style={styles.centerState}>
            <Text style={{ fontSize: 32 }}>📡</Text>
            <Text style={styles.emptyTitle}>Can't reach ShareRide right now</Text>
            <Text style={styles.emptySub}>Check your connection and try again.</Text>
            <Pressable style={styles.retryButton} onPress={() => conversationsQuery.refetch()}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {conversationsQuery.isSuccess && conversationsQuery.data.length === 0 && (
          <View style={styles.centerState}>
            <Text style={{ fontSize: 32 }}>💬</Text>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptySub}>Messages with a matched driver or passenger will show up here.</Text>
          </View>
        )}

        {conversationsQuery.isSuccess &&
          conversationsQuery.data.map((conversation) => (
            <ConversationRow
              key={conversation.id}
              conversation={conversation}
              onPress={() => router.push(`/chat/${conversation.id}`)}
            />
          ))}

        {conversationsQuery.isSuccess && conversationsQuery.data.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Messages are only visible to you and the other rider 🔒</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function ConversationRow({ conversation, onPress }: { conversation: ConversationSummary; onPress: () => void }) {
  const preview = conversation.lastMessage
    ? conversation.lastMessage.type === 'text'
      ? conversation.lastMessage.text ?? ''
      : '📎 Attachment'
    : 'Say hello!'

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.avatarWrap}>
        {conversation.otherMember.avatarUrl ? (
          <Image source={{ uri: conversation.otherMember.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>{conversation.otherMember.fullName.charAt(0).toUpperCase() || 'S'}</Text>
          </View>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.rowTop}>
          <Text style={styles.name}>{conversation.otherMember.fullName}</Text>
          <Text style={styles.time}>{conversation.lastMessage ? formatTimeAgo(conversation.lastMessage.createdAt) : formatTimeAgo(conversation.createdAt)}</Text>
        </View>
        <View style={styles.rowBottom}>
          <Text style={styles.lastMessage} numberOfLines={1}>{preview}</Text>
          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}><Text style={styles.unreadText}>{conversation.unreadCount}</Text></View>
          )}
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'white' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.slate100 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '800', color: colors.slate900 },
  subtitle: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  searchButton: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.slate100, alignItems: 'center', justifyContent: 'center' },
  centerState: { alignItems: 'center', paddingVertical: 64, gap: 8, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.slate700 },
  emptySub: { fontSize: 13, color: colors.slate400, textAlign: 'center', lineHeight: 18 },
  retryButton: { marginTop: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radii.md, borderWidth: 1, borderColor: colors.blueBorder },
  retryButtonText: { fontSize: 12, fontWeight: '700', color: colors.blue },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.slate50 },
  avatarWrap: { flexShrink: 0 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.slate100 },
  avatarFallback: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  avatarFallbackText: { color: 'white', fontWeight: '700', fontSize: 18 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: '600', color: colors.slate900 },
  time: { fontSize: 11, color: colors.slate400 },
  rowBottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  lastMessage: { fontSize: 12, color: colors.slate500, flex: 1 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center', flexShrink: 0, paddingHorizontal: 5 },
  unreadText: { fontSize: 10, fontWeight: '700', color: 'white' },
  footer: { paddingVertical: 32, alignItems: 'center' },
  footerText: { fontSize: 12, color: colors.slate400 },
})
