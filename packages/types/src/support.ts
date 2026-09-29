export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export interface SupportTicket {
  id: string
  userId: string
  category: string
  subject: string
  message: string
  status: SupportTicketStatus
  createdAt: string
  updatedAt: string
}
