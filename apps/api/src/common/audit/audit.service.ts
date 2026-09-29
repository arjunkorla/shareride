import { Injectable } from '@nestjs/common'
import type { Prisma } from '@shareride/database'
import { PrismaService } from '../prisma/prisma.service'

export interface AuditEntry {
  adminId: string
  action: string
  module: string
  entity: string
  entityId: string
  previousValue?: Record<string, unknown> | null
  newValue?: Record<string, unknown> | null
  result: 'SUCCESS' | 'FAILURE'
  requestId?: string
}

// Every admin write in this codebase goes through here — see
// docs/current-architecture.md / the brief's "every admin action creates an
// audit record" rule. Audit logs themselves have no update/delete endpoint
// anywhere in the API: they're append-only by construction.
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(entry: AuditEntry) {
    await this.prisma.client.auditLog.create({
      data: {
        adminId: entry.adminId,
        action: entry.action,
        module: entry.module,
        entity: entry.entity,
        entityId: entry.entityId,
        previousValue: (entry.previousValue ?? undefined) as Prisma.InputJsonValue | undefined,
        newValue: (entry.newValue ?? undefined) as Prisma.InputJsonValue | undefined,
        result: entry.result,
        requestId: entry.requestId,
      },
    })
  }
}
