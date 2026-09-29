import type { RideRequest } from '@shareride/types'
import type { HttpClient } from '../http'

export function rideRequestsResource(http: HttpClient) {
  return {
    create: (input: Omit<RideRequest, 'id' | 'passengerId' | 'status' | 'createdAt' | 'updatedAt' | 'expiresAt'>) =>
      http.post<RideRequest>('/ride-requests', input),
    get: (id: string) => http.get<RideRequest>(`/ride-requests/${id}`),
    list: () => http.get<RideRequest[]>('/ride-requests'),
    cancel: (id: string) => http.post<RideRequest>(`/ride-requests/${id}/cancel`),
  }
}
