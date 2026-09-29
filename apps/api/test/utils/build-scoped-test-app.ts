import { Test } from '@nestjs/testing'
import type { DynamicModule, ForwardReference, INestApplication, Type } from '@nestjs/common'
import { ValidationPipe } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { json } from 'express'
import { PrismaModule } from '../../src/common/prisma/prisma.module'
import { PrismaService } from '../../src/common/prisma/prisma.service'
import { LoggerModule } from '../../src/common/logger/logger.module'
import { MetricsModule } from '../../src/common/metrics/metrics.module'
import type { AuthenticatedUser } from '../../src/auth/types/authenticated-user'

type NestModuleImport = Type | DynamicModule | Promise<DynamicModule> | ForwardReference

// A second, deliberately smaller harness for testing Controller ->
// Validation -> Service wiring for an AUTHENTICATED caller. It does not
// import AppModule, so none of the global APP_GUARD/APP_INTERCEPTOR/
// APP_FILTER providers apply here — see build-test-app.ts's comment for why
// they can't be overridden or stubbed from a testing module. Identity is
// supplied directly via an Express middleware that sets req.user before any
// controller runs, standing in for what JwtAuthGuard would normally do once
// a real Supabase JWT has already been verified. RolesGuard/PermissionsGuard
// are unit-tested on their own (roles.guard.spec.ts-equivalent coverage) and
// deliberately not re-exercised here.
export interface BuildScopedTestAppOptions {
  imports: NestModuleImport[]
  currentUser: AuthenticatedUser
  prisma?: object
}

export async function buildScopedTestApp(options: BuildScopedTestAppOptions): Promise<INestApplication> {
  const builder = Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true }), LoggerModule, MetricsModule, PrismaModule, ...options.imports],
  })
  builder.overrideProvider(PrismaService).useValue(options.prisma ?? {})

  const moduleRef = await builder.compile()
  // This harness never imports AppModule, so none of Nest's own default
  // body-parser setup runs (that happens once, keyed to the app created by
  // NestFactory.create/build-test-app.ts's harness) — registered explicitly
  // here so req.body is actually populated before ZodValidationPipe runs.
  const app = moduleRef.createNestApplication()
  app.use(json())
  app.use((req: { user?: AuthenticatedUser }, _res: unknown, next: () => void) => {
    req.user = options.currentUser
    next()
  })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  await app.init()
  return app
}
