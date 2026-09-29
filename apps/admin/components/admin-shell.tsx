import type { ReactNode } from 'react'
import Link from 'next/link'
import type { Permission } from '@shareride/types'
import type { CurrentAdmin } from '../lib/auth'
import { hasPermission } from '../lib/auth'
import { SignOutButton } from './sign-out-button'

const NAV_ITEMS: { href: string; label: string; permissions: Permission[] }[] = [
  { href: '/', label: 'Dashboard', permissions: ['analytics.read'] },
  { href: '/users', label: 'Users', permissions: ['user.read'] },
  { href: '/drivers', label: 'Drivers & Verification', permissions: ['driver.read', 'verification.read'] },
  { href: '/vehicles', label: 'Vehicles', permissions: ['verification.read'] },
  { href: '/rides', label: 'Rides', permissions: ['ride.read'] },
  { href: '/reports', label: 'Safety & Reports', permissions: ['report.read'] },
  { href: '/support', label: 'Support Tickets', permissions: ['support.read'] },
  { href: '/payments', label: 'Payments', permissions: ['payment.read'] },
  { href: '/roles', label: 'Roles & Permissions', permissions: ['admin.role.manage', 'admin.user.manage'] },
  { href: '/audit-logs', label: 'Audit Logs', permissions: ['audit.read'] },
]

export function AdminShell({ admin, children }: { admin: CurrentAdmin; children: ReactNode }) {
  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(admin, ...item.permissions))

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 flex-shrink-0 border-r border-slate-200 bg-white p-4">
        <div className="mb-6 px-2">
          <div className="text-lg font-bold">ShareRide</div>
          <div className="text-xs text-slate-400">Admin</div>
        </div>
        <nav className="space-y-1">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <div>
            <div className="text-sm font-semibold text-slate-800">{admin.fullName}</div>
            <div className="text-xs text-slate-400">{admin.roleName}</div>
          </div>
          <SignOutButton />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
