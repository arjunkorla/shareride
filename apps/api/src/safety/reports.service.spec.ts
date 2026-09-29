import { NotFoundException } from '@nestjs/common'
import { ReportsService } from './reports.service'
import type { PrismaService } from '../common/prisma/prisma.service'

describe('ReportsService', () => {
  const REPORTER_ID = 'user-1'
  const TARGET_USER_ID = 'user-2'
  const TRIP_ID = 'trip-1'

  function makePrisma(options: { trip?: { passengerId: string; driverId: string } | null; targetUser?: { id: string } | null } = {}) {
    return {
      client: {
        trip: { findUnique: jest.fn().mockResolvedValue(options.trip === undefined ? { passengerId: REPORTER_ID, driverId: 'driver-x' } : options.trip) },
        user: { findUnique: jest.fn().mockResolvedValue(options.targetUser === undefined ? { id: TARGET_USER_ID } : options.targetUser) },
        report: {
          create: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) =>
            Promise.resolve({ id: 'report-1', status: 'NEW', reason: data.reason, description: data.description ?? null, createdAt: new Date(), ...data }),
          ),
          findMany: jest.fn().mockResolvedValue([]),
        },
      },
    } as unknown as PrismaService
  }

  it('rejects a report about a trip the reporter was not part of', async () => {
    const prisma = makePrisma({ trip: { passengerId: 'someone-else', driverId: 'someone-else-2' } })
    const service = new ReportsService(prisma)
    await expect(
      service.create(REPORTER_ID, { type: 'RIDE', tripId: TRIP_ID, reason: 'unsafe driving' }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rejects a report naming a reportedUserId that does not exist', async () => {
    const prisma = makePrisma({ targetUser: null })
    const service = new ReportsService(prisma)
    await expect(
      service.create(REPORTER_ID, { type: 'USER', reportedUserId: 'does-not-exist', reason: 'harassment' }),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it('creates a report starting at NEW, never a caller-chosen status', async () => {
    const prisma = makePrisma()
    const service = new ReportsService(prisma)

    const result = await service.create(REPORTER_ID, { type: 'USER', reportedUserId: TARGET_USER_ID, reason: 'spam' })

    expect(result.status).toBe('NEW')
    expect(prisma.client.report.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ reporterId: REPORTER_ID }) }),
    )
  })

  it('only lists the caller\'s own filed reports', async () => {
    const prisma = makePrisma()
    const service = new ReportsService(prisma)

    await service.listOwn(REPORTER_ID)

    expect(prisma.client.report.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { reporterId: REPORTER_ID } }),
    )
  })
})
