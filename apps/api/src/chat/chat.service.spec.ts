import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Prisma } from '@shareride/database'
import { ChatService, conversationPairKey } from './chat.service'
import type { PrismaService } from '../common/prisma/prisma.service'
import type { RealtimeGateway } from '../realtime/realtime.gateway'
import type { NotificationsService } from '../notifications/notifications.service'
import type { StructuredLogger } from '../common/logger/structured-logger.service'

function duplicatePairKeyError() {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: '5.22.0' })
}

// Phase 9's authorization boundary: a user must only ever read/send within
// a conversation whose memberIds include them, and can only start one with
// someone they actually have a real (non-SUGGESTED) Match with. Unit tests
// against ChatService directly (hand-built Prisma/RealtimeGateway/
// NotificationsService fakes, no live DB).
describe('ChatService', () => {
  const CONVO_ID = 'convo-1'
  const OWNER_ID = 'user-a'
  const OTHER_MEMBER_ID = 'user-b'
  const STRANGER_ID = 'user-c'

  function makeConversation(overrides: Partial<{ id: string; tripId: string | null; memberIds: string[]; createdAt: Date }> = {}) {
    return {
      id: CONVO_ID,
      tripId: null,
      memberIds: [OWNER_ID, OTHER_MEMBER_ID],
      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
      ...overrides,
    }
  }

  function makePrisma(options: {
    conversation?: ReturnType<typeof makeConversation> | null
    matchExists?: boolean
    read?: { lastReadAt: Date } | null
    unreadCount?: number
  } = {}) {
    const conversation = options.conversation === undefined ? makeConversation() : options.conversation
    const matchExists = options.matchExists ?? true
    return {
      client: {
        conversation: {
          findUnique: jest.fn().mockResolvedValue(conversation),
          findFirst: jest.fn().mockResolvedValue(conversation),
          findMany: jest.fn().mockResolvedValue(conversation ? [conversation] : []),
          create: jest.fn().mockResolvedValue(conversation ?? makeConversation()),
          update: jest.fn().mockResolvedValue(conversation ?? makeConversation()),
        },
        match: {
          findFirst: jest.fn().mockResolvedValue(matchExists ? { id: 'match-1' } : null),
        },
        conversationRead: {
          findUnique: jest.fn().mockResolvedValue(options.read ?? null),
          upsert: jest.fn().mockResolvedValue({ conversationId: CONVO_ID, userId: OWNER_ID, lastReadAt: new Date('2026-01-02T00:00:00Z') }),
        },
        message: {
          create: jest.fn().mockResolvedValue({
            id: 'msg-1',
            conversationId: CONVO_ID,
            senderId: OWNER_ID,
            type: 'text',
            text: 'hello',
            attachmentUrl: null,
            createdAt: new Date('2026-01-01T00:00:00Z'),
          }),
          findFirst: jest.fn().mockResolvedValue(null),
          findMany: jest.fn().mockResolvedValue([]),
          count: jest.fn().mockResolvedValue(options.unreadCount ?? 0),
        },
        user: {
          findUnique: jest.fn().mockResolvedValue({ id: OTHER_MEMBER_ID, fullName: 'Other User', avatarUrl: null }),
        },
        $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn({
          message: { create: jest.fn().mockResolvedValue({ id: 'msg-1', conversationId: CONVO_ID, senderId: OWNER_ID, type: 'text', text: 'hello', attachmentUrl: null, createdAt: new Date() }) },
          conversation: { update: jest.fn() },
        })),
      },
    } as unknown as PrismaService
  }

  function makeRealtime() {
    return { emitToUser: jest.fn() } as unknown as RealtimeGateway
  }

  function makeLogger() {
    return { setContext: jest.fn(), log: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(), verbose: jest.fn(), logEvent: jest.fn() } as unknown as StructuredLogger
  }

  function makeNotifications() {
    return { create: jest.fn().mockResolvedValue(undefined) } as unknown as NotificationsService
  }

  it('rejects starting a conversation with yourself', async () => {
    const service = new ChatService(makePrisma({ conversation: null }), makeRealtime(), makeNotifications(), makeLogger())
    await expect(service.start(OWNER_ID, OWNER_ID)).rejects.toBeInstanceOf(BadRequestException)
  })

  it('refuses to start a conversation with a user there is no real match with', async () => {
    const service = new ChatService(makePrisma({ conversation: null, matchExists: false }), makeRealtime(), makeNotifications(), makeLogger())
    await expect(service.start(OWNER_ID, STRANGER_ID)).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('excludes SUGGESTED and CANCELLED from chat eligibility — only an actually-requested match counts (docs/agent-handoff.md C08)', async () => {
    const prisma = makePrisma({ conversation: null, matchExists: true })
    const service = new ChatService(prisma, makeRealtime(), makeNotifications(), makeLogger())

    await service.start(OWNER_ID, OTHER_MEMBER_ID)

    expect(prisma.client.match.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ matchStatus: { in: ['REQUESTED', 'CONFIRMED', 'DECLINED'] } }) }),
    )
  })

  it('returns the existing conversation instead of creating a duplicate for the same matched pair', async () => {
    const prisma = makePrisma({ matchExists: true })
    const service = new ChatService(prisma, makeRealtime(), makeNotifications(), makeLogger())

    const result = await service.start(OWNER_ID, OTHER_MEMBER_ID)

    expect(result.id).toBe(CONVO_ID)
    expect(prisma.client.conversation.create).not.toHaveBeenCalled()
  })

  it('computes the same pairKey regardless of who calls start() first (order-independent)', () => {
    expect(conversationPairKey(OWNER_ID, OTHER_MEMBER_ID)).toBe(conversationPairKey(OTHER_MEMBER_ID, OWNER_ID))
  })

  it('recovers from a genuine concurrent-create race by returning the winning row instead of throwing', async () => {
    const prisma = makePrisma({ conversation: null, matchExists: true })
    // First findUnique (pre-create check): nothing exists yet. create()
    // then loses the race to a concurrent call and throws P2002. The
    // second findUnique (post-P2002 recovery) picks up that winner.
    prisma.client.conversation.findUnique = jest.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(makeConversation())
    prisma.client.conversation.create = jest.fn().mockRejectedValue(duplicatePairKeyError())
    const service = new ChatService(prisma, makeRealtime(), makeNotifications(), makeLogger())

    const result = await service.start(OWNER_ID, OTHER_MEMBER_ID)

    expect(result.id).toBe(CONVO_ID)
  })

  it('lets a member list messages in their own conversation', async () => {
    const prisma = makePrisma()
    const service = new ChatService(prisma, makeRealtime(), makeNotifications(), makeLogger())
    await expect(service.listMessages(CONVO_ID, OWNER_ID)).resolves.toEqual([])
  })

  it('caps message history at the most recent 500 while still returning them oldest-first', async () => {
    const prisma = makePrisma()
    const newest = { id: 'msg-newest', conversationId: CONVO_ID, senderId: OWNER_ID, type: 'text', text: 'newest', attachmentUrl: null, createdAt: new Date('2026-01-02T00:00:00Z') }
    const oldest = { id: 'msg-oldest', conversationId: CONVO_ID, senderId: OWNER_ID, type: 'text', text: 'oldest', attachmentUrl: null, createdAt: new Date('2026-01-01T00:00:00Z') }
    // Prisma returns rows in the query's own orderBy — desc here, so the
    // fake mimics that (newest row first) rather than assuming the service
    // re-sorts on its own.
    prisma.client.message.findMany = jest.fn().mockResolvedValue([newest, oldest])
    const service = new ChatService(prisma, makeRealtime(), makeNotifications(), makeLogger())

    const messages = await service.listMessages(CONVO_ID, OWNER_ID)

    expect(prisma.client.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' }, take: 500 }),
    )
    expect(messages.map((m) => m.id)).toEqual(['msg-oldest', 'msg-newest'])
  })

  it('refuses to list messages for a user who is not a member', async () => {
    const prisma = makePrisma()
    const service = new ChatService(prisma, makeRealtime(), makeNotifications(), makeLogger())
    await expect(service.listMessages(CONVO_ID, STRANGER_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('refuses to send a message into a conversation the caller does not belong to', async () => {
    const prisma = makePrisma()
    const service = new ChatService(prisma, makeRealtime(), makeNotifications(), makeLogger())
    await expect(service.sendMessage(CONVO_ID, STRANGER_ID, { type: 'text', text: 'hi' })).rejects.toBeInstanceOf(NotFoundException)
  })

  it('reports the same not-found error for a nonexistent conversation as for one the caller cannot see', async () => {
    const prisma = makePrisma({ conversation: null })
    const service = new ChatService(prisma, makeRealtime(), makeNotifications(), makeLogger())
    await expect(service.listMessages('does-not-exist', OWNER_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('pushes a sent message to the other member only, never back to the sender', async () => {
    const prisma = makePrisma()
    const realtime = makeRealtime()
    const service = new ChatService(prisma, realtime, makeNotifications(), makeLogger())

    await service.sendMessage(CONVO_ID, OWNER_ID, { type: 'text', text: 'hello' })

    expect(realtime.emitToUser).toHaveBeenCalledTimes(1)
    expect(realtime.emitToUser).toHaveBeenCalledWith(OTHER_MEMBER_ID, 'message:new', expect.objectContaining({ text: 'hello' }))
  })

  it('creates a persisted notification for the recipient, not the sender, on a new message', async () => {
    const prisma = makePrisma()
    const notifications = makeNotifications()
    const service = new ChatService(prisma, makeRealtime(), notifications, makeLogger())

    await service.sendMessage(CONVO_ID, OWNER_ID, { type: 'text', text: 'hello' })

    expect(notifications.create).toHaveBeenCalledTimes(1)
    expect(notifications.create).toHaveBeenCalledWith(OTHER_MEMBER_ID, expect.objectContaining({ type: 'message' }))
  })

  // docs/agent-handoff.md finding C18: the message already committed and
  // was already pushed via the realtime event by the time the
  // notification write runs — its failure must not turn that into a
  // request error the sender sees (and might retry, creating a duplicate
  // message).
  it('still returns the sent message successfully even when creating the notification fails', async () => {
    const prisma = makePrisma()
    const notifications = { create: jest.fn().mockRejectedValue(new Error('notifications table unavailable')) } as unknown as NotificationsService
    const realtime = makeRealtime()
    const service = new ChatService(prisma, realtime, notifications, makeLogger())

    const message = await service.sendMessage(CONVO_ID, OWNER_ID, { type: 'text', text: 'hello' })

    expect(message.text).toBe('hello')
    expect(realtime.emitToUser).toHaveBeenCalled()
  })

  it('lets a member mark their own read state on a conversation they belong to', async () => {
    const prisma = makePrisma()
    const service = new ChatService(prisma, makeRealtime(), makeNotifications(), makeLogger())

    await expect(service.markRead(CONVO_ID, OWNER_ID)).resolves.toEqual(
      expect.objectContaining({ conversationId: CONVO_ID }),
    )
    expect(prisma.client.conversationRead.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { conversationId_userId: { conversationId: CONVO_ID, userId: OWNER_ID } } }),
    )
  })

  it('refuses to let a non-member mark a conversation read', async () => {
    const prisma = makePrisma()
    const service = new ChatService(prisma, makeRealtime(), makeNotifications(), makeLogger())
    await expect(service.markRead(CONVO_ID, STRANGER_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('counts messages from the other member since lastReadAt as unread', async () => {
    const prisma = makePrisma({ read: { lastReadAt: new Date('2026-01-05T00:00:00Z') }, unreadCount: 3 })
    const service = new ChatService(prisma, makeRealtime(), makeNotifications(), makeLogger())

    const [summary] = await service.list(OWNER_ID)

    expect(summary.unreadCount).toBe(3)
    expect(prisma.client.message.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ createdAt: { gt: new Date('2026-01-05T00:00:00Z') } }) }),
    )
  })

  it('treats a conversation with no read row yet as unread since it was created', async () => {
    const prisma = makePrisma({ read: null, unreadCount: 2 })
    const service = new ChatService(prisma, makeRealtime(), makeNotifications(), makeLogger())

    await service.list(OWNER_ID)

    expect(prisma.client.message.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ createdAt: { gt: new Date('2026-01-01T00:00:00Z') } }) }),
    )
  })
})
