import { getSupabaseConfigError } from './config-validation'

// getSupabaseConfigError's full behavior is covered by lib/supabase.test.ts
// (which exercises it via lib/supabase.ts's re-export); these cover the
// polyfill-free HTTP(S) URL check specifically.
describe('getSupabaseConfigError without the URL polyfill', () => {
  it('rejects a URL with no host', () => {
    expect(getSupabaseConfigError('https://', 'fake-anon-key')).toMatch(/valid HTTP/)
  })

  it('rejects a non-HTTP(S) scheme', () => {
    expect(getSupabaseConfigError('ftp://example.com', 'fake-anon-key')).toMatch(/valid HTTP/)
  })

  it('accepts an http URL with a port and path', () => {
    expect(getSupabaseConfigError('http://192.168.1.50:54321/', 'fake-anon-key')).toBeNull()
  })

  it('accepts an https URL with a path', () => {
    expect(getSupabaseConfigError('https://project.supabase.co/', 'fake-anon-key')).toBeNull()
  })
})
