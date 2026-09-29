import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { prisma, PrismaClient } from '@shareride/database'

// Wraps the shared @shareride/database singleton as a Nest provider so it
// participates in the application's lifecycle (connect on boot, disconnect
// on shutdown) instead of every module importing the raw singleton directly.
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  readonly client: PrismaClient = prisma

  async onModuleInit() {
    await this.client.$connect()
  }

  async onModuleDestroy() {
    await this.client.$disconnect()
  }
}
