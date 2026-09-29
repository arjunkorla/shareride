import type { SupportTicket } from '@shareride/types'
import type { HttpClient } from '../http'

export function supportResource(http: HttpClient) {
  return {
    createTicket: (input: { category: string; subject: string; message: string }) =>
      http.post<SupportTicket>('/support/tickets', input),
    listOwnTickets: () => http.get<SupportTicket[]>('/support/tickets'),
    getOwnTicket: (id: string) => http.get<SupportTicket>(`/support/tickets/${id}`),
  }
}
