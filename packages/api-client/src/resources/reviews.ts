import type { Review } from '@shareride/types'
import type { HttpClient } from '../http'

export interface ReviewWithAuthor extends Review {
  author: { id: string; fullName: string; avatarUrl?: string }
}

export interface ReviewsForUser {
  items: ReviewWithAuthor[]
  averageRating: number
  reviewCount: number
}

export function reviewsResource(http: HttpClient) {
  return {
    create: (input: { tripId: string; rating: number; comment?: string; categories?: string[] }) =>
      http.post<Review>('/reviews', input),
    forUser: (userId: string) => http.get<ReviewsForUser>(`/reviews?userId=${encodeURIComponent(userId)}`),
  }
}
