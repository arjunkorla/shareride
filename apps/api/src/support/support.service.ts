import { Injectable, NotFoundException } from '@nestjs/common'
import type { SupportTicket } from '@shareride/types'
import type { CreateSupportTicketInput } from '@shareride/validation'
import { PrismaService } from '../common/prisma/prisma.service'

interface SupportTicketRecord {
  id: string
  userId: string
  category: string
  subject: string
  message: string
  status: string
  createdAt: Date
  updatedAt: Date
}

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateSupportTicketInput): Promise<SupportTicket> {
    const record = await this.prisma.client.supportTicket.create({
      data: { userId, category: input.category, subject: input.subject, message: input.message },
    })
    return this.toTicket(record)
  }

  async listOwn(userId: string): Promise<SupportTicket[]> {
    const records = await this.prisma.client.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return records.map((r) => this.toTicket(r))
  }

  async getOwn(id: string, userId: string): Promise<SupportTicket> {
    const record = await this.prisma.client.supportTicket.findUnique({ where: { id } })
    if (!record || record.userId !== userId) {
      throw new NotFoundException('Support ticket not found')
    }
    return this.toTicket(record)
  }

  private toTicket(record: SupportTicketRecord): SupportTicket {
    return {
      id: record.id,
      userId: record.userId,
      category: record.category,
      subject: record.subject,
      message: record.message,
      status: record.status as SupportTicket['status'],
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }
  }
}
