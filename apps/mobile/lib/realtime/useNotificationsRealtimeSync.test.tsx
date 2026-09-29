import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react-native'
import type { AppNotification } from '@shareride/types'
import { useRealtimeStore } from '../../store/realtime-store'
import { NOTIFICATIONS_QUERY_KEY, useNotificationsRealtimeSync } from './useNotificationsRealtimeSync'

function makeFakeSocket() {
  const handlers = new Map<string, (payload: unknown) => void>()
  return {
    on: jest.fn((event: string, handler: (payload: unknown) => void) => {
      handlers.set(event, handler)
    }),
    off: jest.fn((event: string) => {
      handlers.delete(event)
    }),
    emit(event: string, payload: unknown) {
      handlers.get(event)?.(payload)
    },
  }
}

function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: 'notification-1',
    userId: 'user-1',
    type: 'match',
    title: 'New match',
    body: 'A driver matched your request',
    read: false,
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('useNotificationsRealtimeSync', () => {
  it('prepends an incoming notification to the cached list, most recent first', () => {
    const socket = makeFakeSocket()
    useRealtimeStore.setState({ socket: socket as never, status: 'connected' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
    queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, [makeNotification({ id: 'older' })])

    renderHook(() => useNotificationsRealtimeSync(), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    })
    socket.emit('notification:new', makeNotification({ id: 'newer' }))

    const cached = queryClient.getQueryData<AppNotification[]>(NOTIFICATIONS_QUERY_KEY)
    expect(cached?.map((n) => n.id)).toEqual(['newer', 'older'])
  })

  it('deduplicates a notification already present in the cache', () => {
    const socket = makeFakeSocket()
    useRealtimeStore.setState({ socket: socket as never, status: 'connected' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
    queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, [makeNotification({ id: 'dup' })])

    renderHook(() => useNotificationsRealtimeSync(), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    })
    socket.emit('notification:new', makeNotification({ id: 'dup' }))

    const cached = queryClient.getQueryData<AppNotification[]>(NOTIFICATIONS_QUERY_KEY)
    expect(cached).toHaveLength(1)
  })

  it('does nothing when the notifications query has never been fetched (no cache seeded yet)', () => {
    const socket = makeFakeSocket()
    useRealtimeStore.setState({ socket: socket as never, status: 'connected' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })

    renderHook(() => useNotificationsRealtimeSync(), {
      wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
    })
    socket.emit('notification:new', makeNotification())

    expect(queryClient.getQueryData(NOTIFICATIONS_QUERY_KEY)).toBeUndefined()
  })
})
