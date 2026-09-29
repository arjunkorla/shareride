import { Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../auth/types/authenticated-user'
import { TripsService } from './trips.service'

// Every route scoped to the calling user's own trips (passenger or
// driver side) — mirrors rides/ride-requests.controller.ts's pattern.
@ApiTags('trips')
@ApiBearerAuth()
@Controller('trips')
export class TripsController {
  constructor(private readonly trips: TripsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.trips.list(user.id)
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.trips.get(id, user.id)
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.trips.complete(id, user.id)
  }
}
