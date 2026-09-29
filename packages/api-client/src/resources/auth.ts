import type { Permission, UserRole } from '@shareride/types'
import type { HttpClient } from '../http'

export interface AdminGrant {
  roleKey: string
  roleName: string
  permissions: Permission[]
}

// Mirrors apps/api/src/auth/types/authenticated-user.ts's AuthenticatedUser
// — the shape GET /auth/me returns. Kept here rather than in
// packages/types since it's an API response contract (includes the
// admin grant), not a domain entity.
export interface AuthMeResponse {
  id: string
  phone: string | null
  email: string | null
  fullName: string
  roles: UserRole[]
  admin: AdminGrant | null
}

export function authResource(http: HttpClient) {
  return {
    me: () => http.get<AuthMeResponse>('/auth/me'),
    logout: () => http.post<{ success: boolean }>('/auth/logout'),
  }
}
