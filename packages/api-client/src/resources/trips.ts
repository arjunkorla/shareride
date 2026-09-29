import type { Trip } from '@shareride/types'
import type { HttpClient } from '../http'

// The route/price/participant-name summary MatchingService/ChatService
// already load server-side to answer "what is this trip actually about"
// — same "return it together, don't make the client re-fetch N things"
// reasoning as MatchWithOfferSummary/ConversationSummary. `route` is null
// only if the underlying RideAgreement/Match/RideOffer chain was somehow
// never created (shouldn't happen via the normal accept() flow).
export interface TripWithDetails extends Trip {
  route: { origin: string; destination: string; pricePerPerson: number } | null
  driver: { fullName: string; avatarUrl?: string }
  passenger: { fullName: string; avatarUrl?: string }
}

// Phase 10: minimal real Trips API — deliberately not the full
// DRIVER_ARRIVING/AT_PICKUP/STARTED/ONGOING live-tracking lifecycle (no
// location data exists to drive it), just enough for Reviews to check a
// genuine completed trip. `complete()` replaces the earlier
// generically-named `updateStatus(id, status)` this resource was
// scaffolded with — a single-purpose action is a smaller, safer surface
// than letting a client set any TripStatus directly.
export function tripsResource(http: HttpClient) {
  return {
    get: (id: string) => http.get<TripWithDetails>(`/trips/${id}`),
    list: () => http.get<TripWithDetails[]>('/trips'),
    complete: (id: string) => http.post<TripWithDetails>(`/trips/${id}/complete`),
  }
}
