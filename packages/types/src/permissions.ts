import type { AdminRole } from './user'

// The full catalog of grantable admin permissions. Roles (AdminRoleDefinition
// rows, seeded from ROLE_PERMISSIONS below) are what's actually editable at
// runtime — this list is a deploy-time concern shared by the API's
// PermissionsGuard, the seed script, and the admin UI's permission checks.
export const PERMISSIONS = [
  'user.read', 'user.update', 'user.suspend', 'user.block', 'user.verify',
  'driver.read', 'driver.verify', 'driver.approve', 'driver.reject',
  'passenger.read',
  'ride.read', 'ride.cancel', 'ride.investigate',
  'verification.read', 'verification.approve', 'verification.reject',
  'report.read', 'report.assign', 'report.resolve',
  'support.read', 'support.respond',
  'payment.read', 'payment.refund',
  'audit.read',
  'admin.user.manage', 'admin.role.manage', 'admin.permission.manage',
  'notification.read', 'notification.manage',
  'settings.read', 'settings.manage',
  'analytics.read',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const READ_ONLY = PERMISSIONS.filter((p) => p.endsWith('.read'))

/** Seed data for AdminRoleDefinition — the starting grant for each named role. Editable afterward via the Roles admin UI (admin.role.manage). */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: [...PERMISSIONS],
  ADMIN: PERMISSIONS.filter((p) => p !== 'admin.role.manage' && p !== 'admin.permission.manage'),
  OPERATIONS_ADMIN: [
    'user.read', 'user.update',
    'driver.read', 'passenger.read',
    'ride.read', 'ride.investigate',
    'analytics.read',
  ],
  VERIFICATION_ADMIN: [
    'user.read',
    'driver.read', 'driver.verify', 'driver.approve', 'driver.reject',
    'verification.read', 'verification.approve', 'verification.reject',
  ],
  SAFETY_ADMIN: [
    'user.read', 'user.suspend', 'user.block',
    'ride.read', 'ride.investigate',
    'report.read', 'report.assign', 'report.resolve',
  ],
  SUPPORT_ADMIN: ['user.read', 'ride.read', 'report.read', 'support.read', 'support.respond'],
  FINANCE_ADMIN: ['analytics.read', 'payment.read', 'payment.refund'],
  CONTENT_ADMIN: ['notification.read', 'notification.manage', 'settings.read'],
  READ_ONLY_ADMIN: [...READ_ONLY],
}
