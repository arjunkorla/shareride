import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import type { AuthMeResponse } from '@shareride/api-client'
import { supabase } from '../lib/supabase'
import { api } from '../lib/api'

interface AuthState {
  session: Session | null
  initializing: boolean
  otpSentTo: string | null
  error: string | null
  // The ShareRide user resolved by the API from this session's token (see
  // apps/api/src/auth/auth.controller.ts's GET /auth/me) — the real
  // fullName/roles/phone, as opposed to the Supabase session which only
  // carries auth claims. null until fetched or if the API is unreachable.
  profile: AuthMeResponse | null
  profileLoading: boolean
  init: () => () => void
  sendOtp: (phone: string, options?: { fullName?: string }) => Promise<boolean>
  verifyOtp: (phone: string, code: string) => Promise<boolean>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  initializing: true,
  otpSentTo: null,
  error: null,
  profile: null,
  profileLoading: false,

  // Call once from the root layout. Restores any persisted session and
  // keeps it in sync as Supabase refreshes/expires tokens.
  //
  // supabase is null when EXPO_PUBLIC_SUPABASE_* is missing/invalid (see
  // lib/supabase.ts) — app/_layout.tsx renders a configuration-required
  // screen instead of the real app tree in that case, so this shouldn't
  // normally run at all, but it stays defensive rather than assuming that
  // gate always ran first.
  init: () => {
    if (!supabase) {
      set({ initializing: false })
      return () => undefined
    }
    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, initializing: false })
      if (data.session) void get().refreshProfile()
    })
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session })
      if (session) void get().refreshProfile()
      else set({ profile: null })
    })
    return () => subscription.subscription.unsubscribe()
  },

  // `options.fullName` only takes effect for a brand-new Supabase identity
  // (register.tsx) — Supabase attaches it to `user_metadata` on first
  // sign-up, which the API's SupabaseStrategy reads as `full_name` when
  // JIT-provisioning the `users` row (see apps/api/src/auth/strategies/
  // supabase.strategy.ts). Existing users (login.tsx, forgot-password.tsx)
  // call this without it, so it never overwrites a name already on file.
  sendOtp: async (phone: string, options?: { fullName?: string }) => {
    set({ error: null })
    if (!supabase) {
      set({ error: 'Supabase is not configured for this build.' })
      return false
    }
    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: options?.fullName ? { data: { full_name: options.fullName } } : undefined,
    })
    if (error) {
      set({ error: error.message })
      return false
    }
    set({ otpSentTo: phone })
    return true
  },

  verifyOtp: async (phone: string, code: string) => {
    set({ error: null })
    if (!supabase) {
      set({ error: 'Supabase is not configured for this build.' })
      return false
    }
    const { data, error } = await supabase.auth.verifyOtp({ phone, token: code, type: 'sms' })
    if (error) {
      set({ error: error.message })
      return false
    }
    set({ session: data.session, otpSentTo: null })
    if (data.session) void get().refreshProfile()
    return true
  },

  signOut: async () => {
    const token = get().session?.access_token
    if (supabase) await supabase.auth.signOut()
    set({ session: null, profile: null })
    if (token) {
      // Best-effort: also revoke the token server-side so it can't be
      // replayed against the API for its remaining lifetime. Failure here
      // shouldn't block sign-out from completing locally.
      const apiUrl = process.env.EXPO_PUBLIC_API_URL
      if (apiUrl) {
        fetch(`${apiUrl}/auth/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => undefined)
      }
    }
  },

  refreshProfile: async () => {
    set({ profileLoading: true })
    try {
      const profile = await api.auth.me()
      set({ profile })
    } catch {
      // API unreachable (no local Docker/API running) or token rejected —
      // leave profile null rather than throwing; screens fall back to the
      // Supabase session's phone/email for display in that case.
      set({ profile: null })
    } finally {
      set({ profileLoading: false })
    }
  },
}))
