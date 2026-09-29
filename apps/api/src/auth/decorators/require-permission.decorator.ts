import { SetMetadata } from '@nestjs/common'
import type { Permission } from '@shareride/types'

export const PERMISSIONS_KEY = 'requiredPermissions'

/** Gates a route to admins holding at least one of the given permissions. Implies admin-only (a non-admin request.user.admin is always null). */
export const RequirePermission = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions)
