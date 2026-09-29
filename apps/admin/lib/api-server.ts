import { createApiClient } from '@shareride/api-client'
import { createClient } from './supabase/server'

/** Server Component / Server Action api-client, authenticated with the current Supabase session. */
export async function getServerApiClient() {
  const supabase = await createClient()
  const baseUrl = process.env.API_URL ? `${process.env.API_URL}/api/v1` : 'http://localhost:4000/api/v1'

  return createApiClient({
    baseUrl,
    getAuthToken: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return session?.access_token
    },
  })
}
