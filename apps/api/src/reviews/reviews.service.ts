import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@shareride/database'
import type { Review } from '@shareride/types'
import type { CreateReviewInput } from '@shareride/validation'
import { PrismaService } from '../common/prisma/prisma.service'

interface ReviewRecord {
  id: string
  tripId: string
  authorId: string
  recipientId: string
  rating: number
  comment: string | null
  categories: string[]
  createdAt: Date
}

export interface ReviewWithAuthor extends Review {
  author: { id: string; fullName: string; avatarUrl?: string }
}

export interface ReviewsForUser {
  items: ReviewWithAuthor[]
  averageRating: number
  reviewCount: number
}

// Eligibility is entirely server-decided (docs/migration-plan.md Phase
// 10D): the client only ever supplies tripId/rating/comment/categories —
// which trip counts, who the recipient is, and whether this author has
// already reviewed it are all derived here, never trusted from the
// request.
@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(authorId: string, input: CreateReviewInput): Promise<Review> {
    const trip = await this.prisma.client.trip.findUnique({ where: { id: input.tripId } })
    if (!trip || (trip.passengerId !== authorId && trip.driverId !== authorId)) {
      throw new NotFoundException('Trip not found')
    }
    if (trip.status !== 'COMPLETED') {
      throw new BadRequestException('You can only review a completed trip')
    }
    const recipientId = trip.passengerId === authorId ? trip.driverId : trip.passengerId

    let record: ReviewRecord
    try {
      record = await this.prisma.client.review.create({
        data: {
          tripId: input.tripId,
          authorId,
          recipientId,
          rating: input.rating,
          comment: input.comment,
          categories: input.categories ?? [],
        },
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('You have already reviewed this trip')
      }
      throw error
    }

    await this.recomputeRating(recipientId)
    return this.toReview(record)
  }

  // Public-safe: rating/comment/categories/author name only — never the
  // report/audit-adjacent internals a review might one day link to.
  async listForUser(userId: string): Promise<ReviewsForUser> {
    const records = await this.prisma.client.review.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, fullName: true, avatarUrl: true } } },
    })
    const reviewCount = records.length
    const averageRating = reviewCount === 0 ? 0 : records.reduce((sum, r) => sum + r.rating, 0) / reviewCount

    return {
      items: records.map((r) => ({ ...this.toReview(r), author: { id: r.author.id, fullName: r.author.fullName, avatarUrl: r.author.avatarUrl ?? undefined } })),
      averageRating: Math.round(averageRating * 100) / 100,
      reviewCount,
    }
  }

  // Denormalized DriverProfile.rating/PassengerProfile.rating already
  // existed in the schema before this phase (Phase 1/2) — this is the
  // first thing to actually populate them, from a real aggregate, never
  // a client-supplied number. updateMany (not update) so it's a no-op
  // for whichever profile role the recipient doesn't have, rather than
  // throwing.
  private async recomputeRating(recipientId: string): Promise<void> {
    const agg = await this.prisma.client.review.aggregate({ where: { recipientId }, _avg: { rating: true } })
    const rating = agg._avg.rating ?? 0
    await Promise.all([
      this.prisma.client.driverProfile.updateMany({ where: { userId: recipientId }, data: { rating } }),
      this.prisma.client.passengerProfile.updateMany({ where: { userId: recipientId }, data: { rating } }),
    ])
  }

  private toReview(record: ReviewRecord): Review {
    return {
      id: record.id,
      tripId: record.tripId,
      authorId: record.authorId,
      recipientId: record.recipientId,
      rating: record.rating,
      comment: record.comment ?? undefined,
      categories: record.categories,
      createdAt: record.createdAt.toISOString(),
    }
  }
}
