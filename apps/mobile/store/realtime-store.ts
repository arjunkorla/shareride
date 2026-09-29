import { create } from 'zustand'
import type { Socket } from 'socket.io-client'
import type { ConnectionStatus } from '../lib/realtime/client'

interface RealtimeState {
  socket: Socket | null
  status: ConnectionStatus
  setSocket: (socket: Socket | null) => void
  setStatus: (status: ConnectionStatus) => void
}

// Holds the current socket instance + connection status so any screen can
// read them (useSocketEvent.ts subscribes off `socket`, a connection
// indicator could read `status`) without re-deriving the connection
// lifecycle itself — that lifecycle lives in useRealtimeConnection.ts,
// mounted once from app/_layout.tsx.
export const useRealtimeStore = create<RealtimeState>((set) => ({
  socket: null,
  status: 'disconnected',
  setSocket: (socket) => set({ socket }),
  setStatus: (status) => set({ status }),
}))
