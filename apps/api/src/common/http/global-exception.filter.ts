import { type ArgumentsHost, Catch, type ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import type { Request, Response } from 'express'
import * as Sentry from '@sentry/node'
import { StructuredLogger } from '../logger/structured-logger.service'

interface SafeErrorBody {
  statusCode: number
  code: string
  message: string
  requestId?: string
}

// Catches everything, everywhere — the only place in this codebase that
// decides what a client is ever allowed to see about a failure. A known
// HttpException (NotFoundException, ConflictException, the
// ZodValidationPipe's structured VALIDATION_ERROR, ...) passes its own
// safe message through; anything else (a Prisma error, an unexpected
// bug) becomes a flat "Something went wrong" — the real exception
// (message + stack) is logged server-side via StructuredLogger, never
// returned to the client. Every response carries the same requestId the
// request's log lines do, so a user-reported error can be traced back to
// its own server log without needing a stack trace on the wire.
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: StructuredLogger) {
    this.logger.setContext(GlobalExceptionFilter.name)
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request | undefined>()
    const requestId = request?.requestId

    const { statusCode, code, message } = this.classify(exception)

    // Only genuine 5xx (unexpected) failures go to Sentry — an expected
    // 404/403/409 domain response isn't an "error" worth an alert, and
    // sending every one would drown out the signal. No-op when
    // SENTRY_DSN was never set (main.ts never called Sentry.init()).
    if (statusCode >= 500 && process.env.SENTRY_DSN) {
      Sentry.captureException(exception, { tags: { requestId } })
    }

    this.logger.error(
      exception instanceof Error ? exception.message : String(exception),
      exception instanceof Error ? exception.stack : undefined,
      {
        requestId,
        statusCode,
        code,
        method: request?.method,
        route: request?.originalUrl,
      },
    )

    const body: SafeErrorBody = { statusCode, code, message, ...(requestId ? { requestId } : {}) }
    response.status(statusCode).json(body)
  }

  private classify(exception: unknown): { statusCode: number; code: string; message: string } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus()
      const body = exception.getResponse()
      if (typeof body === 'object' && body !== null) {
        const record = body as Record<string, unknown>
        const message = typeof record.message === 'string' ? record.message : exception.message
        const code = typeof record.code === 'string' ? record.code : codeFromException(exception)
        return { statusCode, code, message }
      }
      return { statusCode, code: codeFromException(exception), message: typeof body === 'string' ? body : exception.message }
    }

    // Never the real message — could be a Prisma error, a raw SQL
    // fragment, or anything else internal. The real exception is already
    // logged above.
    return { statusCode: HttpStatus.INTERNAL_SERVER_ERROR, code: 'INTERNAL_ERROR', message: 'Something went wrong' }
  }
}

// NotFoundException -> NOT_FOUND, ServiceUnavailableException ->
// SERVICE_UNAVAILABLE, etc. — generic so a new exception type never needs
// a matching entry added here.
function codeFromException(exception: HttpException): string {
  return exception.constructor.name
    .replace(/Exception$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toUpperCase() || 'HTTP_ERROR'
}
