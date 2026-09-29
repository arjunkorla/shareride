import type { Vehicle } from '@shareride/types'
import type { HttpClient } from '../http'

export function vehiclesResource(http: HttpClient) {
  return {
    create: (input: Omit<Vehicle, 'id' | 'driverId' | 'verificationStatus' | 'isActive'>) =>
      http.post<Vehicle>('/vehicles', input),
    list: () => http.get<Vehicle[]>('/vehicles'),
    update: (id: string, input: Partial<Omit<Vehicle, 'id' | 'driverId' | 'verificationStatus' | 'isActive'>>) =>
      http.patch<Vehicle>(`/vehicles/${id}`, input),
    deactivate: (id: string) => http.post<Vehicle>(`/vehicles/${id}/deactivate`),
  }
}
