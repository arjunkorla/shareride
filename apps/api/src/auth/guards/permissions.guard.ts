import { Injectable, type CanActivate, type ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import type { Permission } from '@shareride/types'
import { PERMISSIONS_KEY } from '../decorators/require-permission.decorator'
import type { AuthenticatedUser } from '../types/authenticated-user'

// Runs after JwtAuthGuard — expects request.user to already be populated.
// A route with no @RequirePermission metadata is unaffected (this guard is
// global alongside JwtAuthGuard/RolesGuard, matching that pattern).
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[] | undefined>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) return true

    const { user } = context.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>()
    const granted = user?.admin?.permissions ?? []
    const hasPermission = required.some((permission) => granted.includes(permission))
    if (!hasPermission) {
      throw new ForbiddenException('You do not have permission to perform this action')
    }
    return true
  }
}
