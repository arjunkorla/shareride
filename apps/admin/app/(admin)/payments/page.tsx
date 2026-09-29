'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import type { AdminPaymentListItem } from '@shareride/api-client'
import { browserApi } from '../../../lib/api-browser'
import { useHasPermission } from '../../../components/admin-context'
import { PermissionDenied } from '../../../components/permission-denied'
import { DataTable } from '../../../components/data-table'

const STATUSES = ['PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUND_PENDING', 'REFUNDED'] as const
const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-slate-50 text-slate-600',
  AUTHORIZED: 'bg-blue-50 text-blue-700',
  PAID: 'bg-green-50 text-green-700',
  FAILED: 'bg-red-50 text-red-700',
  REFUND_PENDING: 'bg-amber-50 text-amber-700',
  REFUNDED: 'bg-slate-100 text-slate-600',
}

function formatAmount(paise: number, currency: string) {
  return `${currency === 'INR' ? '₹' : currency + ' '}${(paise / 100).toFixed(2)}`
}

// Mirrors app/(admin)/drivers|reports|vehicles|support/page.tsx's
// structure. Read-only list/detail plus one sensitive action (refund),
// gated by payment.read/payment.refund and audited like every other
// admin write in this console. Never shows a Razorpay secret, webhook
// signature, or card/UPI instrument detail — the Payment model doesn't
// store any of those (Razorpay's own checkout is PCI-compliant, this API
// only ever sees ids/amounts/status).
export default function PaymentsPage() {
  const canRead = useHasPermission('payment.read')
  const canRefund = useHasPermission('payment.refund')
  const queryClient = useQueryClient()

  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-payments', page, status],
    queryFn: () => browserApi.admin.payments.list({ page, pageSize: 20, status: status || undefined }),
    enabled: canRead,
    placeholderData: (prev) => prev,
  })

  const refund = useMutation({
    mutationFn: (id: string) => {
      const reason = window.prompt('Refund reason (optional):') ?? undefined
      return browserApi.admin.payments.refund(id, reason)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-payments'] }),
  })

  const columns = useMemo<ColumnDef<AdminPaymentListItem, unknown>[]>(
    () => [
      {
        header: 'Payment',
        cell: ({ row }) => (
          <div>
            <div className="font-mono text-xs text-slate-400">{row.original.id.slice(0, 8)}</div>
            <div className="text-xs text-slate-400">Trip {row.original.tripId.slice(0, 8)}</div>
          </div>
        ),
      },
      {
        header: 'Payer',
        cell: ({ row }) => (
          <div>
            <div className="text-slate-700">{row.original.payer.fullName}</div>
            <div className="text-xs text-slate-400">{row.original.payer.phone ?? row.original.payer.email ?? '—'}</div>
          </div>
        ),
      },
      { header: 'Amount', cell: ({ row }) => formatAmount(row.original.amount, row.original.currency) },
      {
        header: 'Status',
        cell: ({ row }) => (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[row.original.status]}`}>
            {row.original.status.replace('_', ' ')}
          </span>
        ),
      },
      { header: 'Provider ref', cell: ({ row }) => row.original.providerPaymentId ?? row.original.providerOrderId ?? '—' },
      { header: 'Paid', cell: ({ row }) => (row.original.paidAt ? new Date(row.original.paidAt).toLocaleString() : '—') },
      {
        header: 'Actions',
        cell: ({ row }) => {
          if (!canRefund || row.original.status !== 'PAID') return null
          return (
            <button
              onClick={() => refund.mutate(row.original.id)}
              className="rounded-lg border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
            >
              Refund
            </button>
          )
        },
      },
    ],
    [canRefund, refund],
  )

  if (!canRead) return <PermissionDenied permission="payment.read" />

  return (
    <div>
      <h1 className="text-2xl font-bold">Payments</h1>
      <p className="mt-1 text-sm text-slate-500">Razorpay payments against confirmed trips.</p>

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
          emptyMessage="No payments match this filter."
          page={page}
          pageSize={20}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
