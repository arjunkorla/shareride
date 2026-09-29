import { z } from 'zod'

export const createSupportTicketSchema = z.object({
  category: z.string().min(1).max(60),
  subject: z.string().min(1).max(150),
  message: z.string().min(1).max(4000),
})
export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>
