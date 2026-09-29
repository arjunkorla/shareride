import { createApiClient } from '@shareride/api-client'
import { supabase } from './supabase'

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

export const api = createApiClient({
  baseUrl: apiUrl,
  getAuthToken: async () => {
    // supabase is null when EXPO_PUBLIC_SUPABASE_* is missing/invalid — see
    // lib/supabase.ts. app/_layout.tsx renders a configuration-required
    // screen instead of mounting anything that would call this in that
    // case, but this stays defensive rather than assuming that gate ran.
    if (!supabase) return undefined
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token
  },
})
