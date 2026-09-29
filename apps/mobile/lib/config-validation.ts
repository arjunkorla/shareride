// Pure string checks for the EXPO_PUBLIC_* startup configuration — NO
// imports at all, on purpose, so lib/startup-config.ts's gate (checked by
// app/_layout.tsx before the real app tree mounts) can run without loading
// Supabase, AsyncStorage or the URL polyfill. lib/supabase.ts re-exports
// getSupabaseConfigError from here for its existing callers/tests.

const PLACEHOLDER_PATTERN = /^REPLACE_WITH_/i

// Deliberately a string pattern rather than `new URL(value).protocol`:
// React Native's built-in URL (Libraries/Blob/URL.js) throws "URL.protocol
// is not implemented" unless react-native-url-polyfill has been loaded
// first, and this module must work without that polyfill.
const HTTP_URL_PATTERN = /^https?:\/\/[^\s/?#]+/i

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_PATTERN.test(value.trim())
}

function isHttpUrl(value: string): boolean {
  return HTTP_URL_PATTERN.test(value.trim())
}

function isBlank(value: string | undefined): value is undefined {
  return value === undefined || value.trim() === ''
}

export function getSupabaseConfigError(url: string | undefined, anonKey: string | undefined): string | null {
  if (isBlank(url)) return 'EXPO_PUBLIC_SUPABASE_URL is not set.'
  if (isBlank(anonKey)) return 'EXPO_PUBLIC_SUPABASE_ANON_KEY is not set.'
  if (isPlaceholder(url)) return 'EXPO_PUBLIC_SUPABASE_URL is still a REPLACE_WITH_* placeholder value.'
  if (isPlaceholder(anonKey)) return 'EXPO_PUBLIC_SUPABASE_ANON_KEY is still a REPLACE_WITH_* placeholder value.'
  if (!isHttpUrl(url)) return 'EXPO_PUBLIC_SUPABASE_URL is not a valid HTTP/HTTPS URL.'
  return null
}

// An unset API URL is not a startup error (lib/api.ts falls back to a local
// default), only a placeholder is.
export function getApiConfigError(apiUrl: string | undefined): string | null {
  if (apiUrl && isPlaceholder(apiUrl)) {
    return 'EXPO_PUBLIC_API_URL is still a REPLACE_WITH_* placeholder value.'
  }
  return null
}
