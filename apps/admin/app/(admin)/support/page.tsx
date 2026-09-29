'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import type { AdminSupportTicketListItem } from '@shareride/api-client'
import { browserApi } from '../../../lib/api-browser'
import { useHasPermission } from '../../../components/admin-context'
import { PermissionDenied } from '../../../components/permission-denied'
import { DataTable } from '../../../components/data-table'

const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const
const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-amber-50 text-amber-700',
  IN_PROGRESS: 'bg-blue-50 text-blue-700',
  RESOLVED: 'bg-green-50 text-green-700',
  CLOSED: 'bg-slate-100 text-slate-600',
}

// Mirrors app/(admin)/drivers|reports/page.tsx's structure. Lightweight
// on purpose (packages/database's SupportTicket model has no threaded
// replies) — the only admin action is a status transition, same as this
// phase's other review queues, audited the same way.
export default function SupportPage() {
  const canRead = useHasPermission('support.read')
  const canRespond = useHasPermission('support.respond')
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-support', page, status],
    queryFn: () => browserApi.admin.support.list({ page, pageSize: 20, status: status || undefined }),
    enabled: canRead,
    placeholderData: (prev) => prev,
  })

  const updateStatus = useMutation({
    mutationFn: (vars: { id: string; status: (typeof STATUSES)[number] }) => browserApi.admin.support.updateStatus(vars.id, vars.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-support'] }),
  })

  const columns = useMemo<ColumnDef<AdminSupportTicketListItem, unknown>[]>(
    () => [
      {
        header: 'Ticket',
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-800">{row.original.subject}</div>
            <div className="text-xs text-slate-400">{row.original.category}</div>
          </div>
        ),
      },
      {
        header: 'From',
        cell: ({ row }) => (
          <div>
            <div className="text-slate-700">{row.original.user.fullName}</div>
            <div className="text-xs text-slate-400">{row.original.user.phone ?? row.original.user.email ?? '—'}</div>
          </div>
        ),
      },
      {
        header: 'Status',
        cell: ({ row }) => (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[row.original.status]}`}>
            {row.original.status.replace('_', ' ')}
          </span>
        ),
      },
      { header: 'Filed', cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() },
      {
        header: 'Actions',
        cell: ({ row }) => {
          if (!canRespond) return null
          return (
            <select
              value={row.original.status}
              onChange={(e) => updateStatus.mutate({ id: row.original.id, status: e.target.value as (typeof STATUSES)[number] })}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          )
        },
      },
    ],
    [canRespond, updateStatus],
  )

  if (!canRead) return <PermissionDenied permission="support.read" />

  return (
    <div>
      <h1 className="text-2xl font-bold">Support Tickets</h1>
      <p className="mt-1 text-sm text-slate-500">User-submitted support requests.</p>

      <div className="mt-4 flex gap-2">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No support tickets match this filter."
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
