import { Test } from '@nestjs/testing'
import { type INestApplication, ValidationPipe } from '@nestjs/common'
import { AppModule } from '../../src/app.module'
import { PrismaService } from '../../src/common/prisma/prisma.service'
import { RedisService } from '../../src/common/redis/redis.service'

// Builds the REAL Nest app graph (every module AppModule imports, every
// guard/interceptor/filter/middleware it registers) so these tests exercise
// genuine wiring over real HTTP (via supertest), not a hand-assembled
// subset. The only two things replaced are the two providers that would
// otherwise require live infrastructure this environment doesn't have:
//   - PrismaService: onModuleInit() does a blocking $connect() to a real
//     Postgres, which doesn't exist here. Overriding with a plain object
//     (no onModuleInit method) skips that call entirely.
//   - RedisService: real constructor opens an ioredis connection. Overriding
//     with useValue skips the constructor, so no connection attempt happens.
//
// JwtAuthGuard is always REAL here (never stubbed) — this harness is for
// the public/unauthenticated surface only (health, the webhook's own HMAC
// auth, and the 401/malformed-token boundary). A request with no/invalid
// bearer token is rejected by passport-jwt itself before any JWKS network
// call (it only fetches JWKS once it has a token to verify), so that
// boundary is genuinely exercised with no live Supabase project needed.
//
// Nest's global APP_GUARD/APP_INTERCEPTOR/APP_FILTER providers are each
// registered under a scanner-generated unique token (see
// DependenciesScanner.insertProvider in @nestjs/core/scanner.js), not
// under the guard class or the APP_GUARD token itself — so neither
// `overrideGuard(JwtAuthGuard)` nor `overrideProvider(JwtAuthGuard)` can
// reach it from a testing module; this is a genuine Nest testing-API
// limitation, not a mistake here. Authenticated-flow integration tests
// (real Controller -> Validation -> Service with a stubbed identity)
// live in build-scoped-test-app.ts instead, which sidesteps the global
// guard entirely by never importing AppModule.
export interface BuildTestAppOptions {
  prisma?: object
  redis?: object
}

export async function buildTestApp(options: BuildTestAppOptions = {}): Promise<INestApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] })

  builder.overrideProvider(PrismaService).useValue(options.prisma ?? {})
  builder.overrideProvider(RedisService).useValue(options.redis ?? {})

  const moduleRef = await builder.compile()
  // rawBody: true mirrors main.ts — without it req.rawBody is never
  // populated and the webhook controller's signature check has nothing to
  // verify against (see webhook.controller.ts's own comment on why it
  // needs the exact raw bytes, not the re-parsed body).
  const app = moduleRef.createNestApplication({ rawBody: true })
  // Mirrors main.ts's real bootstrap so behavior under test matches
  // production wiring (same prefix/exclusions, same validation pipe).
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/live', 'health/ready', 'metrics'] })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()
  return app
}
