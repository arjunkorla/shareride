import type { Permission, UserRole } from '@shareride/types'

// What ends up on `request.user` after JwtAuthGuard runs — the app's own
// `users` row, not the raw Supabase JWT payload. Route handlers should
// never need to read Supabase claims directly.
export interface AuthenticatedUser {
  id: string
  phone: string | null
  email: string | null
  fullName: string
  roles: UserRole[]
  // Present only when this Supabase identity also has an admin_users row —
  // most consumer-app requests will never populate this.
  admin: AdminGrant | null
}

export interface AdminGrant {
  roleKey: string
  roleName: string
  permissions: Permission[]
}
