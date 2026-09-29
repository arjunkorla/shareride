import { Injectable, type CanActivate, type ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Request } from 'express'
import type { UserRole } from '@shareride/types'
import { ROLES_KEY } from '../decorators/roles.decorator'
import type { AuthenticatedUser } from '../types/authenticated-user'

// Runs after JwtAuthGuard — expects request.user to already be populated.
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!requiredRoles || requiredRoles.length === 0) return true

    const { user } = context.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>()
    const hasRole = user?.roles?.some((role) => requiredRoles.includes(role))
    if (!hasRole) {
      throw new ForbiddenException('You do not have permission to perform this action')
    }
    return true
  }
}
