// startup-config.ts transitively imports lib/supabase.ts, which imports
// @react-native-async-storage/async-storage — no native module in a
// Jest/Node environment, so it needs AsyncStorage's own official Jest mock
// (see lib/supabase.test.ts for the same requirement and its full reasoning).
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories can't reference out-of-scope imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

import { combineStartupConfigErrors, getApiConfigError, getStartupConfigError } from './startup-config'

// Both take explicit arguments rather than reading process.env directly —
// see lib/supabase.test.ts's comment on why testing via process.env
// mutation is unreliable for EXPO_PUBLIC_* vars specifically (babel-preset-
// expo inlines them at transform time, and Jest's transform cache doesn't
// key on process.env, so a later mutation doesn't change what a module
// already evaluated to earlier in the same test run).
describe('getApiConfigError', () => {
  it('returns null when the API URL is unset', () => {
    expect(getApiConfigError(undefined)).toBeNull()
  })

  it('returns null for a real-looking URL', () => {
    expect(getApiConfigError('http://192.168.1.50:4000/api/v1')).toBeNull()
  })

  it('flags a REPLACE_WITH_* placeholder', () => {
    expect(getApiConfigError('REPLACE_WITH_DEV_MACHINE_LAN_URL')).toMatch(/placeholder/)
  })
})

describe('combineStartupConfigErrors', () => {
  it('reports the Supabase error first when both Supabase and the API URL are invalid', () => {
    expect(combineStartupConfigErrors('Supabase is broken', 'REPLACE_WITH_DEV_MACHINE_LAN_URL')).toBe(
      'Supabase is broken',
    )
  })

  it('flags a REPLACE_WITH_* API URL even when Supabase config is valid', () => {
    expect(combineStartupConfigErrors(null, 'REPLACE_WITH_DEV_MACHINE_LAN_URL')).toMatch(/API_URL/)
  })

  it('returns null when Supabase and the API URL are both valid', () => {
    expect(combineStartupConfigErrors(null, 'http://192.168.1.50:4000/api/v1')).toBeNull()
  })

  it('returns null when the API URL is simply unset (not a placeholder)', () => {
    expect(combineStartupConfigErrors(null, undefined)).toBeNull()
  })
})

// Merely reaching this test is part of the proof — the static `import` at
// the top of this file transitively re-runs lib/supabase.ts's module-scope
// code too; if that still threw, this whole suite would fail to run.
describe('getStartupConfigError', () => {
  it('does not throw and returns a string reason under this process’s unset Supabase env', () => {
    expect(getStartupConfigError()).toEqual(expect.any(String))
  })
})
