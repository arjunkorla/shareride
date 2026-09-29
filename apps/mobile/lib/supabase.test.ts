// lib/supabase.ts imports @react-native-async-storage/async-storage, which
// has no native module in a Jest/Node environment — every other test file
// touching Supabase mocks '../lib/supabase' wholesale to avoid this, but
// this file exercises the real module, so it needs AsyncStorage's own
// official Jest mock instead (see the package's docs, also linked from the
// exact "[@RNC/AsyncStorage]: NativeModule: AsyncStorage is null" error this
// produces without it).
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories can't reference out-of-scope imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

import { getSupabaseConfigError, supabase, supabaseConfigError } from './supabase'

// getSupabaseConfigError takes explicit string arguments rather than
// reading process.env itself, specifically so it's testable independent of
// *how* EXPO_PUBLIC_SUPABASE_* ends up in process.env at runtime — see the
// module-import-safety block below for why that distinction matters here.
describe('getSupabaseConfigError', () => {
  it('flags a missing URL', () => {
    expect(getSupabaseConfigError(undefined, 'anon-key')).toMatch(/URL is not set/)
  })

  it('flags an empty-string URL', () => {
    expect(getSupabaseConfigError('   ', 'anon-key')).toMatch(/URL is not set/)
  })

  it('flags a missing anon key', () => {
    expect(getSupabaseConfigError('https://project.supabase.co', undefined)).toMatch(/ANON_KEY is not set/)
  })

  it('flags an empty-string anon key', () => {
    expect(getSupabaseConfigError('https://project.supabase.co', '')).toMatch(/ANON_KEY is not set/)
  })

  it('flags a REPLACE_WITH_* placeholder URL', () => {
    expect(getSupabaseConfigError('REPLACE_WITH_SUPABASE_PROJECT_URL', 'anon-key')).toMatch(/placeholder/)
  })

  it('flags a REPLACE_WITH_* placeholder anon key', () => {
    expect(getSupabaseConfigError('https://project.supabase.co', 'REPLACE_WITH_SUPABASE_ANON_KEY')).toMatch(
      /placeholder/,
    )
  })

  it('flags a malformed, non-HTTP(S) URL', () => {
    expect(getSupabaseConfigError('not-a-url', 'anon-key')).toMatch(/valid HTTP/)
  })

  it('accepts a valid https URL with a real-looking anon key', () => {
    expect(getSupabaseConfigError('https://project.supabase.co', 'real-anon-key')).toBeNull()
  })
})

// babel-preset-expo inlines every `process.env.EXPO_PUBLIC_*` MemberExpression
// to a literal value of whatever process.env held AT TRANSFORM TIME (see
// node_modules/babel-preset-expo/build/inline-env-vars.js), and Jest's babel
// transform cache is keyed by file content, not by process.env — so mutating
// process.env at test runtime and re-requiring via jest.isolateModules()
// does NOT change what gets inlined after the file is first transformed.
// That makes the pure getSupabaseConfigError tests above (real args, not
// affected by inlining) the reliable way to cover different configuration
// scenarios. This block instead proves the actual regression fix: this test
// process's real (unset) EXPO_PUBLIC_SUPABASE_* env — exactly the "missing
// configuration" scenario — no longer throws when the module loads. That
// used to be `createClient()` running unconditionally at module scope and
// throwing synchronously; see docs/agent-handoff.md's Build 5 postmortem.
describe('lib/supabase module import safety', () => {
  // Merely reaching this test at all is part of the proof: the static
  // `import` at the top of this file is the exact previously-throwing call
  // path (module scope -> createClient()) — if it still threw, this whole
  // suite would fail to run rather than report an assertion failure here.
  it('exports a null client and a non-null config error under this process’s unset Supabase env', () => {
    expect(supabase).toBeNull()
    expect(supabaseConfigError).not.toBeNull()
  })
})
