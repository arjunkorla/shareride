import { Injectable, NotFoundException } from '@nestjs/common'
import type { EmergencyContact } from '@shareride/types'
import type { CreateEmergencyContactInput } from '@shareride/validation'
import { PrismaService } from '../common/prisma/prisma.service'

interface EmergencyContactRecord {
  id: string
  userId: string
  name: string
  phone: string
  relation: string | null
  createdAt: Date
}

// Strictly own-scoped in every method — an emergency contact's phone
// number is private to the account that added it, never exposed through
// any other user's request (docs/migration-plan.md Phase 10's explicit
// "never expose another user's emergency contacts" rule).
@Injectable()
export class EmergencyContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, input: CreateEmergencyContactInput): Promise<EmergencyContact> {
    const record = await this.prisma.client.emergencyContact.create({
      data: { userId, name: input.name, phone: input.phone, relation: input.relation },
    })
    return this.toContact(record)
  }

  async list(userId: string): Promise<EmergencyContact[]> {
    const records = await this.prisma.client.emergencyContact.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    })
    return records.map((r) => this.toContact(r))
  }

  async remove(id: string, userId: string): Promise<void> {
    const record = await this.prisma.client.emergencyContact.findUnique({ where: { id } })
    if (!record || record.userId !== userId) {
      throw new NotFoundException('Emergency contact not found')
    }
    await this.prisma.client.emergencyContact.delete({ where: { id } })
  }

  private toContact(record: EmergencyContactRecord): EmergencyContact {
    return {
      id: record.id,
      userId: record.userId,
      name: record.name,
      phone: record.phone,
      relation: record.relation ?? undefined,
      createdAt: record.createdAt.toISOString(),
    }
  }
}
