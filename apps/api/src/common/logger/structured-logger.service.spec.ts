import { StructuredLogger } from './structured-logger.service'

describe('StructuredLogger', () => {
  let stdoutSpy: jest.SpyInstance
  let stderrSpy: jest.SpyInstance

  beforeEach(() => {
    stdoutSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true)
    stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  afterEach(() => {
    stdoutSpy.mockRestore()
    stderrSpy.mockRestore()
  })

  function lastEntry(spy: jest.SpyInstance): Record<string, unknown> {
    const raw = spy.mock.calls[spy.mock.calls.length - 1][0] as string
    return JSON.parse(raw)
  }

  it('writes info-level logs to stdout as a single JSON line with the expected fields', () => {
    const logger = new StructuredLogger()
    logger.log('server started')

    expect(stdoutSpy).toHaveBeenCalledTimes(1)
    const entry = lastEntry(stdoutSpy)
    expect(entry).toMatchObject({ level: 'info', service: 'shareride-api', message: 'server started' })
    expect(entry.timestamp).toEqual(expect.any(String))
  })

  it('routes error-level logs to stderr, not stdout', () => {
    const logger = new StructuredLogger()
    logger.error('boom')

    expect(stderrSpy).toHaveBeenCalledTimes(1)
    expect(stdoutSpy).not.toHaveBeenCalled()
    expect(lastEntry(stderrSpy).level).toBe('error')
  })

  it('merges structured fields passed as an object argument', () => {
    const logger = new StructuredLogger()
    logger.logEvent('payment.webhook.captured', { paymentId: 'pay-1', tripId: 'trip-1' })

    const entry = lastEntry(stdoutSpy)
    expect(entry.message).toBe('payment.webhook.captured')
    expect(entry.paymentId).toBe('pay-1')
    expect(entry.tripId).toBe('trip-1')
  })

  it('redacts sensitive fields before they ever reach the log line', () => {
    const logger = new StructuredLogger()
    logger.logEvent('webhook.received', { signature: 'super-secret-signature', eventType: 'payment.captured' })

    const entry = lastEntry(stdoutSpy)
    expect(entry.signature).toBe('[redacted]')
    expect(entry.eventType).toBe('payment.captured')
  })

  it('includes the context set via setContext', () => {
    const logger = new StructuredLogger()
    logger.setContext('PaymentsService')
    logger.log('order created')

    expect(lastEntry(stdoutSpy).context).toBe('PaymentsService')
  })
})
