import { Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/types/authenticated-user'
import { MatchingService } from './matching.service'

// Match discovery (Phase 7) + request/accept/decline (Phase 8). Routes
// nested under /ride-requests, /ride-offers, and /matches rather than
// /matching, matching packages/api-client's already-scaffolded
// matchesResource contract.
@ApiTags('matching')
@ApiBearerAuth()
@Controller()
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get('ride-requests/:id/matches')
  findForRideRequest(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.matching.findForRideRequest(id, user.id)
  }

  @Get('ride-offers/:id/matches')
  findForRideOffer(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.matching.findForRideOffer(id, user.id)
  }

  @Get('matches/:id')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.matching.get(id, user.id)
  }

  @Post('matches/:id/request')
  request(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.matching.request(id, user.id)
  }

  @Post('matches/:id/accept')
  accept(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.matching.accept(id, user.id)
  }

  @Post('matches/:id/decline')
  decline(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.matching.decline(id, user.id)
  }
}
