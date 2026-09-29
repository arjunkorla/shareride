import { BadRequestException, NotFoundException } from '@nestjs/common'
import { VerificationService } from './verification.service'
import type { PrismaService } from '../common/prisma/prisma.service'

describe('VerificationService', () => {
  const USER_ID = 'driver-1'

  function makeProfile(verificationStatus = 'NOT_STARTED') {
    return {
      userId: USER_ID,
      bio: null,
      languages: [],
      yearsActive: 0,
      verificationStatus,
      verificationNote: null,
      rating: { toNumber: () => 0 },
      totalTrips: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  function makePrisma(profile: ReturnType<typeof makeProfile> | null) {
    return {
      client: {
        driverProfile: {
          findUnique: jest.fn().mockResolvedValue(profile),
          update: jest.fn().mockImplementation(({ data }: { data: Record<string, unknown> }) => Promise.resolve({ ...(profile ?? makeProfile()), ...data })),
        },
        vehicle: { findMany: jest.fn().mockResolvedValue([]) },
      },
    } as unknown as PrismaService
  }

  it('lets a driver submit verification from NOT_STARTED', async () => {
    const prisma = makePrisma(makeProfile('NOT_STARTED'))
    const service = new VerificationService(prisma)
    const result = await service.submitDriverVerification(USER_ID)
    expect(result.verificationStatus).toBe('SUBMITTED')
  })

  it('lets a driver resubmit after ACTION_REQUIRED or REJECTED', async () => {
    const prisma = makePrisma(makeProfile('ACTION_REQUIRED'))
    const service = new VerificationService(prisma)
    await expect(service.submitDriverVerification(USER_ID)).resolves.toEqual(
      expect.objectContaining({ verificationStatus: 'SUBMITTED' }),
    )
  })

  it('never lets the client move itself straight to APPROVED or skip review while already pending', async () => {
    const prisma = makePrisma(makeProfile('SUBMITTED'))
    const service = new VerificationService(prisma)
    await expect(service.submitDriverVerification(USER_ID)).rejects.toBeInstanceOf(BadRequestException)
  })

  it('refuses to submit for a user with no driver profile at all', async () => {
    const prisma = makePrisma(null)
    const service = new VerificationService(prisma)
    await expect(service.submitDriverVerification(USER_ID)).rejects.toBeInstanceOf(NotFoundException)
  })

  it('getOwn is scoped to exactly the calling user\'s id, never a caller-supplied target', async () => {
    const prisma = makePrisma(makeProfile('APPROVED'))
    const service = new VerificationService(prisma)

    await service.getOwn(USER_ID)

    expect(prisma.client.driverProfile.findUnique).toHaveBeenCalledWith({ where: { userId: USER_ID } })
  })
})
