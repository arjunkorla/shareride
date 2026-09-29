import { z } from 'zod'

export const respondToMatchSchema = z.object({
  action: z.enum(['ACCEPT', 'DECLINE']),
})
export type RespondToMatchInput = z.infer<typeof respondToMatchSchema>
