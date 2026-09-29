import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react-native'
import type { Message } from '@shareride/types'
import type { ConversationSummary } from '@shareride/api-client'
import { useRealtimeStore } from '../../store/realtime-store'
import { useActiveConversationStore } from '../../store/active-conversation-store'
import { CONVERSATIONS_QUERY_KEY, conversationMessagesQueryKey, useChatRealtimeSync } from './useChatRealtimeSync'

// A minimal stand-in for a socket.io-client Socket — only .on/.off/.emit
// are exercised by useSocketEvent.ts, so this fakes just that surface
// rather than pulling in the real socket.io-client transport.
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

function renderWithClient(queryClient: QueryClient) {
  return renderHook(() => useChatRealtimeSync(), {
    wrapper: ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  })
}

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'message-1',
    conversationId: 'conversation-1',
    senderId: 'user-2',
    type: 'text',
    text: 'hello',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeConversation(overrides: Partial<ConversationSummary> = {}): ConversationSummary {
  return {
    id: 'conversation-1',
    memberIds: ['user-1', 'user-2'],
    otherMember: { id: 'user-2', fullName: 'Driver' },
    lastMessage: null,
    unreadCount: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('useChatRealtimeSync', () => {
  beforeEach(() => {
    useActiveConversationStore.setState({ activeConversationId: null })
  })

  it('appends an incoming message to the cached message list', () => {
    const socket = makeFakeSocket()
    useRealtimeStore.setState({ socket: socket as never, status: 'connected' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
    queryClient.setQueryData(conversationMessagesQueryKey('conversation-1'), [])

    renderWithClient(queryClient)
    socket.emit('message:new', makeMessage())

    expect(queryClient.getQueryData(conversationMessagesQueryKey('conversation-1'))).toEqual([makeMessage()])
  })

  it('deduplicates a message that is already in the cache (e.g. a redelivered socket event)', () => {
    const socket = makeFakeSocket()
    useRealtimeStore.setState({ socket: socket as never, status: 'connected' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
    queryClient.setQueryData(conversationMessagesQueryKey('conversation-1'), [makeMessage()])

    renderWithClient(queryClient)
    socket.emit('message:new', makeMessage())

    expect(queryClient.getQueryData(conversationMessagesQueryKey('conversation-1'))).toEqual([makeMessage()])
  })

  it('bumps unreadCount for a conversation the user is not currently viewing', () => {
    const socket = makeFakeSocket()
    useRealtimeStore.setState({ socket: socket as never, status: 'connected' })
    useActiveConversationStore.setState({ activeConversationId: 'some-other-conversation' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
    queryClient.setQueryData(CONVERSATIONS_QUERY_KEY, [makeConversation({ unreadCount: 2 })])

    renderWithClient(queryClient)
    socket.emit('message:new', makeMessage())

    const conversations = queryClient.getQueryData<ConversationSummary[]>(CONVERSATIONS_QUERY_KEY)
    expect(conversations?.[0].unreadCount).toBe(3)
  })

  it('does not bump unreadCount for the conversation currently open on screen', () => {
    const socket = makeFakeSocket()
    useRealtimeStore.setState({ socket: socket as never, status: 'connected' })
    useActiveConversationStore.setState({ activeConversationId: 'conversation-1' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
    queryClient.setQueryData(CONVERSATIONS_QUERY_KEY, [makeConversation({ unreadCount: 2 })])

    renderWithClient(queryClient)
    socket.emit('message:new', makeMessage())

    const conversations = queryClient.getQueryData<ConversationSummary[]>(CONVERSATIONS_QUERY_KEY)
    expect(conversations?.[0].unreadCount).toBe(2)
  })

  it('moves the conversation receiving a new message to the top of the list', () => {
    const socket = makeFakeSocket()
    useRealtimeStore.setState({ socket: socket as never, status: 'connected' })
    const queryClient = new QueryClient({ defaultOptions: { queries: { gcTime: 0 } } })
    queryClient.setQueryData(CONVERSATIONS_QUERY_KEY, [
      makeConversation({ id: 'conversation-other', unreadCount: 0 }),
      makeConversation({ id: 'conversation-1', unreadCount: 0 }),
    ])

    renderWithClient(queryClient)
    socket.emit('message:new', makeMessage({ conversationId: 'conversation-1' }))

    const conversations = queryClient.getQueryData<ConversationSummary[]>(CONVERSATIONS_QUERY_KEY)
    expect(conversations?.[0].id).toBe('conversation-1')
  })
})
