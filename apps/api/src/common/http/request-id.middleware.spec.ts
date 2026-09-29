import { RequestIdMiddleware } from './request-id.middleware'
import type { Request, Response } from 'express'

function makeReqRes(headers: Record<string, string | string[] | undefined> = {}) {
  const req = { headers } as Request
  const setHeader = jest.fn()
  const res = { setHeader } as unknown as Response
  return { req, res, setHeader }
}

describe('RequestIdMiddleware', () => {
  const middleware = new RequestIdMiddleware()

  it('generates a request id when none is provided', () => {
    const { req, res, setHeader } = makeReqRes()
    const next = jest.fn()

    middleware.use(req, res, next)

    expect(req.requestId).toEqual(expect.any(String))
    expect(req.requestId.length).toBeGreaterThan(0)
    expect(setHeader).toHaveBeenCalledWith('x-request-id', req.requestId)
    expect(next).toHaveBeenCalledTimes(1)
  })

  it('reuses a valid incoming x-request-id', () => {
    const { req, res } = makeReqRes({ 'x-request-id': 'client-supplied-id-123' })
    middleware.use(req, res, jest.fn())
    expect(req.requestId).toBe('client-supplied-id-123')
  })

  it('rejects an oversized incoming id and generates a fresh one instead', () => {
    const huge = 'a'.repeat(5000)
    const { req, res } = makeReqRes({ 'x-request-id': huge })
    middleware.use(req, res, jest.fn())
    expect(req.requestId).not.toBe(huge)
    expect(req.requestId.length).toBeLessThan(100)
  })

  it('rejects an incoming id with unsafe characters (e.g. log-injection attempt)', () => {
    const malicious = 'id\n[level=error] fake log line'
    const { req, res } = makeReqRes({ 'x-request-id': malicious })
    middleware.use(req, res, jest.fn())
    expect(req.requestId).not.toBe(malicious)
  })

  it('generates two different ids across two requests with no header', () => {
    const first = makeReqRes()
    const second = makeReqRes()
    middleware.use(first.req, first.res, jest.fn())
    middleware.use(second.req, second.res, jest.fn())
    expect(first.req.requestId).not.toBe(second.req.requestId)
  })
})
