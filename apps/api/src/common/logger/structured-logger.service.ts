import { Injectable, type LoggerService } from '@nestjs/common'
import { redact } from './redact'

// One JSON line per log entry to stdout (stderr for errors) — timestamp,
// level, service, environment, context, message, plus any structured
// fields (requestId, method, route, statusCode, durationMs, or arbitrary
// domain fields like tripId/paymentId) get merged in and redacted.
//
// Implements Nest's LoggerService so `app.useLogger(new StructuredLogger())`
// (main.ts) redirects the framework's own internal logs AND every
// existing `new Logger(SomeClass.name)` call site in this codebase
// (route-distance.service.ts, realtime.gateway.ts) through this format —
// see Nest's docs on custom loggers — without editing either of those
// files. Also injectable directly (LoggerModule, @Global) for services
// that want to log structured domain events via logEvent().
@Injectable()
export class StructuredLogger implements LoggerService {
  private context?: string

  setContext(context: string): void {
    this.context = context
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('info', message, optionalParams)
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams)
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, optionalParams)
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, optionalParams)
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('verbose', message, optionalParams)
  }

  // For structured domain events (payment/socket observability) that want
  // named fields rather than a free-text message — e.g.
  // logEvent('payment.webhook.captured', { paymentId, tripId, requestId }).
  logEvent(event: string, fields: Record<string, unknown> = {}): void {
    this.write('info', event, [fields])
  }

  private write(level: string, message: unknown, optionalParams: unknown[]): void {
    const lastParam = optionalParams[optionalParams.length - 1]
    const context = typeof lastParam === 'string' ? lastParam : this.context
    const fieldsParam = optionalParams.find((p): p is Record<string, unknown> => typeof p === 'object' && p !== null && !Array.isArray(p))

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      service: 'shareride-api',
      environment: process.env.NODE_ENV ?? 'development',
      ...(context ? { context } : {}),
      message: typeof message === 'string' ? message : JSON.stringify(redact(message)),
      ...(fieldsParam ? (redact(fieldsParam) as Record<string, unknown>) : {}),
    }

    const line = JSON.stringify(entry)
    if (level === 'error') process.stderr.write(line + '\n')
    else process.stdout.write(line + '\n')
  }
}
