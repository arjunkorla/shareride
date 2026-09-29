import { HealthService } from './health.service'
import type { PrismaService } from '../common/prisma/prisma.service'
import type { RedisService } from '../common/redis/redis.service'

function makePrisma(ok: boolean) {
  return { client: { $queryRaw: ok ? jest.fn().mockResolvedValue([{ '?column?': 1 }]) : jest.fn().mockRejectedValue(new Error('connection refused')) } } as unknown as PrismaService
}

function makeRedis(ok: boolean) {
  return { client: { ping: ok ? jest.fn().mockResolvedValue('PONG') : jest.fn().mockRejectedValue(new Error('ECONNREFUSED')) } } as unknown as RedisService
}

describe('HealthService', () => {
  it('reports ok when both Postgres and Redis respond', async () => {
    const service = new HealthService(makePrisma(true), makeRedis(true))
    await expect(service.checkReadiness()).resolves.toEqual({ status: 'ok', checks: { database: 'ok', redis: 'ok' } })
  })

  it('reports error when the database is unreachable, without leaking the underlying error message', async () => {
    const service = new HealthService(makePrisma(false), makeRedis(true))
    const result = await service.checkReadiness()
    expect(result.status).toBe('error')
    expect(result.checks.database).toBe('error')
    expect(JSON.stringify(result)).not.toContain('connection refused')
  })

  it('reports error when Redis is unreachable — auth depends on it for every authenticated request', async () => {
    const service = new HealthService(makePrisma(true), makeRedis(false))
    const result = await service.checkReadiness()
    expect(result.status).toBe('error')
    expect(result.checks.redis).toBe('error')
  })

  it('treats a slow dependency as an error rather than hanging the readiness check forever', async () => {
    const neverResolves = new Promise(() => undefined)
    const prisma = { client: { $queryRaw: jest.fn().mockReturnValue(neverResolves) } } as unknown as PrismaService
    const service = new HealthService(prisma, makeRedis(true))

    const result = await service.checkReadiness()

    expect(result.checks.database).toBe('error')
  }, 10000)
})
