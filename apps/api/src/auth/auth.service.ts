import { createHash } from 'node:crypto'
import { Injectable, UnauthorizedException } from '@nestjs/common'
import type { Permission } from '@shareride/types'
import { PrismaService } from '../common/prisma/prisma.service'
import { RedisService } from '../common/redis/redis.service'
import type { AdminGrant, AuthenticatedUser } from './types/authenticated-user'

interface SupabaseClaims {
  id: string
  email?: string
  phone?: string
  fullName?: string
}

const REVOKED_TOKEN_PREFIX = 'auth:revoked-token:'

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  /**
   * Just-in-time provisioning: the first time a Supabase-authenticated
   * request reaches the API for a given user, mirror it into our own
   * `users` table (id shared with Supabase's auth.users.id) so the rest of
   * the schema can hold normal foreign keys. Subsequent requests just read
   * the existing row.
   *
   * Also resolves an `admin_users` row for the same id, if one exists —
   * that's how a Supabase identity becomes an admin (see
   * packages/database/prisma/seed.ts for how the first one gets created).
   */
  async syncUserFromClaims(claims: SupabaseClaims): Promise<AuthenticatedUser> {
    const [user, admin] = await Promise.all([
      this.getOrCreateUser(claims),
      this.prisma.client.adminUser.findFirst({
        where: { id: claims.id, isActive: true },
        select: { role: { select: { key: true, name: true, permissions: true } } },
      }),
    ])

    // A SUSPENDED/BLOCKED account (apps/api/src/admin/users/users.controller.ts's
    // setAccountStatus) must not keep authenticating just because its
    // Supabase JWT is still valid — moderation would otherwise be
    // toothless against anyone holding an unexpired session. Checked on
    // every request (this method runs on every authenticated HTTP call,
    // via SupabaseStrategy.validate) rather than only at token issuance.
    if (user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedException('This account is no longer active')
    }

    const adminGrant: AdminGrant | null = admin
      ? { roleKey: admin.role.key, roleName: admin.role.name, permissions: admin.role.permissions as Permission[] }
      : null

    return { ...user, admin: adminGrant }
  }

  // Used by RealtimeGateway, which authenticates a socket once at connect
  // time and then has no per-message request to re-run syncUserFromClaims
  // on — see its periodic revalidation loop for how this closes the same
  // gap for already-open connections.
  async isAccountActive(userId: string): Promise<boolean> {
    const user = await this.prisma.client.user.findUnique({ where: { id: userId }, select: { accountStatus: true } })
    return user?.accountStatus === 'ACTIVE'
  }

  private async getOrCreateUser(claims: SupabaseClaims) {
    const existing = await this.prisma.client.user.findUnique({
      where: { id: claims.id },
      select: { id: true, phone: true, email: true, fullName: true, roles: true, accountStatus: true },
    })
    if (existing) return existing

    // A DriverProfile/PassengerProfile row for every user, not just ones
    // who've explicitly "become a driver" — nothing in this codebase
    // gates posting a RideOffer or a RideRequest on `roles`, so any user
    // can act as either side. Without these rows, Phase 10's review
    // rating aggregation (ReviewsService.recomputeRating, an updateMany)
    // would silently do nothing for a user reviewed before this existed,
    // and a real driver would never appear in admin's verification queue
    // at all. Created together, same JIT-on-first-request pattern this
    // method already uses for User itself.
    const [user] = await this.prisma.client.$transaction([
      this.prisma.client.user.create({
        data: {
          id: claims.id,
          phone: claims.phone,
          email: claims.email,
          fullName: claims.fullName ?? claims.email ?? claims.phone ?? 'ShareRide user',
          roles: ['PASSENGER'],
        },
        select: { id: true, phone: true, email: true, fullName: true, roles: true, accountStatus: true },
      }),
      this.prisma.client.driverProfile.create({ data: { userId: claims.id } }),
      this.prisma.client.passengerProfile.create({ data: { userId: claims.id } }),
    ])
    return user
  }

  async revokeToken(token: string, expiresAt: number) {
    const ttlSeconds = Math.max(1, expiresAt - Math.floor(Date.now() / 1000))
    await this.redis.client.set(REVOKED_TOKEN_PREFIX + hashToken(token), '1', 'EX', ttlSeconds)
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    const value = await this.redis.client.get(REVOKED_TOKEN_PREFIX + hashToken(token))
    return value !== null
  }
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}
