'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import type { AdminReportListItem } from '@shareride/api-client'
import { browserApi } from '../../../lib/api-browser'
import { useHasPermission } from '../../../components/admin-context'
import { PermissionDenied } from '../../../components/permission-denied'
import { DataTable } from '../../../components/data-table'

const STATUS_STYLES: Record<string, string> = {
  NEW: 'bg-red-50 text-red-700',
  INVESTIGATING: 'bg-blue-50 text-blue-700',
  AWAITING_INFORMATION: 'bg-amber-50 text-amber-700',
  RESOLVED: 'bg-green-50 text-green-700',
  DISMISSED: 'bg-slate-100 text-slate-500',
}

export default function ReportsPage() {
  const canRead = useHasPermission('report.read')
  const canAssign = useHasPermission('report.assign')
  const canResolve = useHasPermission('report.resolve')
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-reports', page, status],
    queryFn: () => browserApi.admin.reports.list({ page, pageSize: 20, status: status || undefined }),
    enabled: canRead,
    placeholderData: (prev) => prev,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-reports'] })
  const assign = useMutation({ mutationFn: (id: string) => browserApi.admin.reports.assignToSelf(id), onSuccess: invalidate })
  const resolve = useMutation({
    mutationFn: (id: string) => browserApi.admin.reports.resolve(id, window.prompt('Resolution note (optional):') ?? undefined),
    onSuccess: invalidate,
  })
  const dismiss = useMutation({
    mutationFn: (id: string) => browserApi.admin.reports.dismiss(id, window.prompt('Dismissal note (optional):') ?? undefined),
    onSuccess: invalidate,
  })

  const columns = useMemo<ColumnDef<AdminReportListItem, unknown>[]>(
    () => [
      { header: 'Type', accessorFn: (r) => r.type },
      { header: 'Reason', accessorFn: (r) => r.reason },
      { header: 'Reporter', accessorFn: (r) => r.reporter.fullName },
      { header: 'Against', accessorFn: (r) => r.reportedUser?.fullName ?? '—' },
      {
        header: 'Status',
        cell: ({ row }) => (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[row.original.status]}`}>
            {row.original.status.replace('_', ' ')}
          </span>
        ),
      },
      { header: 'Assigned to', accessorFn: (r) => r.assignedAdmin?.fullName ?? 'Unassigned' },
      {
        header: 'Actions',
        cell: ({ row }) => {
          const r = row.original
          const open = r.status !== 'RESOLVED' && r.status !== 'DISMISSED'
          if (!open) return null
          return (
            <div className="flex gap-1.5">
              {canAssign && !r.assignedAdmin && (
                <button onClick={() => assign.mutate(r.id)} className="rounded-lg border border-blue-200 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50">
                  Assign to me
                </button>
              )}
              {canResolve && (
                <>
                  <button onClick={() => resolve.mutate(r.id)} className="rounded-lg border border-green-200 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50">
                    Resolve
                  </button>
                  <button onClick={() => dismiss.mutate(r.id)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    Dismiss
                  </button>
                </>
              )}
            </div>
          )
        },
      },
    ],
    [assign, canAssign, canResolve, dismiss, resolve],
  )

  if (!canRead) return <PermissionDenied permission="report.read" />

  return (
    <div>
      <h1 className="text-2xl font-bold">Safety &amp; Reports</h1>
      <p className="mt-1 text-sm text-slate-500">User, driver, ride, and fraud reports.</p>

      <div className="mt-4 flex gap-2">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="AWAITING_INFORMATION">Awaiting information</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No reports match this filter."
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
