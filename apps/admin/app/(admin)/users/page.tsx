'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import type { AdminUserListItem } from '@shareride/api-client'
import { browserApi } from '../../../lib/api-browser'
import { useHasPermission } from '../../../components/admin-context'
import { PermissionDenied } from '../../../components/permission-denied'
import { DataTable } from '../../../components/data-table'

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700',
  SUSPENDED: 'bg-amber-50 text-amber-700',
  BLOCKED: 'bg-red-50 text-red-700',
}

export default function UsersPage() {
  const canRead = useHasPermission('user.read')
  const canSuspend = useHasPermission('user.suspend')
  const canBlock = useHasPermission('user.block')
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [userType, setUserType] = useState<'' | 'PASSENGER' | 'DRIVER'>('')
  const [accountStatus, setAccountStatus] = useState<'' | 'ACTIVE' | 'SUSPENDED' | 'BLOCKED'>('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', page, search, userType, accountStatus],
    queryFn: () =>
      browserApi.admin.users.list({
        page,
        pageSize: 20,
        search: search || undefined,
        userType: userType || undefined,
        accountStatus: accountStatus || undefined,
      }),
    enabled: canRead,
    placeholderData: (prev) => prev,
  })

  const moderate = useMutation({
    mutationFn: (vars: { id: string; action: 'suspend' | 'reactivate' | 'block' | 'unblock' }) => {
      const reason = vars.action === 'suspend' || vars.action === 'block' ? window.prompt('Reason (optional):') ?? undefined : undefined
      return browserApi.admin.users[vars.action](vars.id, reason)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const columns = useMemo<ColumnDef<AdminUserListItem, unknown>[]>(
    () => [
      {
        header: 'User',
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-800">{row.original.fullName}</div>
            <div className="text-xs text-slate-400">{row.original.email ?? row.original.phone ?? '—'}</div>
          </div>
        ),
      },
      { header: 'Type', cell: ({ row }) => row.original.roles.join(', ') || '—' },
      {
        header: 'Status',
        cell: ({ row }) => (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[row.original.accountStatus]}`}>
            {row.original.accountStatus}
          </span>
        ),
      },
      {
        header: 'Rating',
        cell: ({ row }) => row.original.driverProfile?.rating ?? row.original.passengerProfile?.rating ?? '—',
      },
      { header: 'Joined', cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString('en-IN') },
      {
        header: 'Actions',
        cell: ({ row }) => {
          const u = row.original
          return (
            <div className="flex gap-1.5">
              {canSuspend && u.accountStatus === 'ACTIVE' && (
                <button onClick={() => moderate.mutate({ id: u.id, action: 'suspend' })} className="rounded-lg border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50">
                  Suspend
                </button>
              )}
              {canSuspend && u.accountStatus === 'SUSPENDED' && (
                <button onClick={() => moderate.mutate({ id: u.id, action: 'reactivate' })} className="rounded-lg border border-green-200 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50">
                  Reactivate
                </button>
              )}
              {canBlock && u.accountStatus !== 'BLOCKED' && (
                <button onClick={() => moderate.mutate({ id: u.id, action: 'block' })} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">
                  Block
                </button>
              )}
              {canBlock && u.accountStatus === 'BLOCKED' && (
                <button onClick={() => moderate.mutate({ id: u.id, action: 'unblock' })} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50">
                  Unblock
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [canBlock, canSuspend, moderate],
  )

  if (!canRead) return <PermissionDenied permission="user.read" />

  return (
    <div>
      <h1 className="text-2xl font-bold">Users</h1>
      <p className="mt-1 text-sm text-slate-500">Passengers and drivers across ShareRide.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          placeholder="Search name, email, phone…"
          className="w-64 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
        />
        <select value={userType} onChange={(e) => { setUserType(e.target.value as typeof userType); setPage(1) }} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
          <option value="">All types</option>
          <option value="PASSENGER">Passenger</option>
          <option value="DRIVER">Driver</option>
        </select>
        <select value={accountStatus} onChange={(e) => { setAccountStatus(e.target.value as typeof accountStatus); setPage(1) }} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BLOCKED">Blocked</option>
        </select>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No users match these filters."
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
