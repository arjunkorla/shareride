import { useEffect, useRef } from 'react'
import { useRealtimeStore } from '../../store/realtime-store'

// Subscribes to one Socket.IO event on the shared connection for the
// lifetime of the calling component. Re-subscribes if the socket instance
// itself changes (e.g. reconnect after logout/login creates a new Socket)
// and always removes its own listener on unmount/dependency change, so
// re-mounting a screen (navigating to it repeatedly) never stacks up
// duplicate handlers on the same event.
export function useSocketEvent<T>(event: string, handler: (payload: T) => void): void {
  const socket = useRealtimeStore((s) => s.socket)
  const handlerRef = useRef(handler)
  handlerRef.current = handler

  useEffect(() => {
    if (!socket) return
    const listener = (payload: T) => handlerRef.current(payload)
    socket.on(event, listener)
    return () => {
      socket.off(event, listener)
    }
  }, [socket, event])
}
