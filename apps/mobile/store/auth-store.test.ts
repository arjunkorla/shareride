// lib/supabase.ts throws at import time when EXPO_PUBLIC_SUPABASE_URL/
// EXPO_PUBLIC_SUPABASE_ANON_KEY aren't set (see its own comment — loud on
// purpose so a misconfigured build fails at startup, not at first login
// attempt) — nothing a test env sets, so both it and lib/api.ts (which
// imports it) are mocked outright rather than given real env vars.
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}))
jest.mock('../lib/api', () => ({
  api: { auth: { me: jest.fn() } },
}))

import { supabase } from '../lib/supabase'
import { api } from '../lib/api'
import { useAuthStore } from './auth-store'

const mockedSupabase = supabase as unknown as {
  auth: {
    getSession: jest.Mock
    onAuthStateChange: jest.Mock
    signInWithOtp: jest.Mock
    verifyOtp: jest.Mock
    signOut: jest.Mock
  }
}
const mockedApi = api as unknown as { auth: { me: jest.Mock } }

const INITIAL_STATE = useAuthStore.getState()

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState(INITIAL_STATE, true)
    jest.clearAllMocks()
  })

  describe('sendOtp', () => {
    it('records the phone number and clears any previous error on success', async () => {
      mockedSupabase.auth.signInWithOtp.mockResolvedValue({ error: null })

      const ok = await useAuthStore.getState().sendOtp('+911234567890')

      expect(ok).toBe(true)
      expect(useAuthStore.getState().otpSentTo).toBe('+911234567890')
      expect(useAuthStore.getState().error).toBeNull()
    })

    it('surfaces the Supabase error message and returns false on failure', async () => {
      mockedSupabase.auth.signInWithOtp.mockResolvedValue({ error: { message: 'Rate limit exceeded' } })

      const ok = await useAuthStore.getState().sendOtp('+911234567890')

      expect(ok).toBe(false)
      expect(useAuthStore.getState().error).toBe('Rate limit exceeded')
      expect(useAuthStore.getState().otpSentTo).toBeNull()
    })
  })

  describe('verifyOtp', () => {
    it('stores the session and fetches the profile on success', async () => {
      const session = { access_token: 'token-abc', user: { id: 'user-1' } }
      mockedSupabase.auth.verifyOtp.mockResolvedValue({ data: { session }, error: null })
      mockedApi.auth.me.mockResolvedValue({ id: 'user-1', phone: '+911234567890', email: null, fullName: 'Passenger', roles: ['PASSENGER'], admin: null })

      const ok = await useAuthStore.getState().verifyOtp('+911234567890', '123456')
      await Promise.resolve() // let the fire-and-forget refreshProfile() settle

      expect(ok).toBe(true)
      expect(useAuthStore.getState().session).toEqual(session)
      expect(useAuthStore.getState().otpSentTo).toBeNull()
      expect(useAuthStore.getState().profile?.fullName).toBe('Passenger')
    })

    it('surfaces an invalid-code error without storing a session', async () => {
      mockedSupabase.auth.verifyOtp.mockResolvedValue({ data: { session: null }, error: { message: 'Invalid OTP' } })

      const ok = await useAuthStore.getState().verifyOtp('+911234567890', '000000')

      expect(ok).toBe(false)
      expect(useAuthStore.getState().error).toBe('Invalid OTP')
      expect(useAuthStore.getState().session).toBeNull()
    })
  })

  describe('refreshProfile', () => {
    it('leaves profile null (rather than throwing) when the API is unreachable', async () => {
      mockedApi.auth.me.mockRejectedValue(new TypeError('Network request failed'))

      await useAuthStore.getState().refreshProfile()

      expect(useAuthStore.getState().profile).toBeNull()
      expect(useAuthStore.getState().profileLoading).toBe(false)
    })

    it('leaves profile null when the API rejects the token (401)', async () => {
      mockedApi.auth.me.mockRejectedValue({ error: { statusCode: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' } })

      await useAuthStore.getState().refreshProfile()

      expect(useAuthStore.getState().profile).toBeNull()
    })
  })

  describe('signOut', () => {
    it('clears the session and profile locally even if the server-side revoke fails', async () => {
      useAuthStore.setState({
        session: { access_token: 'token-abc' } as never,
        profile: { id: 'user-1', phone: null, email: null, fullName: 'Passenger', roles: ['PASSENGER'], admin: null },
      })
      mockedSupabase.auth.signOut.mockResolvedValue({ error: null })
      const originalFetch = global.fetch
      global.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'))

      await useAuthStore.getState().signOut()

      expect(useAuthStore.getState().session).toBeNull()
      expect(useAuthStore.getState().profile).toBeNull()
      global.fetch = originalFetch
    })
  })
})
