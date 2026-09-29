import { Module } from '@nestjs/common'
import { DashboardController } from './dashboard/dashboard.controller'
import { UsersController } from './users/users.controller'
import { DriversController } from './drivers/drivers.controller'
import { RidesController } from './rides/rides.controller'
import { ReportsController } from './reports/reports.controller'
import { RolesController } from './roles/roles.controller'
import { AdminUsersController } from './admin-users/admin-users.controller'
import { AuditLogsController } from './audit-logs/audit-logs.controller'
import { VehiclesController as AdminVehiclesController } from './vehicles/vehicles.controller'
import { SupportController as AdminSupportController } from './support/support.controller'
import { AdminPaymentsController } from './payments/payments.controller'
import { PaymentsModule } from '../payments/payments.module'

// All /admin/* routes. Every handler is gated by @RequirePermission (see
// packages/types/src/permissions.ts for the catalog and
// docs/migration-plan.md for what's deliberately not built yet
// (notifications delivery, settings management, passenger-specific
// endpoints beyond the shared Users list).
@Module({
  imports: [PaymentsModule],
  controllers: [
    DashboardController,
    UsersController,
    DriversController,
    RidesController,
    ReportsController,
    RolesController,
    AdminUsersController,
    AuditLogsController,
    AdminVehiclesController,
    AdminSupportController,
    AdminPaymentsController,
  ],
})
export class AdminModule {}
