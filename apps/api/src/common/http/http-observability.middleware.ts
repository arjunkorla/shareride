import { Injectable, type NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import { StructuredLogger } from '../logger/structured-logger.service'
import { MetricsService } from '../metrics/metrics.service'

// Replaces the previous LoggingInterceptor/MetricsInterceptor pair.
// Interceptors structurally can't see two of the cases that matter most
// for this phase's own "no invisible auth failures" goal:
//   - A rejecting guard (JwtAuthGuard/RolesGuard/PermissionsGuard) throws
//     BEFORE any APP_INTERCEPTOR runs at all — a 401/403 never reached
//     LoggingInterceptor/MetricsInterceptor, so every auth failure was
//     invisible to both the request log and the HTTP metrics.
//   - On any error path, an interceptor's `tap({error})` callback fires
//     the moment the handler's Observable errors — before
//     GlobalExceptionFilter has run and actually called
//     `response.status(...)`. `response.statusCode` at that point is
//     still Express's default (200), so `response.statusCode || 500`
//     recorded 200 (200 is truthy) for a request the filter itself later
//     answered with 403/500/etc — confirmed while building this fix:
//     signature-rejected and missing-event-id webhook requests logged
//     `http.request` with statusCode 200 while the filter's own log line
//     for the same requestId said 403/400.
// See docs/agent-handoff.md finding C20.
//
// Middleware runs before guards and persists for the whole request
// regardless of which layer eventually answers it, and `res.on('finish')`
// only fires once the response has actually been sent — by construction
// after GlobalExceptionFilter (or the normal success path) has set the
// real, final status code. This is the standard, correct way to observe
// an Express/Nest response's outcome.
@Injectable()
export class HttpObservabilityMiddleware implements NestMiddleware {
  constructor(
    private readonly logger: StructuredLogger,
    private readonly metrics: MetricsService,
  ) {
    this.logger.setContext('HTTP')
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now()
    res.on('finish', () => {
      const durationMs = Date.now() - start
      const statusCode = res.statusCode
      // Route PATTERN, not the raw URL — req.route.path is Express's
      // matched pattern (e.g. "/trips/:id"). Using the raw URL as a metric
      // label would put a distinct Prometheus label value per trip/user/
      // payment id ever requested, an unbounded-cardinality label set.
      // Still fine to log the raw originalUrl (path only, no query string
      // — see the redaction/logging-scope finding C19) since structured
      // logs aren't cardinality-bounded the way Prometheus labels are.
      const routePattern = req.route?.path ? `${req.baseUrl}${req.route.path}` : 'unmatched'

      this.logger.logEvent('http.request', {
        requestId: req.requestId,
        method: req.method,
        route: req.originalUrl.split('?')[0],
        statusCode,
        durationMs,
      })
      this.metrics.recordHttpRequest(req.method, routePattern, statusCode, durationMs)
    })
    next()
  }
}
