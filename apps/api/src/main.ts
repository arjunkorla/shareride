import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as Sentry from '@sentry/node'
import { AppModule } from './app.module'
import { StructuredLogger } from './common/logger/structured-logger.service'

// Optional, gated entirely by SENTRY_DSN — with no DSN set, this is a
// no-op and the app runs identically (see .env.example). Initialized
// before NestFactory.create so it can capture a startup-time crash too,
// not just request-time errors from GlobalExceptionFilter.
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    // Conservative default — full request tracing is a bigger commitment
    // (volume, cost) than this phase's "make errors visible" goal needs.
    tracesSampleRate: 0.1,
  })
}

async function bootstrap() {
  // rawBody: true keeps the exact request bytes available as
  // req.rawBody (Buffer) alongside the normal parsed body — needed only
  // by the Razorpay webhook handler (apps/api/src/payments/webhook.controller.ts),
  // whose signature is an HMAC over the raw, unparsed payload; the docs
  // explicitly warn that re-serializing a parsed JSON body can produce a
  // byte-for-byte different string and fail verification.
  const app = await NestFactory.create(AppModule, { rawBody: true, bufferLogs: true })

  // Redirects Nest's own framework logs AND every existing
  // `new Logger(SomeClass.name)` call site (route-distance.service.ts,
  // realtime.gateway.ts) through the structured JSON format — see
  // StructuredLogger's own comment.
  const logger = app.get(StructuredLogger)
  app.useLogger(logger)

  app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/live', 'health/ready', 'metrics'] })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.enableCors()

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ShareRide API')
    .setDescription('Passenger ride requests, driver ride offers, matching, trips, chat, safety, and admin operations.')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000
  await app.listen(port)
  logger.log(`ShareRide API listening on http://localhost:${port}/api/v1 (docs at /api/docs)`, 'Bootstrap')
}

bootstrap()
