import type { GeoPoint } from './geo'

// NOTE: This is the real domain model. It intentionally has no seat count,
// seat map, or seat availability field anywhere — ShareRide matches a
// passenger's requested route to a driver's offered route; it does not
// sell inventory. See docs/current-architecture.md §5 for why this exists.

export type RideRequestStatus =
  | 'ACTIVE'
  | 'MATCHED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED'

export interface RideRequest {
  id: string
  passengerId: string
  origin: string
  destination: string
  originCoordinates: GeoPoint
  destinationCoordinates: GeoPoint
  preferredDate: string
  preferredTimeStart: string
  preferredTimeEnd: string
  preferences: RidePreferences
  notes?: string
  status: RideRequestStatus
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export type RideOfferStatus =
  | 'ACTIVE'
  | 'MATCHED'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COMPLETED'

export interface RideOffer {
  id: string
  driverId: string
  vehicleId: string
  origin: string
  destination: string
  originCoordinates: GeoPoint
  destinationCoordinates: GeoPoint
  departureDate: string
  departureTime: string
  stops: string[]
  pricePerPerson: number
  preferences: RidePreferences
  notes?: string
  status: RideOfferStatus
  createdAt: string
  updatedAt: string
  expiresAt: string
}

export interface RidePreferences {
  womenOnly?: boolean
  acPreferred?: boolean
  petsOk?: boolean
  luggageSpace?: boolean
  silentRide?: boolean
  /** Auto-confirm matching requests without manual driver approval. Replaces the legacy `instantBook` seat-booking flag. */
  autoConfirm?: boolean
}
