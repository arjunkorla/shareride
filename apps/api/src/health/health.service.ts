import { Injectable } from '@nestjs/common'
import { PrismaService } from '../common/prisma/prisma.service'
import { RedisService } from '../common/redis/redis.service'

export type DependencyCheck = 'ok' | 'error'

export interface ReadinessResult {
  status: 'ok' | 'error'
  checks: { database: DependencyCheck; redis: DependencyCheck }
}

const CHECK_TIMEOUT_MS = 2000

// Both Postgres and Redis are checked — not because Redis is
// conceptually "core," but because it genuinely is in this codebase
// today: every authenticated request calls AuthService.isTokenRevoked(),
// which reads Redis directly (see auth.service.ts) — if Redis is down,
// every authenticated route already fails, so readiness has to reflect
// that. Razorpay/Google Maps are deliberately NOT checked here — both
// already degrade gracefully on their own (payments fail closed with a
// 503 per-request; matching falls back to straight-line distance), so
// making readiness depend on them would report this instance unready for
// traffic it can actually serve.
@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async checkReadiness(): Promise<ReadinessResult> {
    const [database, redis] = await Promise.all([
      this.probe(() => this.prisma.client.$queryRaw`SELECT 1`),
      this.probe(() => this.redis.client.ping()),
    ])

    const status: 'ok' | 'error' = database === 'ok' && redis === 'ok' ? 'ok' : 'error'
    return { status, checks: { database, redis } }
  }

  private async probe(fn: () => Promise<unknown>): Promise<DependencyCheck> {
    try {
      await this.withTimeout(fn(), CHECK_TIMEOUT_MS)
      return 'ok'
    } catch {
      return 'error'
    }
  }

  private withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Dependency check timed out')), ms)),
    ])
  }
}
