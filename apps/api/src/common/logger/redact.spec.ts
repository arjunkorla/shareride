import { redact } from './redact'

describe('redact', () => {
  it('redacts known-sensitive keys regardless of case', () => {
    const result = redact({ Authorization: 'Bearer abc', token: 'xyz', OTP: '123456', password: 'hunter2' }) as Record<string, unknown>
    expect(result.Authorization).toBe('[redacted]')
    expect(result.token).toBe('[redacted]')
    expect(result.OTP).toBe('[redacted]')
    expect(result.password).toBe('[redacted]')
  })

  it('redacts Razorpay-specific secret fields', () => {
    const result = redact({ razorpay_signature: 'abc', webhookSecret: 'xyz', keySecret: 'shh' }) as Record<string, unknown>
    expect(result.razorpay_signature).toBe('[redacted]')
    expect(result.webhookSecret).toBe('[redacted]')
    expect(result.keySecret).toBe('[redacted]')
  })

  it('leaves ordinary, non-sensitive fields untouched', () => {
    const result = redact({ tripId: 'trip-1', status: 'PAID', amount: 15000 }) as Record<string, unknown>
    expect(result).toEqual({ tripId: 'trip-1', status: 'PAID', amount: 15000 })
  })

  it('redacts sensitive keys at any nesting depth', () => {
    const result = redact({ user: { profile: { token: 'nested-secret' } } }) as { user: { profile: { token: string } } }
    expect(result.user.profile.token).toBe('[redacted]')
  })

  it('redacts sensitive keys inside arrays of objects', () => {
    const result = redact([{ authorization: 'a' }, { authorization: 'b' }]) as { authorization: string }[]
    expect(result[0].authorization).toBe('[redacted]')
    expect(result[1].authorization).toBe('[redacted]')
  })

  it('passes primitives through unchanged', () => {
    expect(redact('hello')).toBe('hello')
    expect(redact(42)).toBe(42)
    expect(redact(null)).toBeNull()
    expect(redact(undefined)).toBeUndefined()
  })
})
