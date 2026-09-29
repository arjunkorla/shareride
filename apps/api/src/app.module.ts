import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common'
import { APP_FILTER, APP_GUARD } from '@nestjs/core'
import { ConfigModule } from '@nestjs/config'
import { HealthModule } from './health/health.module'
import { PrismaModule } from './common/prisma/prisma.module'
import { RedisModule } from './common/redis/redis.module'
import { AuthModule } from './auth/auth.module'
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'
import { RolesGuard } from './auth/guards/roles.guard'
import { PermissionsGuard } from './auth/guards/permissions.guard'
import { AdminModule } from './admin/admin.module'
import { AuditModule } from './common/audit/audit.module'
import { RidesModule } from './rides/rides.module'
import { VehiclesModule } from './vehicles/vehicles.module'
import { MatchingModule } from './matching/matching.module'
import { RealtimeModule } from './realtime/realtime.module'
import { ChatModule } from './chat/chat.module'
import { NotificationsModule } from './notifications/notifications.module'
import { TripsModule } from './trips/trips.module'
import { ReviewsModule } from './reviews/reviews.module'
import { SafetyModule } from './safety/safety.module'
import { SupportModule } from './support/support.module'
import { VerificationModule } from './verification/verification.module'
import { PaymentsModule } from './payments/payments.module'
import { validateEnv } from './common/config/env-validation'
import { LoggerModule } from './common/logger/logger.module'
import { MetricsModule } from './common/metrics/metrics.module'
import { GlobalExceptionFilter } from './common/http/global-exception.filter'
import { RequestIdMiddleware } from './common/http/request-id.middleware'
import { HttpObservabilityMiddleware } from './common/http/http-observability.middleware'

@Module({
  imports: [
    // Fails fast on a missing DATABASE_URL/SUPABASE_URL with a specific
    // message (see env-validation.ts) instead of an opaque Prisma/JWKS
    // error the first time something actually tries to use them.
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule,
    MetricsModule,
    PrismaModule,
    RedisModule,
    AuditModule,
    AuthModule,
    HealthModule,
    AdminModule,
    RidesModule,
    VehiclesModule,
    MatchingModule,
    // RealtimeModule is @Global (exports RealtimeGateway to every module
    // once registered anywhere), so it only needs listing here — ChatModule/
    // NotificationsModule inject RealtimeGateway directly without importing
    // RealtimeModule themselves.
    RealtimeModule,
    ChatModule,
    NotificationsModule,
    // Phase 10 — trust/safety layer.
    TripsModule,
    ReviewsModule,
    SafetyModule,
    SupportModule,
    VerificationModule,
    // Phase 11 — payments.
    PaymentsModule,
    // Remaining consumer modules (users, drivers, passengers, analytics,
    // locations) land here one at a time — see docs/migration-plan.md.
  ],
  providers: [
    // Every route requires a valid Supabase access token unless the
    // handler/controller carries a `@Public()`-style opt-out (add one if a
    // route genuinely needs to be anonymous — none do yet).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    // @Catch() with no argument list — this is genuinely global, the only
    // place any response body for an error is decided (see the filter's
    // own comment for why).
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Middleware, not interceptors (see HttpObservabilityMiddleware's own
    // comment on why: an interceptor can't see a request a guard
    // rejected, and reads response.statusCode too early on any error
    // path). RequestIdMiddleware must run first so req.requestId already
    // exists by the time HttpObservabilityMiddleware reads it.
    consumer.apply(RequestIdMiddleware, HttpObservabilityMiddleware).forRoutes('*')
  }
}
