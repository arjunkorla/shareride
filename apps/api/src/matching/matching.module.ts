import { Module } from '@nestjs/common'
import { NotificationsModule } from '../notifications/notifications.module'
import { MatchingController } from './matching.controller'
import { MatchingService } from './matching.service'
import { RouteDistanceService } from './route-distance.service'

@Module({
  imports: [NotificationsModule],
  controllers: [MatchingController],
  providers: [MatchingService, RouteDistanceService],
})
export class MatchingModule {}
