import { Module } from '@nestjs/common'
import { RideRequestsController } from './ride-requests.controller'
import { RideRequestsService } from './ride-requests.service'
import { RideOffersController } from './ride-offers.controller'
import { RideOffersService } from './ride-offers.service'

// Phase 5 (Ride Requests) + Phase 6 (Ride Offers) — passenger- and
// driver-facing endpoints. Matches (Phase 7/8) and Trips (Phase 8) land in
// this same module as their own controller/service pairs once built,
// rather than one per module, since they share the "consumer-facing
// rides" concern.
@Module({
  controllers: [RideRequestsController, RideOffersController],
  providers: [RideRequestsService, RideOffersService],
})
export class RidesModule {}
