import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@shareride/database'
import type { Conversation, Message, MessageType } from '@shareride/types'
import type { ConversationSummary } from '@shareride/api-client'
import type { SendMessageInput } from '@shareride/validation'
import { PrismaService } from '../common/prisma/prisma.service'
import { RealtimeGateway } from '../realtime/realtime.gateway'
import { NotificationsService } from '../notifications/notifications.service'
import { StructuredLogger } from '../common/logger/structured-logger.service'

const MESSAGE_LIST_LIMIT = 500

interface ConversationRecord {
  id: string
  tripId: string | null
  memberIds: string[]
  createdAt: Date
  updatedAt: Date
}

interface MessageRecord {
  id: string
  conversationId: string
  senderId: string
  type: string
  text: string | null
  attachmentUrl: string | null
  createdAt: Date
}

// Port of ChatListScreen/ChatDetailScreen onto real Conversation/Message
// models (docs/migration-plan.md Phase 9) — memberIds is a plain Postgres
// array (see schema.prisma's comment), so ownership/membership checks are
// simple `.includes()`/`hasEvery` rather than a join-table query. 1:1 only
// for this phase — `start()` finds-or-creates a two-member conversation,
// there's no group-chat creation path yet (schema allows it, nothing
// exposes it).
@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
    private readonly notifications: NotificationsService,
    private readonly logger: StructuredLogger,
  ) {
    this.logger.setContext(ChatService.name)
  }

  async start(userId: string, otherUserId: string): Promise<Conversation> {
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot start a conversation with yourself')
    }
    await this.assertMatched(userId, otherUserId)

    // pairKey (Phase 13) closes the race the old find-then-create had: two
    // concurrent calls for the same pair now both attempt the same unique
    // value, so at most one create() can ever succeed at the database
    // level, regardless of how the find-then-create race plays out.
    const pairKey = conversationPairKey(userId, otherUserId)

    const existing = await this.prisma.client.conversation.findUnique({ where: { pairKey } })
    if (existing) return this.toConversation(existing)

    try {
      const created = await this.prisma.client.conversation.create({
        data: { memberIds: [userId, otherUserId], pairKey },
      })
      return this.toConversation(created)
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        // Lost the race — the other concurrent call's row already exists.
        const winner = await this.prisma.client.conversation.findUnique({ where: { pairKey } })
        if (winner) return this.toConversation(winner)
      }
      throw error
    }
  }

  async list(userId: string): Promise<ConversationSummary[]> {
    const conversations = await this.prisma.client.conversation.findMany({
      where: { memberIds: { has: userId } },
      orderBy: { updatedAt: 'desc' },
    })

    const summaries: ConversationSummary[] = []
    for (const conversation of conversations) {
      const otherUserId = conversation.memberIds.find((id) => id !== userId)
      if (!otherUserId) continue

      const [otherUser, lastMessage, read] = await Promise.all([
        this.prisma.client.user.findUnique({ where: { id: otherUserId } }),
        this.prisma.client.message.findFirst({ where: { conversationId: conversation.id }, orderBy: { createdAt: 'desc' } }),
        this.prisma.client.conversationRead.findUnique({ where: { conversationId_userId: { conversationId: conversation.id, userId } } }),
      ])
      if (!otherUser) continue

      // No row yet = this member has never opened the conversation, so
      // everything since it was created counts.
      const since = read?.lastReadAt ?? conversation.createdAt
      const unreadCount = await this.prisma.client.message.count({
        where: { conversationId: conversation.id, senderId: { not: userId }, createdAt: { gt: since } },
      })

      summaries.push({
        ...this.toConversation(conversation),
        otherMember: { id: otherUser.id, fullName: otherUser.fullName, avatarUrl: otherUser.avatarUrl ?? undefined },
        lastMessage: lastMessage
          ? { text: lastMessage.text, type: lastMessage.type as MessageType, createdAt: lastMessage.createdAt.toISOString() }
          : null,
        unreadCount,
      })
    }
    return summaries
  }

  // Called when the caller opens app/chat/[id].tsx. Identity comes from
  // the authenticated JWT (CurrentUser()) in the controller — never a
  // client-supplied userId, so a user can only ever mark their own read
  // state, matching every other ownership check in this service.
  async markRead(conversationId: string, userId: string): Promise<{ conversationId: string; lastReadAt: string }> {
    await this.findOwned(conversationId, userId)
    const record = await this.prisma.client.conversationRead.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      create: { conversationId, userId },
      update: { lastReadAt: new Date() },
    })
    return { conversationId: record.conversationId, lastReadAt: record.lastReadAt.toISOString() }
  }

  // Chat is scoped to matched participants, not "message any user" — a
  // Match connects a RideRequest.passengerId and a RideOffer.driverId, and
  // SUGGESTED (the matching engine's own candidate list, nothing either
  // side has acted on) doesn't count: chatting only becomes appropriate
  // once the passenger has actually sent a request — REQUESTED, CONFIRMED,
  // or a since-declined one (DECLINED only ever transitions FROM REQUESTED,
  // see match-transitions.util.ts's canDecline), all of which mean the
  // passenger genuinely reached out to this specific driver.
  //
  // Deliberately excludes CANCELLED/EXPIRED: CANCELLED can be reached
  // directly from SUGGESTED too (MatchingService.accept()'s auto-cancel of
  // every OTHER still-pending candidate for the same RideRequest, which
  // includes ones that were never REQUESTED at all — see
  // AUTO_CANCEL_ON_ACCEPT_STATUSES). Since a Match row doesn't record
  // which status it transitioned FROM, there's no way to tell "was
  // genuinely requested, then cancelled" apart from "was never requested,
  // auto-cancelled" from its current status alone — so the safe rule
  // excludes CANCELLED entirely rather than let an unrequested candidate
  // through. See docs/agent-handoff.md finding C08.
  private async assertMatched(userId: string, otherUserId: string): Promise<void> {
    const match = await this.prisma.client.match.findFirst({
      where: {
        matchStatus: { in: ['REQUESTED', 'CONFIRMED', 'DECLINED'] },
        OR: [
          { rideRequest: { passengerId: userId }, rideOffer: { driverId: otherUserId } },
          { rideRequest: { passengerId: otherUserId }, rideOffer: { driverId: userId } },
        ],
      },
    })
    if (!match) {
      throw new ForbiddenException('You can only message a matched passenger or driver')
    }
  }

  // A long-running matched pair (repeat commute partners messaging over
  // months) is the one genuinely unbounded list in this module — capped at
  // the most recent MESSAGE_LIST_LIMIT rather than truly paginated: no
  // client UI for "load older messages" exists yet, so this is a safety
  // bound against an unbounded query/response, not a product feature.
  // Response shape (a plain Message[], oldest-first) is unchanged.
  async listMessages(conversationId: string, userId: string): Promise<Message[]> {
    const conversation = await this.findOwned(conversationId, userId)
    const records = await this.prisma.client.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: MESSAGE_LIST_LIMIT,
    })
    return records.reverse().map((r) => this.toMessage(r))
  }

  async sendMessage(conversationId: string, senderId: string, input: SendMessageInput): Promise<Message> {
    const conversation = await this.findOwned(conversationId, senderId)

    const [record, sender] = await Promise.all([
      this.prisma.client.$transaction(async (tx) => {
        const message = await tx.message.create({
          data: {
            conversationId: conversation.id,
            senderId,
            type: input.type ?? 'text',
            text: input.text,
            attachmentUrl: input.attachmentUrl,
          },
        })
        await tx.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } })
        return message
      }),
      this.prisma.client.user.findUnique({ where: { id: senderId }, select: { fullName: true } }),
    ])

    const message = this.toMessage(record)
    const otherMemberId = conversation.memberIds.find((id) => id !== senderId)
    if (otherMemberId) {
      // Two distinct events, not a duplicate: 'message:new' is the
      // chat-thread-specific push (ChatDetailScreen/conversation list
      // patch their TanStack Query cache directly from it); 'notification:new'
      // is the generic feed/badge, and only ever fires from inside
      // NotificationsService.create() — nothing here emits it a second time.
      this.realtime.emitToUser(otherMemberId, 'message:new', message)
      // Best-effort, isolated from the response: the message already
      // committed and was already pushed via the realtime event above — a
      // notification-write failure must not turn an already-successful
      // send into a 500 (the client would retry and create a duplicate
      // message). See docs/agent-handoff.md finding C18.
      try {
        await this.notifications.create(otherMemberId, {
          type: 'message',
          title: sender?.fullName ?? 'New message',
          body: message.type === 'text' ? (message.text ?? 'Sent an attachment') : 'Sent an attachment',
          deepLink: `/chat/${conversationId}`,
        })
      } catch (error) {
        this.logger.error('Failed to create notification for a sent message', (error as Error).stack, {
          conversationId,
          recipientId: otherMemberId,
        })
      }
    }
    return message
  }

  private async findOwned(conversationId: string, userId: string): Promise<ConversationRecord> {
    const conversation = await this.prisma.client.conversation.findUnique({ where: { id: conversationId } })
    if (!conversation || !conversation.memberIds.includes(userId)) {
      throw new NotFoundException('Conversation not found')
    }
    return conversation
  }

  private toConversation(record: ConversationRecord): Conversation {
    return {
      id: record.id,
      tripId: record.tripId ?? undefined,
      memberIds: record.memberIds,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }
  }

  private toMessage(record: MessageRecord): Message {
    return {
      id: record.id,
      conversationId: record.conversationId,
      senderId: record.senderId,
      type: record.type as MessageType,
      text: record.text ?? undefined,
      attachmentUrl: record.attachmentUrl ?? undefined,
      createdAt: record.createdAt.toISOString(),
    }
  }
}

// Exported (not a private method) so it's directly unit-testable without
// constructing a ChatService — sort order must be deterministic regardless
// of which user calls start() first, or the same pair would compute two
// different keys and defeat the unique constraint entirely.
export function conversationPairKey(userId: string, otherUserId: string): string {
  return [userId, otherUserId].sort().join(':')
}
