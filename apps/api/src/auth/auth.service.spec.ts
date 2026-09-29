import { UnauthorizedException } from '@nestjs/common'
import { AuthService } from './auth.service'
import type { PrismaService } from '../common/prisma/prisma.service'
import type { RedisService } from '../common/redis/redis.service'

// AuthService.syncUserFromClaims runs on every authenticated HTTP request
// (SupabaseStrategy.validate calls it) — it's the one place account-status
// enforcement (Phase 14 gate finding C03) and JIT user provisioning both
// live. Hand-built Prisma/Redis fakes, no live DB, matching every other
// *.service.spec.ts in this repo.
describe('AuthService', () => {
  const USER_ID = 'user-1'
  const CLAIMS = { id: USER_ID, phone: '+911234567890', email: undefined, fullName: 'Test User' }

  function makeExistingUser(overrides: Partial<{ accountStatus: string }> = {}) {
    return {
      id: USER_ID,
      phone: '+911234567890',
      email: null,
      fullName: 'Test User',
      roles: ['PASSENGER'],
      accountStatus: 'ACTIVE',
      ...overrides,
    }
  }

  function makePrisma(options: { user?: ReturnType<typeof makeExistingUser> | null; admin?: unknown } = {}) {
    const user = options.user === undefined ? makeExistingUser() : options.user
    return {
      client: {
        user: {
          findUnique: jest.fn().mockResolvedValue(user),
          create: jest.fn().mockResolvedValue(makeExistingUser()),
        },
        driverProfile: { create: jest.fn().mockResolvedValue({}) },
        passengerProfile: { create: jest.fn().mockResolvedValue({}) },
        adminUser: { findFirst: jest.fn().mockResolvedValue(options.admin ?? null) },
        $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
      },
    } as unknown as PrismaService
  }

  function makeRedis(overrides: { get?: unknown } = {}) {
    return {
      client: {
        get: jest.fn().mockResolvedValue(overrides.get ?? null),
        set: jest.fn().mockResolvedValue('OK'),
      },
    } as unknown as RedisService
  }

  describe('syncUserFromClaims', () => {
    it('rejects a SUSPENDED account even with a currently-valid session', async () => {
      const service = new AuthService(makePrisma({ user: makeExistingUser({ accountStatus: 'SUSPENDED' }) }), makeRedis())
      await expect(service.syncUserFromClaims(CLAIMS)).rejects.toBeInstanceOf(UnauthorizedException)
    })

    it('rejects a BLOCKED account', async () => {
      const service = new AuthService(makePrisma({ user: makeExistingUser({ accountStatus: 'BLOCKED' }) }), makeRedis())
      await expect(service.syncUserFromClaims(CLAIMS)).rejects.toBeInstanceOf(UnauthorizedException)
    })

    it('allows an ACTIVE account through and attaches no admin grant when none exists', async () => {
      const service = new AuthService(makePrisma({ user: makeExistingUser() }), makeRedis())
      const result = await service.syncUserFromClaims(CLAIMS)
      expect(result.id).toBe(USER_ID)
      expect(result.admin).toBeNull()
    })

    it('JIT-provisions a brand-new user as ACTIVE, not silently rejected as inactive', async () => {
      const service = new AuthService(makePrisma({ user: null }), makeRedis())
      const result = await service.syncUserFromClaims(CLAIMS)
      expect(result.id).toBe(USER_ID)
    })

    it('attaches the admin grant for an active admin_users row', async () => {
      const admin = { role: { key: 'SUPER_ADMIN', name: 'Super Admin', permissions: ['admin.user.manage'] } }
      const service = new AuthService(makePrisma({ user: makeExistingUser(), admin }), makeRedis())
      const result = await service.syncUserFromClaims(CLAIMS)
      expect(result.admin).toEqual({ roleKey: 'SUPER_ADMIN', roleName: 'Super Admin', permissions: ['admin.user.manage'] })
    })
  })

  describe('isAccountActive', () => {
    it('returns true for an ACTIVE account', async () => {
      const service = new AuthService(makePrisma({ user: makeExistingUser() }), makeRedis())
      await expect(service.isAccountActive(USER_ID)).resolves.toBe(true)
    })

    it('returns false for a SUSPENDED account', async () => {
      const service = new AuthService(makePrisma({ user: makeExistingUser({ accountStatus: 'SUSPENDED' }) }), makeRedis())
      await expect(service.isAccountActive(USER_ID)).resolves.toBe(false)
    })

    it('returns false for a user that no longer exists', async () => {
      const service = new AuthService(makePrisma({ user: null }), makeRedis())
      await expect(service.isAccountActive(USER_ID)).resolves.toBe(false)
    })
  })

  describe('token revocation', () => {
    it('reports a token revoked after revokeToken records it', async () => {
      const redis = makeRedis()
      const service = new AuthService(makePrisma(), redis)
      await service.revokeToken('token-abc', Math.floor(Date.now() / 1000) + 3600)
      expect(redis.client.set).toHaveBeenCalledWith(expect.stringContaining('auth:revoked-token:'), '1', 'EX', expect.any(Number))
    })

    it('isTokenRevoked reflects whatever Redis returns for that token', async () => {
      const service = new AuthService(makePrisma(), makeRedis({ get: '1' }))
      await expect(service.isTokenRevoked('token-abc')).resolves.toBe(true)
    })
  })
})
