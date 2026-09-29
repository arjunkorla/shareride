'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import type { AdminVehicleListItem } from '@shareride/api-client'
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

// Mirrors app/(admin)/drivers/page.tsx's structure — separate review
// queue from a driver's own identity verification (verification.*
// permissions, not driver.*; see packages/types/src/permissions.ts).
export default function VehiclesPage() {
  const canRead = useHasPermission('verification.read')
  const canApprove = useHasPermission('verification.approve')
  const canReject = useHasPermission('verification.reject')
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-vehicles', page, status],
    queryFn: () => browserApi.admin.vehicles.list({ page, pageSize: 20, verificationStatus: status || undefined }),
    enabled: canRead,
    placeholderData: (prev) => prev,
  })

  const act = useMutation({
    mutationFn: (vars: { id: string; action: 'approve' | 'reject' }) => {
      const note = vars.action === 'reject' ? window.prompt('Note shown to the driver (optional):') ?? undefined : undefined
      return browserApi.admin.vehicles[vars.action](vars.id, note)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] }),
  })

  const columns = useMemo<ColumnDef<AdminVehicleListItem, unknown>[]>(
    () => [
      {
        header: 'Vehicle',
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-slate-800">{row.original.make} {row.original.model} ({row.original.year})</div>
            <div className="text-xs text-slate-400">{row.original.registrationNumber}{!row.original.isActive ? ' · deactivated' : ''}</div>
          </div>
        ),
      },
      {
        header: 'Driver',
        cell: ({ row }) => (
          <div>
            <div className="text-slate-700">{row.original.driver.fullName}</div>
            <div className="text-xs text-slate-400">{row.original.driver.phone ?? row.original.driver.email ?? '—'}</div>
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
      { header: 'Note', cell: ({ row }) => row.original.verificationNote ?? '—' },
      {
        header: 'Actions',
        cell: ({ row }) => {
          const v = row.original
          const pending = v.verificationStatus === 'NOT_STARTED' || v.verificationStatus === 'SUBMITTED' || v.verificationStatus === 'UNDER_REVIEW'
          if (!pending) return null
          return (
            <div className="flex gap-1.5">
              {canApprove && (
                <button onClick={() => act.mutate({ id: v.id, action: 'approve' })} className="rounded-lg border border-green-200 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50">
                  Approve
                </button>
              )}
              {canReject && (
                <button onClick={() => act.mutate({ id: v.id, action: 'reject' })} className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50">
                  Reject
                </button>
              )}
            </div>
          )
        },
      },
    ],
    [act, canApprove, canReject],
  )

  if (!canRead) return <PermissionDenied permission="verification.read" />

  return (
    <div>
      <h1 className="text-2xl font-bold">Vehicles</h1>
      <p className="mt-1 text-sm text-slate-500">Vehicle registration and document verification queue.</p>

      <div className="mt-4 flex gap-2">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
          <option value="">All statuses</option>
          <option value="NOT_STARTED">Not started</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No vehicles match this filter."
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
