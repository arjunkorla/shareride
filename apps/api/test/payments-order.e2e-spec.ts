import type { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { buildScopedTestApp } from './utils/build-scoped-test-app'
import { PaymentsModule } from '../src/payments/payments.module'
import type { AuthenticatedUser } from '../src/auth/types/authenticated-user'

const PASSENGER: AuthenticatedUser = {
  id: 'user-passenger-1',
  phone: '+910000000001',
  email: null,
  fullName: 'Test Passenger',
  roles: ['PASSENGER'],
  admin: null,
}

// Drives POST /payments/orders through the real
// PaymentsController -> ZodValidationPipe -> PaymentsService, with only
// PrismaService mocked and an authenticated identity stubbed in (see
// build-scoped-test-app.ts for why this uses a smaller harness than the
// full AppModule — the global JwtAuthGuard can't be stubbed from a Nest
// testing module, but IS separately, genuinely exercised in
// auth-boundary.e2e-spec.ts's 401 tests against this exact route).
describe('POST /payments/orders (e2e, authenticated)', () => {
  let app: INestApplication | undefined

  afterEach(async () => {
    await app?.close()
    app = undefined
  })

  it('rejects a body that fails zod validation with a safe VALIDATION_ERROR shape', async () => {
    app = await buildScopedTestApp({ imports: [PaymentsModule], currentUser: PASSENGER })
    const res = await request(app.getHttpServer()).post('/payments/orders').send({ tripId: 'not-a-uuid' })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
  })

  it('returns 404 when the trip does not belong to the authenticated passenger', async () => {
    const findUnique = jest.fn().mockResolvedValue({ id: 'trip-1', passengerId: 'someone-else', status: 'ACCEPTED' })
    app = await buildScopedTestApp({
      imports: [PaymentsModule],
      currentUser: PASSENGER,
      prisma: { client: { trip: { findUnique } } },
    })
    const res = await request(app.getHttpServer())
      .post('/payments/orders')
      .send({ tripId: '11111111-1111-4111-8111-111111111111' })
    expect(res.status).toBe(404)
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: '11111111-1111-4111-8111-111111111111' } }),
    )
  })

  it('returns 404 when the trip does not exist at all', async () => {
    const findUnique = jest.fn().mockResolvedValue(null)
    app = await buildScopedTestApp({
      imports: [PaymentsModule],
      currentUser: PASSENGER,
      prisma: { client: { trip: { findUnique } } },
    })
    const res = await request(app.getHttpServer())
      .post('/payments/orders')
      .send({ tripId: '11111111-1111-4111-8111-111111111111' })
    expect(res.status).toBe(404)
  })
})
