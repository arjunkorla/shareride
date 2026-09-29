import { getApiConfigError, getSupabaseConfigError } from './config-validation'

export { getApiConfigError }

// Pure — takes explicit values rather than reading process.env itself, so
// it's directly testable regardless of how/when babel-preset-expo inlines
// EXPO_PUBLIC_* env vars at transform time (see lib/supabase.test.ts's
// comment on why that matters for testing this kind of check).
export function combineStartupConfigErrors(supabaseError: string | null, apiUrl: string | undefined): string | null {
  return supabaseError ?? getApiConfigError(apiUrl)
}

// Single gate app/_layout.tsx checks before mounting the real app tree.
// Supabase is checked first since an invalid Supabase config is the one
// that used to crash the whole app at import time (see lib/supabase.ts);
// the API URL placeholder check on its own isn't a crash risk (nothing
// eagerly parses EXPO_PUBLIC_API_URL as a URL at module scope), but an
// unset/placeholder API URL is equally "not configured for real use yet."
//
// Deliberately imports only lib/config-validation.ts, never lib/supabase.ts,
// so evaluating this gate can't itself pull in supabase-js/AsyncStorage/the
// URL polyfill.
export function getStartupConfigError(): string | null {
  return combineStartupConfigErrors(
    getSupabaseConfigError(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
    process.env.EXPO_PUBLIC_API_URL,
  )
}
