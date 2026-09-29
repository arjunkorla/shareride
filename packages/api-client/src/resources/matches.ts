import type { Match } from '@shareride/types'
import type { HttpClient } from '../http'

// GET /ride-requests/:id/matches enriches each Match with a summary of the
// candidate offer (apps/api's MatchingService already has to load the
// RideOffer server-side to score it, so returning a summary alongside the
// raw Match saves the mobile client from making N follow-up requests just
// to show what it's a match for).
export interface MatchWithOfferSummary extends Match {
  offer: {
    driverId: string
    origin: string
    destination: string
    departureDate: string
    departureTime: string
    pricePerPerson: number
    driverName: string
  }
}

// Symmetric enrichment for GET /ride-offers/:id/matches.
export interface MatchWithRequestSummary extends Match {
  request: {
    passengerId: string
    origin: string
    destination: string
    preferredDate: string
    preferredTimeStart: string
    preferredTimeEnd: string
    passengerName: string
  }
}

export function matchesResource(http: HttpClient) {
  return {
    get: (id: string) => http.get<Match>(`/matches/${id}`),
    listForRideRequest: (rideRequestId: string) => http.get<MatchWithOfferSummary[]>(`/ride-requests/${rideRequestId}/matches`),
    listForRideOffer: (rideOfferId: string) => http.get<MatchWithRequestSummary[]>(`/ride-offers/${rideOfferId}/matches`),
    // Passenger requests a specific SUGGESTED candidate (RideDetailScreen's
    // "Send Request").
    request: (id: string) => http.post<Match>(`/matches/${id}/request`),
    // Driver accepts/declines a REQUESTED match (Discover's Requests tab).
    accept: (id: string) => http.post<Match>(`/matches/${id}/accept`),
    decline: (id: string) => http.post<Match>(`/matches/${id}/decline`),
  }
}
