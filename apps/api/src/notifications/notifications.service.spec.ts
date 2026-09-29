import { NotFoundException } from '@nestjs/common'
import { NotificationsService } from './notifications.service'
import type { PrismaService } from '../common/prisma/prisma.service'
import type { RealtimeGateway } from '../realtime/realtime.gateway'

describe('NotificationsService', () => {
  const OWNER_ID = 'user-a'
  const STRANGER_ID = 'user-b'
  const NOTIF_ID = 'notif-1'

  function makeNotification(overrides: Partial<{ userId: string; read: boolean }> = {}) {
    return {
      id: NOTIF_ID,
      userId: OWNER_ID,
      type: 'match',
      title: 'New match',
      body: 'A driver matched your request',
      read: false,
      deepLink: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
      ...overrides,
    }
  }

  function makePrisma(notification: ReturnType<typeof makeNotification> | null) {
    return {
      client: {
        notification: {
          findMany: jest.fn().mockResolvedValue(notification ? [notification] : []),
          findUnique: jest.fn().mockResolvedValue(notification),
          update: jest.fn().mockResolvedValue(notification ? { ...notification, read: true } : null),
          create: jest.fn().mockResolvedValue(notification ?? makeNotification()),
        },
      },
    } as unknown as PrismaService
  }

  function makeRealtime() {
    return { emitToUser: jest.fn() } as unknown as RealtimeGateway
  }

  it('only lists a user their own notifications (query scoped by userId, never a bare findMany)', async () => {
    const prisma = makePrisma(makeNotification())
    const service = new NotificationsService(prisma, makeRealtime())

    await service.list(OWNER_ID)

    expect(prisma.client.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: OWNER_ID } }),
    )
  })

  it('lets the owner mark their own notification read', async () => {
    const prisma = makePrisma(makeNotification())
    const service = new NotificationsService(prisma, makeRealtime())

    const result = await service.markRead(NOTIF_ID, OWNER_ID)

    expect(result.read).toBe(true)
  })

  it('refuses to mark another user’s notification as read (same not-found response as a missing id)', async () => {
    const prisma = makePrisma(makeNotification())
    const service = new NotificationsService(prisma, makeRealtime())

    await expect(service.markRead(NOTIF_ID, STRANGER_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('returns not-found for a nonexistent notification id', async () => {
    const prisma = makePrisma(null)
    const service = new NotificationsService(prisma, makeRealtime())

    await expect(service.markRead('does-not-exist', OWNER_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('pushes a created notification over the realtime gateway to its owner', async () => {
    const prisma = makePrisma(null)
    const realtime = makeRealtime()
    const service = new NotificationsService(prisma, realtime)

    await service.create(OWNER_ID, { type: 'match', title: 'New match', body: 'body' })

    expect(realtime.emitToUser).toHaveBeenCalledWith(OWNER_ID, 'notification:new', expect.objectContaining({ title: 'New match' }))
  })
})
