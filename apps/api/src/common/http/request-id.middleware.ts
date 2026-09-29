import { Injectable, type NestMiddleware } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

// Bounded, safe charset only — an incoming X-Request-Id can be anything a
// caller wants to send, and it ends up in every log line for this
// request, so a malicious/malformed value (huge string, control
// characters, log-injection attempt) is never trusted verbatim. Anything
// that doesn't match gets a fresh server-generated id instead of being
// silently truncated or escaped.
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_-]{1,100}$/

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-request-id']
    const candidate = Array.isArray(incoming) ? incoming[0] : incoming
    const requestId = candidate && SAFE_ID_PATTERN.test(candidate) ? candidate : randomUUID()

    req.requestId = requestId
    res.setHeader('x-request-id', requestId)
    next()
  }
}
