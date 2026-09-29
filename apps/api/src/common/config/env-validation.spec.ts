import { validateEnv } from './env-validation'

describe('validateEnv', () => {
  const validConfig = { DATABASE_URL: 'postgresql://user:pass@localhost:5432/db', SUPABASE_URL: 'https://project.supabase.co' }

  it('accepts a config with the required variables present', () => {
    expect(() => validateEnv(validConfig)).not.toThrow()
  })

  it('rejects a config missing DATABASE_URL', () => {
    expect(() => validateEnv({ SUPABASE_URL: validConfig.SUPABASE_URL })).toThrow(/DATABASE_URL/)
  })

  it('rejects a config missing SUPABASE_URL', () => {
    expect(() => validateEnv({ DATABASE_URL: validConfig.DATABASE_URL })).toThrow(/SUPABASE_URL/)
  })

  it('never echoes the actual configured value in the error message', () => {
    const secretLookingValue = 'sk_live_super_secret_value_12345'
    let thrown: unknown
    try {
      validateEnv({ DATABASE_URL: '', SUPABASE_URL: secretLookingValue })
    } catch (error) {
      thrown = error
    }
    expect(thrown).toBeInstanceOf(Error)
    expect(String(thrown)).not.toContain(secretLookingValue)
  })

  it('accepts optional provider variables when present and typed correctly', () => {
    expect(() => validateEnv({ ...validConfig, RAZORPAY_KEY_ID: 'rzp_test_123', NODE_ENV: 'production' })).not.toThrow()
  })

  it('rejects an invalid NODE_ENV value rather than silently accepting typos', () => {
    expect(() => validateEnv({ ...validConfig, NODE_ENV: 'produciton' })).toThrow(/NODE_ENV/)
  })

  it('does not require optional provider variables to be present at all', () => {
    expect(() => validateEnv(validConfig)).not.toThrow()
  })
})
