import { createHttpClient, type ApiClientConfig } from './http'
import { authResource } from './resources/auth'
import { rideRequestsResource } from './resources/rideRequests'
import { rideOffersResource } from './resources/rideOffers'
import { matchesResource } from './resources/matches'
import { tripsResource } from './resources/trips'
import { vehiclesResource } from './resources/vehicles'
import { chatResource } from './resources/chat'
import { notificationsResource } from './resources/notifications'
import { adminResource } from './resources/admin'
import { reviewsResource } from './resources/reviews'
import { safetyResource } from './resources/safety'
import { supportResource } from './resources/support'
import { verificationResource } from './resources/verification'
import { paymentsResource } from './resources/payments'

export * from './http'
export * from './resources/admin'
export * from './resources/auth'
export * from './resources/matches'
export * from './resources/chat'
export * from './resources/reviews'
export * from './resources/safety'
export * from './resources/support'
export * from './resources/verification'
export * from './resources/trips'
export * from './resources/payments'

export function createApiClient(config: ApiClientConfig) {
  const http = createHttpClient(config)
  return {
    auth: authResource(http),
    rideRequests: rideRequestsResource(http),
    rideOffers: rideOffersResource(http),
    matches: matchesResource(http),
    trips: tripsResource(http),
    vehicles: vehiclesResource(http),
    chat: chatResource(http),
    notifications: notificationsResource(http),
    admin: adminResource(http),
    reviews: reviewsResource(http),
    safety: safetyResource(http),
    support: supportResource(http),
    verification: verificationResource(http),
    payments: paymentsResource(http),
  }
}

export type ApiClient = ReturnType<typeof createApiClient>
