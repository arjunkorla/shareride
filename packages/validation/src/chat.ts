import { z } from 'zod'

export const startConversationSchema = z.object({
  otherUserId: z.string().uuid(),
})
export type StartConversationInput = z.infer<typeof startConversationSchema>

// Lowercase, matching packages/types/src/chat.ts's MessageType and the
// Prisma MessageType enum exactly (both were already lowercase — this
// schema's values didn't match either one until now, undetected because
// nothing had built/typechecked cleanly against them yet).
export const sendMessageSchema = z
  .object({
    type: z.enum(['text', 'image', 'location', 'ride', 'quick_reply']).optional().default('text'),
    text: z.string().min(1).max(2000).optional(),
    attachmentUrl: z.string().url().optional(),
  })
  .refine((data) => Boolean(data.text) || Boolean(data.attachmentUrl), {
    message: 'A message needs text or an attachment',
  })
export type SendMessageInput = z.infer<typeof sendMessageSchema>
