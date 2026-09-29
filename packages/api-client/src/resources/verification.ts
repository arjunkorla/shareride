import type { DriverProfile, Vehicle } from '@shareride/types'
import type { HttpClient } from '../http'

export interface OwnVerificationStatus {
  driver: DriverProfile
  vehicles: Vehicle[]
}

export function verificationResource(http: HttpClient) {
  return {
    me: () => http.get<OwnVerificationStatus>('/verification/me'),
    submitDriverVerification: () => http.post<DriverProfile>('/verification/driver/submit'),
  }
}
