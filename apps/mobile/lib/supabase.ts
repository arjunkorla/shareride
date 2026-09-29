import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseConfigError } from './config-validation'

// The pure config check itself now lives in lib/config-validation.ts (no
// imports) so app/_layout.tsx's startup gate can run it without loading
// this module — and therefore without loading supabase-js, AsyncStorage or
// the URL polyfill. Re-exported for existing callers/tests. It used to be
// `createClient()` running unconditionally at module scope, which threw on
// a missing/placeholder config before React mounted anything — see
// docs/agent-handoff.md's Build 5 blank-screen postmortem.
export { getSupabaseConfigError }

export const supabaseConfigError = getSupabaseConfigError(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
)

// null whenever supabaseConfigError is set. Every caller must check before
// use (see store/auth-store.ts and lib/api.ts) — app/_layout.tsx renders a
// configuration-required screen instead of the real app tree in that case,
// so in practice nothing should reach these callers with a null client, but
// they stay defensive rather than assuming that gate always ran first.
export const supabase: SupabaseClient | null = supabaseConfigError
  ? null
  : createClient(process.env.EXPO_PUBLIC_SUPABASE_URL as string, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
