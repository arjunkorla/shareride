import { create } from 'zustand'
import { emptySearchQuery, type SearchQuery } from '../lib/search-query'

interface SearchState {
  query: SearchQuery
  updateQuery: (patch: Partial<SearchQuery>) => void
}

// Lifted above Home/Discover so it survives navigating to Ride Detail (or
// anywhere else) and back — the RN equivalent of lifting SearchQuery to
// App.tsx in the prototype, since Expo Router screens don't share a parent
// component to hold this in useState.
export const useSearchStore = create<SearchState>((set) => ({
  query: emptySearchQuery,
  updateQuery: (patch) => set((s) => ({ query: { ...s.query, ...patch } })),
}))
