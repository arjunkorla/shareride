import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentAdmin } from '../../lib/auth'
import { AdminShell } from '../../components/admin-shell'
import { AdminProvider } from '../../components/admin-context'

// Every route under this group requires a resolved admin grant (session +
// an active admin_users row) — this is the ADMIN-role check itself, not
// just "is there a Supabase session" (the middleware only checks that,
// cheaply, on every request; see lib/supabase/middleware.ts).
export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect('/login')

  return (
    <AdminProvider admin={admin}>
      <AdminShell admin={admin}>{children}</AdminShell>
    </AdminProvider>
  )
}
