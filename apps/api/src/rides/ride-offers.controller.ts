import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { createRideOfferSchema, type CreateRideOfferInput } from '@shareride/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/types/authenticated-user'
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe'
import { RideOffersService } from './ride-offers.service'

// Consumer-facing endpoints a driver uses directly — same scoping rule as
// ride-requests.controller.ts: every route is the calling driver's own
// offers only, distinct from /admin/rides/offers's read-only admin view.
@ApiTags('ride-offers')
@ApiBearerAuth()
@Controller('ride-offers')
export class RideOffersController {
  constructor(private readonly rideOffers: RideOffersService) {}

  @Post()
  create(@Body(new ZodValidationPipe(createRideOfferSchema)) body: CreateRideOfferInput, @CurrentUser() user: AuthenticatedUser) {
    return this.rideOffers.create(user.id, body)
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.rideOffers.list(user.id)
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rideOffers.get(id, user.id)
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rideOffers.cancel(id, user.id)
  }
}
