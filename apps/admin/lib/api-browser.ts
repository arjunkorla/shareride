'use client'

import { createApiClient } from '@shareride/api-client'
import { createClient } from './supabase/client'

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'

export const browserApi = createApiClient({
  baseUrl: apiUrl,
  getAuthToken: async () => {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session?.access_token
  },
})
