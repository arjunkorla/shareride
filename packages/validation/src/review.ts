import { z } from 'zod'

// Eligibility (trip participation, completed status, one review per
// trip/author) is enforced server-side in apps/api/src/reviews — this
// only validates the shape of what the client actually types.
export const createReviewSchema = z.object({
  tripId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
  categories: z.array(z.string().min(1).max(40)).max(10).optional(),
})
export type CreateReviewInput = z.infer<typeof createReviewSchema>
