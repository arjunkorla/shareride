import { NotFoundException } from '@nestjs/common'
import { SupportService } from './support.service'
import type { PrismaService } from '../common/prisma/prisma.service'

describe('SupportService', () => {
  const OWNER_ID = 'user-1'
  const STRANGER_ID = 'user-2'
  const TICKET_ID = 'ticket-1'

  function makeTicket() {
    return {
      id: TICKET_ID, userId: OWNER_ID, category: 'account', subject: 'Cannot log in',
      message: 'OTP never arrives', status: 'OPEN', createdAt: new Date(), updatedAt: new Date(),
    }
  }

  function makePrisma(ticket: ReturnType<typeof makeTicket> | null) {
    return {
      client: {
        supportTicket: {
          findUnique: jest.fn().mockResolvedValue(ticket),
          findMany: jest.fn().mockResolvedValue(ticket ? [ticket] : []),
          create: jest.fn().mockResolvedValue(ticket ?? makeTicket()),
        },
      },
    } as unknown as PrismaService
  }

  it('creates a ticket that always starts OPEN, owned by the caller', async () => {
    const prisma = makePrisma(makeTicket())
    const service = new SupportService(prisma)

    const result = await service.create(OWNER_ID, { category: 'account', subject: 'Cannot log in', message: 'OTP never arrives' })

    expect(result.status).toBe('OPEN')
    expect(prisma.client.supportTicket.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: OWNER_ID }) }),
    )
  })

  it('only lists the caller\'s own tickets', async () => {
    const prisma = makePrisma(makeTicket())
    const service = new SupportService(prisma)

    await service.listOwn(OWNER_ID)

    expect(prisma.client.supportTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: OWNER_ID } }),
    )
  })

  it('refuses to let a user read another user\'s ticket', async () => {
    const prisma = makePrisma(makeTicket())
    const service = new SupportService(prisma)
    await expect(service.getOwn(TICKET_ID, STRANGER_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('lets the owner read their own ticket', async () => {
    const prisma = makePrisma(makeTicket())
    const service = new SupportService(prisma)
    await expect(service.getOwn(TICKET_ID, OWNER_ID)).resolves.toEqual(expect.objectContaining({ id: TICKET_ID }))
  })
})
