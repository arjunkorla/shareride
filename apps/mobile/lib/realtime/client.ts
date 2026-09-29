import { io, type Socket } from 'socket.io-client'

// apps/api/src/realtime's gateway listens on the '/realtime' Socket.IO
// namespace at the default '/socket.io' path on the raw HTTP server —
// NestJS's setGlobalPrefix('api/v1') in apps/api/src/main.ts only rewrites
// Express HTTP routes, not the WS gateway, so the socket URL is the API's
// origin, not EXPO_PUBLIC_API_URL itself (which already has /api/v1 on it).
function socketOrigin(): string {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'
  return new URL(apiUrl).origin
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

let socket: Socket | null = null
let socketToken: string | null = null

// Module-level singleton, deliberately not created per-hook-call: every
// screen that needs realtime updates shares this one connection instead of
// opening its own (see useSocketEvent.ts), so re-mounting a screen never
// spawns a duplicate socket.
export function connectSocket(token: string, onStatusChange: (status: ConnectionStatus) => void): Socket {
  if (socket && socketToken === token) return socket
  disconnectSocket()

  socketToken = token
  onStatusChange('connecting')

  const next = io(`${socketOrigin()}/realtime`, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  })

  next.on('connect', () => onStatusChange('connected'))
  next.on('disconnect', () => onStatusChange('disconnected'))
  next.on('connect_error', () => onStatusChange('disconnected'))

  socket = next
  return next
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
  }
  socket = null
  socketToken = null
}

export function getSocket(): Socket | null {
  return socket
}
