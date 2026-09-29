import { Injectable, NotFoundException } from '@nestjs/common'
import type { AppNotification } from '@shareride/types'
import { PrismaService } from '../common/prisma/prisma.service'
import { RealtimeGateway } from '../realtime/realtime.gateway'

interface NotificationRecord {
  id: string
  userId: string
  type: string
  title: string
  body: string
  read: boolean
  deepLink: string | null
  createdAt: Date
}

// Uses the Notification table that already existed before Phase 9 (built
// for the admin console's read path — see AccountStatus-era migrations);
// this is the first time anything actually WRITES to it. No push-to-device
// (FCM/Expo push) yet — `create()` pushes an in-app `notification:new`
// event over RealtimeGateway, which is the "in-app feed" half of the phase
// brief's "FCM/Expo push + in-app feed"; wiring an actual device push
// provider is a separate, later piece of work (needs FCM/Expo credentials
// this environment doesn't have).
@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeGateway,
  ) {}

  async list(userId: string): Promise<AppNotification[]> {
    const records = await this.prisma.client.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return records.map((r) => this.toNotification(r))
  }

  async markRead(id: string, userId: string): Promise<AppNotification> {
    const record = await this.prisma.client.notification.findUnique({ where: { id } })
    if (!record || record.userId !== userId) {
      throw new NotFoundException('Notification not found')
    }
    const updated = await this.prisma.client.notification.update({ where: { id }, data: { read: true } })
    return this.toNotification(updated)
  }

  // Internal — called from other services (MatchingService's
  // request/accept/decline) as a side effect of a real event, never
  // exposed as its own "create a notification" endpoint.
  async create(userId: string, input: { type: AppNotification['type']; title: string; body: string; deepLink?: string }): Promise<AppNotification> {
    const record = await this.prisma.client.notification.create({
      data: { userId, type: input.type, title: input.title, body: input.body, deepLink: input.deepLink },
    })
    const notification = this.toNotification(record)
    this.realtime.emitToUser(userId, 'notification:new', notification)
    return notification
  }

  private toNotification(record: NotificationRecord): AppNotification {
    return {
      id: record.id,
      userId: record.userId,
      type: record.type as AppNotification['type'],
      title: record.title,
      body: record.body,
      read: record.read,
      createdAt: record.createdAt.toISOString(),
      deepLink: record.deepLink ?? undefined,
    }
  }
}
