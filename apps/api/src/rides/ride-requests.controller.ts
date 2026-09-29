import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { createRideRequestSchema, type CreateRideRequestInput } from '@shareride/validation'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/types/authenticated-user'
import { ZodValidationPipe } from '../common/validation/zod-validation.pipe'
import { RideRequestsService } from './ride-requests.service'

// Consumer-facing endpoints a passenger uses directly — distinct from
// /admin/rides/requests (apps/api/src/admin/rides/rides.controller.ts),
// which is a read-only, cross-passenger admin view. Every route here is
// scoped to the calling user; there is no way to list or act on another
// passenger's ride requests through this controller.
@ApiTags('ride-requests')
@ApiBearerAuth()
@Controller('ride-requests')
export class RideRequestsController {
  constructor(private readonly rideRequests: RideRequestsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(createRideRequestSchema)) body: CreateRideRequestInput, @CurrentUser() user: AuthenticatedUser) {
    return this.rideRequests.create(user.id, body)
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.rideRequests.list(user.id)
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rideRequests.get(id, user.id)
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rideRequests.cancel(id, user.id)
  }
}
