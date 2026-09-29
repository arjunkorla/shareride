'use client'

import { createContext, useContext, type ReactNode } from 'react'
import type { Permission } from '@shareride/types'
import type { CurrentAdmin } from '../lib/auth'

const AdminContext = createContext<CurrentAdmin | null>(null)

export function AdminProvider({ admin, children }: { admin: CurrentAdmin; children: ReactNode }) {
  return <AdminContext.Provider value={admin}>{children}</AdminContext.Provider>
}

export function useAdmin(): CurrentAdmin {
  const admin = useContext(AdminContext)
  if (!admin) throw new Error('useAdmin() called outside an AdminProvider')
  return admin
}

export function useHasPermission(...permissions: Permission[]): boolean {
  const admin = useAdmin()
  return permissions.some((p) => admin.permissions.includes(p))
}
