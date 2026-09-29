import { Module } from '@nestjs/common'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'
import { EmergencyContactsController } from './emergency-contacts.controller'
import { EmergencyContactsService } from './emergency-contacts.service'

// User-facing safety surface (report creation + emergency contacts) — the
// admin review/moderation half already exists in apps/api/src/admin
// (registered separately, built in Phase 12).
@Module({
  controllers: [ReportsController, EmergencyContactsController],
  providers: [ReportsService, EmergencyContactsService],
})
export class SafetyModule {}
