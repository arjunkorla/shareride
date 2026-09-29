export type MatchStatus =
  | 'SUGGESTED'
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'DECLINED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'CONFIRMED'

export interface Match {
  id: string
  rideRequestId: string
  rideOfferId: string
  matchStatus: MatchStatus
  originDistanceMeters: number
  destinationDistanceMeters: number
  routeCompatibility: number
  timeCompatibility: number
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export interface RideAgreement {
  id: string
  matchId: string
  passengerId: string
  driverId: string
  confirmedAt: string
}
