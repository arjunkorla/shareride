import { Body, Controller, Get, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'
import { createReviewSchema, type CreateReviewInput } from '@shareride/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/types/authenticated-user'
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe'
import { ReviewsService } from './reviews.service'

class ListReviewsQueryDto {
  @IsUUID()
  userId!: string
}

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(createReviewSchema)) body: CreateReviewInput, @CurrentUser() user: AuthenticatedUser) {
    return this.reviews.create(user.id, body)
  }

  // Public within the app (any signed-in user can see another user's
  // reviews, same as the rating a profile already shows) — no ownership
  // scoping needed here, unlike everything else in Phase 10.
  @Get()
  list(@Query() query: ListReviewsQueryDto) {
    return this.reviews.listForUser(query.userId)
  }
}
