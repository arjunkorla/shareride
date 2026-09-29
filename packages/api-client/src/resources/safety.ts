import type { EmergencyContact, ReportType, UserReport } from '@shareride/types'
import type { HttpClient } from '../http'

export function safetyResource(http: HttpClient) {
  return {
    reports: {
      create: (input: { type: ReportType; reportedUserId?: string; tripId?: string; reason: string; description?: string }) =>
        http.post<UserReport>('/reports', input),
      listOwn: () => http.get<UserReport[]>('/reports'),
    },
    emergencyContacts: {
      create: (input: { name: string; phone: string; relation?: string }) =>
        http.post<EmergencyContact>('/emergency-contacts', input),
      list: () => http.get<EmergencyContact[]>('/emergency-contacts'),
      remove: (id: string) => http.delete<void>(`/emergency-contacts/${id}`),
    },
  }
}
