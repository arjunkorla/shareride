import { HttpObservabilityMiddleware } from './http-observability.middleware'
import type { Request, Response } from 'express'
import type { StructuredLogger } from '../logger/structured-logger.service'
import type { MetricsService } from '../metrics/metrics.service'

// docs/agent-handoff.md finding C20: the previous LoggingInterceptor/
// MetricsInterceptor pair read `response.statusCode` inside an
// interceptor's error callback, which fires before GlobalExceptionFilter
// has actually set the real status — and never ran at all for a
// guard-rejected request (guards run before any APP_INTERCEPTOR). This
// middleware fixes both by reading the status from `res.on('finish')`,
// which fires once, after the response is truly sent, regardless of
// which layer (guard, filter, handler) produced it.
describe('HttpObservabilityMiddleware', () => {
  function makeLogger(): StructuredLogger {
    return { setContext: jest.fn(), logEvent: jest.fn() } as unknown as StructuredLogger
  }

  function makeMetrics(): MetricsService {
    return { recordHttpRequest: jest.fn() } as unknown as MetricsService
  }

  function makeReqRes(overrides: { requestId?: string; route?: { path: string }; baseUrl?: string; originalUrl?: string } = {}) {
    let finishCallback: (() => void) | undefined
    const req = {
      requestId: overrides.requestId ?? 'req-1',
      method: 'POST',
      route: overrides.route,
      baseUrl: overrides.baseUrl ?? '',
      originalUrl: overrides.originalUrl ?? '/api/v1/payments/webhook',
    } as unknown as Request
    const res = {
      statusCode: 200, // Express's default until something sets it
      on: jest.fn((event: string, cb: () => void) => {
        if (event === 'finish') finishCallback = cb
      }),
    } as unknown as Response
    return {
      req,
      res,
      // Simulates the response actually completing — call this AFTER
      // changing res.statusCode to whatever the real final code is, the
      // same order events happen in a real Express/Nest response.
      finish: () => finishCallback?.(),
    }
  }

  it('records the real final status code, not whatever res.statusCode was when the handler first errored', () => {
    const logger = makeLogger()
    const metrics = makeMetrics()
    const middleware = new HttpObservabilityMiddleware(logger, metrics)
    const { req, res, finish } = makeReqRes()

    middleware.use(req, res, jest.fn())
    // GlobalExceptionFilter runs later and sets the real status — this is
    // what an interceptor's synchronous statusCode read could never see.
    res.statusCode = 403
    finish()

    expect(logger.logEvent).toHaveBeenCalledWith('http.request', expect.objectContaining({ statusCode: 403 }))
    expect(metrics.recordHttpRequest).toHaveBeenCalledWith(expect.any(String), expect.any(String), 403, expect.any(Number))
  })

  it('records a guard-rejected request (a case interceptors never saw at all)', () => {
    const logger = makeLogger()
    const metrics = makeMetrics()
    const middleware = new HttpObservabilityMiddleware(logger, metrics)
    const { req, res, finish } = makeReqRes({ route: { path: '/payments' } })

    middleware.use(req, res, jest.fn())
    // Simulates JwtAuthGuard rejecting before any handler/interceptor ran.
    res.statusCode = 401
    finish()

    expect(logger.logEvent).toHaveBeenCalledWith('http.request', expect.objectContaining({ statusCode: 401 }))
    expect(metrics.recordHttpRequest).toHaveBeenCalledWith('POST', expect.stringContaining('/payments'), 401, expect.any(Number))
  })

  it('logs the request id and strips the query string from the logged route', () => {
    const logger = makeLogger()
    const middleware = new HttpObservabilityMiddleware(logger, makeMetrics())
    const { req, res, finish } = makeReqRes({ requestId: 'req-42', originalUrl: '/api/v1/trips?includeCancelled=true' })

    middleware.use(req, res, jest.fn())
    finish()

    expect(logger.logEvent).toHaveBeenCalledWith('http.request', expect.objectContaining({ requestId: 'req-42', route: '/api/v1/trips' }))
  })

  it('uses the route PATTERN (not the raw URL) as the metrics label to avoid unbounded cardinality', () => {
    const metrics = makeMetrics()
    const middleware = new HttpObservabilityMiddleware(makeLogger(), metrics)
    const { req, res, finish } = makeReqRes({ route: { path: '/trips/:id' }, originalUrl: '/api/v1/trips/abc-123-real-id' })

    middleware.use(req, res, jest.fn())
    finish()

    expect(metrics.recordHttpRequest).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('/trips/:id'), expect.any(Number), expect.any(Number))
  })

  it('falls back to "unmatched" for a genuinely unrouted request (404)', () => {
    const metrics = makeMetrics()
    const middleware = new HttpObservabilityMiddleware(makeLogger(), metrics)
    const { req, res, finish } = makeReqRes({ route: undefined })

    middleware.use(req, res, jest.fn())
    res.statusCode = 404
    finish()

    expect(metrics.recordHttpRequest).toHaveBeenCalledWith(expect.any(String), 'unmatched', 404, expect.any(Number))
  })

  it('calls next() synchronously so the request pipeline is never blocked', () => {
    const middleware = new HttpObservabilityMiddleware(makeLogger(), makeMetrics())
    const { req, res } = makeReqRes()
    const next = jest.fn()

    middleware.use(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
  })
})
