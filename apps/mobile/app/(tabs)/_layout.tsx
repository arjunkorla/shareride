import { Redirect, Tabs, useRouter } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../../store/auth-store'
import { colors } from '../../lib/theme'
import { api } from '../../lib/api'
import { CONVERSATIONS_QUERY_KEY } from '../../lib/realtime/useChatRealtimeSync'
import { ChatTabIcon, DiscoverTabIcon, HomeTabIcon, PlusIcon, ProfileTabIcon, TripsTabIcon } from '../../components/icons'

// Mirrors the prototype's BottomNav (src/components/BottomNav.tsx): Home /
// Discover / My Rides / Chat / Profile as real tabs, with "Post" as a
// floating center action (not a 6th tab/route) that opens /post-ride.
export default function TabsLayout() {
  const session = useAuthStore((s) => s.session)
  const router = useRouter()
  const insets = useSafeAreaInsets()
  // Server-backed (ConversationSummary.unreadCount — see
  // apps/api/src/chat/chat.service.ts's list()), durable across restarts
  // and devices. Shares its cache/fetch with app/(tabs)/chat.tsx via the
  // same query key, kept live by useChatRealtimeSync.ts.
  const conversationsQuery = useQuery({ queryKey: CONVERSATIONS_QUERY_KEY, queryFn: () => api.chat.list(), enabled: Boolean(session) })
  const unread = conversationsQuery.data?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0
  if (!session) return <Redirect href="/login" />

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.blue,
          tabBarInactiveTintColor: colors.slate400,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
          tabBarStyle: { height: 64 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 6 },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ focused }) => <HomeTabIcon filled={focused} /> }} />
        <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: ({ focused }) => <DiscoverTabIcon filled={focused} /> }} />
        <Tabs.Screen name="my-rides" options={{ title: 'My Rides', tabBarIcon: ({ focused }) => <TripsTabIcon filled={focused} /> }} />
        <Tabs.Screen name="chat" options={{ title: 'Chat', tabBarBadge: unread > 0 ? unread : undefined, tabBarIcon: ({ focused }) => <ChatTabIcon filled={focused} /> }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ focused }) => <ProfileTabIcon filled={focused} /> }} />
      </Tabs>

      <Pressable
        style={[styles.fab, { bottom: 34 + insets.bottom }]}
        onPress={() => router.push('/post-ride')}
      >
        <PlusIcon />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.blue,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
})
