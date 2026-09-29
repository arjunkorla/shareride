import { NotFoundException } from '@nestjs/common'
import { EmergencyContactsService } from './emergency-contacts.service'
import type { PrismaService } from '../common/prisma/prisma.service'

describe('EmergencyContactsService', () => {
  const OWNER_ID = 'user-1'
  const STRANGER_ID = 'user-2'
  const CONTACT_ID = 'contact-1'

  function makeContact() {
    return { id: CONTACT_ID, userId: OWNER_ID, name: 'Meera', phone: '+919876500000', relation: 'Spouse', createdAt: new Date() }
  }

  function makePrisma(contact: ReturnType<typeof makeContact> | null) {
    return {
      client: {
        emergencyContact: {
          findUnique: jest.fn().mockResolvedValue(contact),
          findMany: jest.fn().mockResolvedValue(contact ? [contact] : []),
          create: jest.fn().mockResolvedValue(contact ?? makeContact()),
          delete: jest.fn().mockResolvedValue(contact),
        },
      },
    } as unknown as PrismaService
  }

  it('scopes list() to only the calling user\'s own contacts', async () => {
    const prisma = makePrisma(makeContact())
    const service = new EmergencyContactsService(prisma)

    await service.list(OWNER_ID)

    expect(prisma.client.emergencyContact.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: OWNER_ID } }),
    )
  })

  it('refuses to delete another user\'s emergency contact', async () => {
    const prisma = makePrisma(makeContact())
    const service = new EmergencyContactsService(prisma)
    await expect(service.remove(CONTACT_ID, STRANGER_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('lets the owner delete their own contact', async () => {
    const prisma = makePrisma(makeContact())
    const service = new EmergencyContactsService(prisma)
    await expect(service.remove(CONTACT_ID, OWNER_ID)).resolves.toBeUndefined()
    expect(prisma.client.emergencyContact.delete).toHaveBeenCalledWith({ where: { id: CONTACT_ID } })
  })
})
