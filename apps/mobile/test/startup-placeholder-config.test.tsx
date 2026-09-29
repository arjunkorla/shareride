// Startup integration test: real expo-router → real app/_layout.tsx → real
// config gate, with the EXACT placeholder env from eas.json's `preview`
// profile (the profile every physical-device build so far used). Must render
// ConfigurationRequiredScreen — never throw, never go blank, never create a
// Supabase client.
//
// Why getStartupConfigError is re-bound rather than process.env mutated:
// babel-preset-expo inlines process.env.EXPO_PUBLIC_* at transform time and
// Jest's transform cache doesn't key on env (see lib/supabase.test.ts), so
// the placeholders are fed through the REAL validation functions instead.
jest.mock('../lib/startup-config', () => {
  const actual = jest.requireActual<typeof import('../lib/startup-config')>('../lib/startup-config')
  const { getSupabaseConfigError } = jest.requireActual<typeof import('../lib/config-validation')>('../lib/config-validation')
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories can't reference out-of-scope imports
  const env = (require('../eas.json') as { build: { preview: { env: Record<string, string> } } }).build.preview.env
  return {
    ...actual,
    getStartupConfigError: () =>
      actual.combineStartupConfigErrors(
        getSupabaseConfigError(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
        env.EXPO_PUBLIC_API_URL,
      ),
  }
})
jest.mock('@supabase/supabase-js', () => ({ createClient: jest.fn() }))
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories can't reference out-of-scope imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

import { createClient } from '@supabase/supabase-js'
import { renderRouter, screen } from 'expo-router/testing-library'
import easConfig from '../eas.json'

describe('app startup with the eas.json preview placeholder config', () => {
  it('uses REPLACE_WITH_* placeholders in the preview profile (precondition)', () => {
    expect(easConfig.build.preview.env.EXPO_PUBLIC_SUPABASE_URL).toMatch(/^REPLACE_WITH_/)
    expect(easConfig.build.preview.env.EXPO_PUBLIC_SUPABASE_ANON_KEY).toMatch(/^REPLACE_WITH_/)
    expect(easConfig.build.preview.env.EXPO_PUBLIC_API_URL).toMatch(/^REPLACE_WITH_/)
  })

  it('renders ConfigurationRequiredScreen through the real router and root layout without throwing', () => {
    expect(() => renderRouter('./app')).not.toThrow()

    expect(screen.getByText('ShareRide')).toBeTruthy()
    expect(screen.getByText('Development configuration required')).toBeTruthy()
    expect(screen.getByText('EXPO_PUBLIC_SUPABASE_URL is still a REPLACE_WITH_* placeholder value.')).toBeTruthy()
    // The screen names the env var, never its value.
    expect(screen.queryByText(/REPLACE_WITH_SUPABASE_ANON_KEY/)).toBeNull()
  })

  it('never creates a Supabase client', () => {
    renderRouter('./app')
    expect(createClient).not.toHaveBeenCalled()
  })
})
