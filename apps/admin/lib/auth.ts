import type { Permission, UserRole } from '@shareride/types'
import { createClient } from './supabase/server'

interface AdminGrant {
  roleKey: string
  roleName: string
  permissions: Permission[]
}

interface ApiMeResponse {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  roles: UserRole[]
  admin: AdminGrant | null
}

export interface CurrentAdmin {
  id: string
  fullName: string
  email: string | null
  roleKey: string
  roleName: string
  permissions: Permission[]
}

/**
 * Resolves the signed-in Supabase user's admin grant by calling the API's
 * /auth/me (the same endpoint the mobile app uses) — the admin app has no
 * direct database access, matching the "no direct unrestricted database
 * access" rule. Returns null if there's no session, the person has no
 * admin_users row, or the API call fails (e.g. API not running locally).
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null

  const apiUrl = process.env.API_URL ?? 'http://localhost:4000'
  try {
    const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
      cache: 'no-store',
    })
    if (!res.ok) return null
    const user = (await res.json()) as ApiMeResponse
    if (!user.admin) return null
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      roleKey: user.admin.roleKey,
      roleName: user.admin.roleName,
      permissions: user.admin.permissions,
    }
  } catch {
    return null
  }
}

export function hasPermission(admin: CurrentAdmin | null, ...permissions: Permission[]): boolean {
  if (!admin) return false
  return permissions.some((p) => admin.permissions.includes(p))
}
