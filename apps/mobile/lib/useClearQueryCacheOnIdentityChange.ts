import { useEffect, useRef } from 'react'
import type { QueryClient } from '@tanstack/react-query'

// The app's QueryClient is a module-level singleton that outlives any one
// login session — nothing about it is per-user, and query keys like
// ['conversations']/['notifications']/['emergency-contacts'] don't include
// identity either. Without this, signing out and a different account
// signing back in on the same running app instance would keep showing the
// previous account's cached data until (if ever) each query happens to
// refetch. Clearing on every identity change — logout, or a direct
// account-to-account switch — is the correct security boundary: better to
// over-clear than let private data leak across accounts. See
// docs/agent-handoff.md finding C05.
export function useClearQueryCacheOnIdentityChange(queryClient: QueryClient, userId: string | null): void {
  const previousUserId = useRef<string | null | undefined>(undefined)

  useEffect(() => {
    if (previousUserId.current !== undefined && previousUserId.current !== null && previousUserId.current !== userId) {
      queryClient.clear()
    }
    previousUserId.current = userId
  }, [queryClient, userId])
}
