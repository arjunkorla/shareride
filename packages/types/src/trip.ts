export type TripStatus =
  | 'CONFIRMED'
  | 'DRIVER_ARRIVING'
  | 'AT_PICKUP'
  | 'STARTED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED'

export interface Trip {
  id: string
  rideAgreementId: string
  passengerId: string
  driverId: string
  status: TripStatus
  scheduledAt: string
  startedAt?: string
  completedAt?: string
  createdAt: string
  updatedAt: string
}

export type TripEventType =
  | 'driver_arriving'
  | 'driver_arrived'
  | 'pickup_confirmed'
  | 'trip_started'
  | 'trip_completed'
  | 'trip_cancelled'

export interface TripEvent {
  id: string
  tripId: string
  type: TripEventType
  createdAt: string
  metadata?: Record<string, unknown>
}
