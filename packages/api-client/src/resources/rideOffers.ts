import type { RideOffer } from '@shareride/types'
import type { HttpClient } from '../http'

export function rideOffersResource(http: HttpClient) {
  return {
    create: (input: Omit<RideOffer, 'id' | 'driverId' | 'status' | 'createdAt' | 'updatedAt' | 'expiresAt'>) =>
      http.post<RideOffer>('/ride-offers', input),
    get: (id: string) => http.get<RideOffer>(`/ride-offers/${id}`),
    list: () => http.get<RideOffer[]>('/ride-offers'),
    cancel: (id: string) => http.post<RideOffer>(`/ride-offers/${id}/cancel`),
  }
}
