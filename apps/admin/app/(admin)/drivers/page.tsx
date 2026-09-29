'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import type { AdminDriverListItem } from '@shareride/api-client'
import { browserApi } from '../../../lib/api-browser'
import { useHasPermission } from '../../../components/admin-context'
import { PermissionDenied } from '../../../components/permission-denied'
import { DataTable } from '../../../components/data-table'

const STATUS_STYLES: Record<string, string> = {
  NOT_STARTED: 'bg-slate-50 text-slate-600',
  SUBMITTED: 'bg-blue-50 text-blue-700',
  UNDER_REVIEW: 'bg-blue-50 text-blue-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  ACTION_REQUIRED: 'bg-amber-50 text-amber-700',
}

export default function DriversPage() {
  const canRead = useHasPermission('driver.read')
  const canApprove = useHasPermission('driver.approve')
  const canReject = useHasPermission('driver.reject')
  const canRequestInfo = useHasPermission('driver.verify')
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-drivers', page, status],
    queryFn: () => browserApi.admin.drivers.list({ page, pageSize: 20, verificationStatus: status || undefined }),
    enabled: canRead,
    placeholderData: (prev) => prev,
  })

  const act = useMutation({
    mutationFn: (vars: { userId: string; action: 'approve' | 'reject' | 'requestInfo' }) => {
      const note =
        vars.action !== 'approve' ? window.prompt('Note shown to the driver (optional):') ?? undefined : undefined
      return browserApi.admin.drivers[vars.action](vars.userId, note)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-drivers'] }),
  })

  const columns = useMemo<ColumnDef<AdminDriverListItem, unknown>[]>(
    () => [
      {
        header: 'Driver',
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-800">{row.original.user.fullName}</div>
            <div className="text-xs text-slate-400">{row.original.user.phone ?? row.original.user.email ?? '—'}</div>
          </div>
        ),
      },
      {
        header: 'Verification',
        cell: ({ row }) => (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[row.original.verificationStatus]}`}>
            {row.original.verificationStatus.replace('_', ' ')}
          </span>
        ),
      },
      { header: 'Rating', cell: ({ row }) => `${row.original.rating} (${row.original.totalTrips} trips)` },
      { header: 'Note', cell: ({ row }) => row.original.verificationNote ?? '—' },
      {
        header: 'Actions',
        cell: ({ row }) => {
          const d = row.original
          const pending = d.verificationStatus === 'SUBMITTED' || d.verificationStatus === 'UNDER_REVIEW' || d.verificationStatus === 'ACTION_REQUIRED'
          if (!pending) return null
          return (
            <div className="flex gap-1.5">
              {canApprove && (
                <button onClick={() => act.mutate({ userId: d.userId, action: 'approve' })} className="rounded-lg border border-green-200 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50">
                  Approve
                </button>
              )}
              {canReject && (
                <button onClick={() => act.mutate({ userId: d.userId, action: 'reject' })} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">
                  Reject
                </button>
              )}
              {canRequestInfo && (
                <button onClick={() => act.mutate({ userId: d.userId, action: 'requestInfo' })} className="rounded-lg border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50">
                  Request info
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [act, canApprove, canReject, canRequestInfo],
  )

  if (!canRead) return <PermissionDenied permission="driver.read" />

  return (
    <div>
      <h1 className="text-2xl font-bold">Drivers &amp; Verification</h1>
      <p className="mt-1 text-sm text-slate-500">Driving license, vehicle, and insurance verification queue.</p>

      <div className="mt-4 flex gap-2">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
          <option value="">All statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="ACTION_REQUIRED">Action required</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="NOT_STARTED">Not started</option>
        </select>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No drivers match this filter."
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
