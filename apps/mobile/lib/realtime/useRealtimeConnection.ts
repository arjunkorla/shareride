import { useEffect } from 'react'
import { AppState } from 'react-native'
import { useAuthStore } from '../../store/auth-store'
import { useRealtimeStore } from '../../store/realtime-store'
import { connectSocket, disconnectSocket } from './client'

// Mounted once from app/_layout.tsx. Owns the socket's entire lifecycle:
// connects when a session exists, disconnects on logout, reconnects when
// Supabase rotates the access token (connectSocket no-ops if the token
// hasn't actually changed), and nudges a reconnect when the app returns to
// the foreground — Socket.IO's own `reconnection` option handles a
// same-foreground network blip, but a backgrounded RN app can have its
// socket torn down by the OS entirely, so foreground is the one transition
// that needs an explicit check rather than trusting the library to notice.
export function useRealtimeConnection(): void {
  const accessToken = useAuthStore((s) => s.session?.access_token)
  const setSocket = useRealtimeStore((s) => s.setSocket)
  const setStatus = useRealtimeStore((s) => s.setStatus)

  useEffect(() => {
    if (!accessToken) {
      disconnectSocket()
      setSocket(null)
      setStatus('disconnected')
      return
    }

    const socket = connectSocket(accessToken, setStatus)
    setSocket(socket)

    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return
      const latestToken = useAuthStore.getState().session?.access_token
      if (!latestToken) return
      const reconnected = connectSocket(latestToken, setStatus)
      setSocket(reconnected)
    })

    return () => subscription.remove()
  }, [accessToken, setSocket, setStatus])

  // Belt-and-braces: if the whole app unmounts (never happens on a device,
  // but matters for fast-refresh during development), leave no dangling
  // connection behind.
  useEffect(() => () => disconnectSocket(), [])
}
