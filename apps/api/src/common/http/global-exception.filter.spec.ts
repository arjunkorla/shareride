import { BadRequestException, ConflictException, ForbiddenException, NotFoundException, type ArgumentsHost } from '@nestjs/common'
import { GlobalExceptionFilter } from './global-exception.filter'
import { StructuredLogger } from '../logger/structured-logger.service'

function makeHost(requestId?: string) {
  const json = jest.fn()
  const status = jest.fn().mockReturnValue({ json })
  const response = { status }
  const request = { requestId, method: 'GET', originalUrl: '/api/v1/trips/1' }
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost
  return { host, status, json }
}

function makeLogger() {
  return { error: jest.fn(), setContext: jest.fn() } as unknown as StructuredLogger
}

describe('GlobalExceptionFilter', () => {
  it('passes a known HttpException\'s own status/message through', () => {
    const { host, status, json } = makeHost('req-1')
    const filter = new GlobalExceptionFilter(makeLogger())

    filter.catch(new NotFoundException('Trip not found'), host)

    expect(status).toHaveBeenCalledWith(404)
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 404, code: 'NOT_FOUND', message: 'Trip not found', requestId: 'req-1' }))
  })

  it('derives a stable code from the exception class for common cases', () => {
    const cases: [unknown, number, string][] = [
      [new ForbiddenException('nope'), 403, 'FORBIDDEN'],
      [new ConflictException('already paid'), 409, 'CONFLICT'],
      [new BadRequestException('bad input'), 400, 'BAD_REQUEST'],
    ]
    for (const [exception, expectedStatus, expectedCode] of cases) {
      const { host, json } = makeHost()
      new GlobalExceptionFilter(makeLogger()).catch(exception, host)
      expect(json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: expectedStatus, code: expectedCode }))
    }
  })

  it('preserves an existing structured code (e.g. ZodValidationPipe\'s VALIDATION_ERROR) instead of overriding it', () => {
    const { host, json } = makeHost()
    const validationError = new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Request body failed validation', issues: {} })

    new GlobalExceptionFilter(makeLogger()).catch(validationError, host)

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: 'VALIDATION_ERROR' }))
  })

  it('never leaks an unknown/internal error\'s real message to the client', () => {
    const { host, status, json } = makeHost()
    const filter = new GlobalExceptionFilter(makeLogger())

    filter.catch(new Error('password=hunter2 while connecting to postgresql://user:pass@host/db'), host)

    expect(status).toHaveBeenCalledWith(500)
    expect(json).toHaveBeenCalledWith({ statusCode: 500, code: 'INTERNAL_ERROR', message: 'Something went wrong' })
    const responseBody = JSON.stringify(json.mock.calls[0][0])
    expect(responseBody).not.toContain('hunter2')
    expect(responseBody).not.toContain('postgresql://')
  })

  it('still logs the real error server-side even though the client never sees it', () => {
    const logger = makeLogger()
    const { host } = makeHost()
    const filter = new GlobalExceptionFilter(logger)

    filter.catch(new Error('the real internal detail'), host)

    expect(logger.error).toHaveBeenCalledWith('the real internal detail', expect.anything(), expect.anything())
  })

  it('omits requestId from the response when none was set on the request', () => {
    const { host, json } = makeHost(undefined)
    new GlobalExceptionFilter(makeLogger()).catch(new NotFoundException(), host)
    expect(json.mock.calls[0][0]).not.toHaveProperty('requestId')
  })
})
