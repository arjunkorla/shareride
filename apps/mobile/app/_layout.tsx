import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth-store'
import { useRealtimeConnection } from '../lib/realtime/useRealtimeConnection'
import { useNotificationsRealtimeSync } from '../lib/realtime/useNotificationsRealtimeSync'
import { useChatRealtimeSync } from '../lib/realtime/useChatRealtimeSync'
import { useClearQueryCacheOnIdentityChange } from '../lib/useClearQueryCacheOnIdentityChange'
import { getStartupConfigError } from '../lib/startup-config'
import { ConfigurationRequiredScreen } from '../components/ConfigurationRequiredScreen'

const queryClient = new QueryClient()

// Top-level routes reachable without a session. Everything else (all tab
// screens plus every stack route ported in Phase 3 — post-ride, payment,
// chat/[id], profile/*, etc.) requires one.
const PUBLIC_SEGMENTS = new Set(['login', 'register', 'forgot-password', 'onboarding'])

function useProtectedRoute() {
  const session = useAuthStore((s) => s.session)
  const initializing = useAuthStore((s) => s.initializing)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (initializing) return
    const topSegment = segments[0]
    const onPublicRoute = topSegment === undefined || PUBLIC_SEGMENTS.has(topSegment)

    // Phase 3 ported every secondary screen (ride detail, payment, chat,
    // profile settings, ...) as its own top-level or nested route outside
    // the (tabs) group, none of which checked auth on their own — only
    // (tabs)/_layout.tsx redirected unauthenticated visitors. This centralizes
    // that so a deep link or cold start into any of them also redirects.
    if (!session && !onPublicRoute) {
      router.replace('/login')
    } else if (session && onPublicRoute && topSegment !== undefined) {
      router.replace('/(tabs)')
    }
  }, [session, initializing, segments, router])
}

// Needs to render inside QueryClientProvider (both realtime-sync hooks call
// useQueryClient) rather than run from RootLayout's own body, which is
// still outside the provider it returns.
function RealtimeSync() {
  useRealtimeConnection()
  useNotificationsRealtimeSync()
  useChatRealtimeSync()
  return null
}

// Checked once, outside the component tree — process.env values are fixed
// for the lifetime of the running app, never toggling mid-session, so
// rendering ConfigurationRequiredScreen instead of AppRoot here (rather than
// as a conditional return from inside AppRoot itself) is what lets AppRoot
// call its own hooks unconditionally without ever needing to skip any of
// them. See docs/agent-handoff.md's Build 5 postmortem for why this gate
// exists at all: lib/supabase.ts used to throw at module-import time
// instead of getting a chance to render anything here.
export default function RootLayout() {
  const configError = getStartupConfigError()
  if (configError) {
    return <ConfigurationRequiredScreen reason={configError} />
  }
  return <AppRoot />
}

function AppRoot() {
  const initializing = useAuthStore((s) => s.initializing)
  const init = useAuthStore((s) => s.init)
  const userId = useAuthStore((s) => s.session?.user?.id ?? null)

  useEffect(() => init(), [init])
  useProtectedRoute()
  useClearQueryCacheOnIdentityChange(queryClient, userId)

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeSync />
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }} />
    </QueryClientProvider>
  )
}
