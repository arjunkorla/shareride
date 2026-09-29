// Startup integration test for a VALID config: real expo-router → real
// app/_layout.tsx → real AppRoot (react-query provider, realtime sync hooks,
// protected-route logic, auth store) → real (tabs) layout → real login
// screen. Before metro.config.js/jest.config.js pinned a single React,
// expo-router's React 19 elements made this path fail with "Objects are not
// valid as a React child"; this guards against that returning.
//
// Only the network edge is faked: the gate reports a valid config, and
// Supabase is a signed-out stub (no real project, no credentials).
jest.mock('../lib/startup-config', () => ({
  ...jest.requireActual<typeof import('../lib/startup-config')>('../lib/startup-config'),
  getStartupConfigError: () => null,
}))
jest.mock('../lib/supabase', () => ({
  supabaseConfigError: null,
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
  },
}))

import { act, renderRouter, screen } from 'expo-router/testing-library'

describe('app startup with a valid config (signed out)', () => {
  it('mounts the real app shell and lands on the login screen', async () => {
    const router = renderRouter('./app')

    // Auth init resolves getSession() asynchronously, then (tabs)/_layout
    // redirects the signed-out user to /login.
    await act(async () => {
      await Promise.resolve()
    })
    act(() => {
      jest.runOnlyPendingTimers()
    })

    expect(screen.queryByText('Development configuration required')).toBeNull()
    expect(router.getPathname()).toBe('/login')
    expect(screen.getByText('Sign in with your mobile number')).toBeTruthy()
  })
})
