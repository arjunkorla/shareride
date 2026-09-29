export interface Review {
  id: string
  tripId: string
  authorId: string
  recipientId: string
  rating: number
  comment?: string
  categories?: string[]
  createdAt: string
}
