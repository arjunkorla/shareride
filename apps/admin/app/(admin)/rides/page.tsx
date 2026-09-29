'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import { browserApi } from '../../../lib/api-browser'
import { useHasPermission } from '../../../components/admin-context'
import { PermissionDenied } from '../../../components/permission-denied'
import { DataTable } from '../../../components/data-table'

type Tab = 'requests' | 'offers' | 'matches' | 'trips'
const TABS: { id: Tab; label: string }[] = [
  { id: 'requests', label: 'Ride Requests' },
  { id: 'offers', label: 'Ride Offers' },
  { id: 'matches', label: 'Matches' },
  { id: 'trips', label: 'Trips' },
]

type Row = Record<string, unknown>

function fmtDate(v: unknown) {
  if (!v || typeof v !== 'string') return '—'
  return new Date(v).toLocaleString('en-IN')
}

export default function RidesPage() {
  const canRead = useHasPermission('ride.read')
  const canCancel = useHasPermission('ride.cancel')
  const queryClient = useQueryClient()

  const [tab, setTab] = useState<Tab>('requests')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-rides', tab, page],
    queryFn: () => browserApi.admin.rides[tab]({ page, pageSize: 20 }),
    enabled: canRead,
    placeholderData: (prev) => prev,
  })

  const cancelTrip = useMutation({
    mutationFn: (id: string) => {
      const reason = window.prompt('Cancellation reason:') ?? undefined
      return browserApi.admin.rides.cancelTrip(id, reason)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-rides', 'trips'] }),
  })

  const columns = useMemo<ColumnDef<Row, unknown>[]>(() => {
    const base: ColumnDef<Row, unknown>[] = [
      { header: 'ID', accessorFn: (r) => String(r.id).slice(0, 8) },
      { header: 'From', accessorFn: (r) => r.origin },
      { header: 'To', accessorFn: (r) => r.destination },
    ]
    if (tab === 'requests') {
      return [
        ...base,
        { header: 'Passenger', accessorFn: (r) => (r.passenger as { fullName?: string } | undefined)?.fullName ?? '—' },
        { header: 'Status', accessorFn: (r) => r.status },
        { header: 'Created', accessorFn: (r) => fmtDate(r.createdAt) },
      ]
    }
    if (tab === 'offers') {
      return [
        ...base,
        { header: 'Driver', accessorFn: (r) => (r.driver as { fullName?: string } | undefined)?.fullName ?? '—' },
        { header: 'Status', accessorFn: (r) => r.status },
        { header: 'Created', accessorFn: (r) => fmtDate(r.createdAt) },
      ]
    }
    if (tab === 'matches') {
      return [
        { header: 'ID', accessorFn: (r) => String(r.id).slice(0, 8) },
        { header: 'Passenger', accessorFn: (r) => (r.rideRequest as { passenger?: { fullName?: string } } | undefined)?.passenger?.fullName ?? '—' },
        { header: 'Driver', accessorFn: (r) => (r.rideOffer as { driver?: { fullName?: string } } | undefined)?.driver?.fullName ?? '—' },
        { header: 'Match status', accessorFn: (r) => r.matchStatus },
        { header: 'Created', accessorFn: (r) => fmtDate(r.createdAt) },
      ]
    }
    // trips
    return [
      { header: 'ID', accessorFn: (r) => String(r.id).slice(0, 8) },
      { header: 'Passenger', accessorFn: (r) => (r.passenger as { fullName?: string } | undefined)?.fullName ?? '—' },
      { header: 'Driver', accessorFn: (r) => (r.driver as { fullName?: string } | undefined)?.fullName ?? '—' },
      { header: 'Status', accessorFn: (r) => r.status },
      { header: 'Scheduled', accessorFn: (r) => fmtDate(r.scheduledAt) },
      {
        header: 'Actions',
        cell: ({ row }) => {
          const status = row.original.status
          if (!canCancel || status === 'CANCELLED' || status === 'COMPLETED') return null
          return (
            <button
              onClick={() => cancelTrip.mutate(String(row.original.id))}
              className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
            >
              Cancel
            </button>
          )
        },
      },
    ]
  }, [tab, canCancel, cancelTrip])

  if (!canRead) return <PermissionDenied permission="ride.read" />

  return (
    <div>
      <h1 className="text-2xl font-bold">Rides</h1>
      <p className="mt-1 text-sm text-slate-500">Ride Request ↔ Ride Offer → Match → Confirmation → Trip.</p>

      <div className="mt-4 flex gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setPage(1) }}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tab === t.id ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={(data?.items as Row[]) ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="Nothing here yet."
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
