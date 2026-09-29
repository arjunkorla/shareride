import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { buildTestApp } from './utils/build-test-app'

// Exercises the real, unmodified JwtAuthGuard (APP_GUARD-registered on
// every route by default) against real HTTP requests — no bearer token at
// all is rejected by passport-jwt itself before it ever needs to fetch the
// Supabase JWKS, so this is safe to run with no live Supabase project.
describe('Global auth boundary (e2e)', () => {
  let app: INestApplication | undefined

  afterEach(async () => {
    await app?.close()
    app = undefined
  })

  it('rejects a protected route with no Authorization header', async () => {
    app = await buildTestApp()
    const res = await request(app.getHttpServer()).get('/api/v1/payments')
    expect(res.status).toBe(401)
  })

  it('rejects a protected route with a malformed bearer token', async () => {
    app = await buildTestApp()
    const res = await request(app.getHttpServer()).get('/api/v1/payments').set('Authorization', 'Bearer not-a-real-jwt')
    expect(res.status).toBe(401)
  })

  it('leaves health endpoints public despite the global guard', async () => {
    app = await buildTestApp()
    const res = await request(app.getHttpServer()).get('/health/live')
    expect(res.status).toBe(200)
  })

  it('returns the safe error shape (statusCode/code/message/requestId), never a stack trace, for an unknown route', async () => {
    app = await buildTestApp()
    const res = await request(app.getHttpServer()).get('/api/v1/this-route-does-not-exist')
    expect(res.status).toBe(404)
    expect(Object.keys(res.body).sort()).toEqual(['code', 'message', 'requestId', 'statusCode'])
    expect(JSON.stringify(res.body)).not.toMatch(/at\s+\S+\s+\(.*:\d+:\d+\)/)
  })
})
