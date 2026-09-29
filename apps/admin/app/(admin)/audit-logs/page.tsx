'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import type { AdminAuditLogItem } from '@shareride/api-client'
import { browserApi } from '../../../lib/api-browser'
import { useHasPermission } from '../../../components/admin-context'
import { PermissionDenied } from '../../../components/permission-denied'
import { DataTable } from '../../../components/data-table'

export default function AuditLogsPage() {
  const canRead = useHasPermission('audit.read')
  const [page, setPage] = useState(1)
  const [moduleFilter, setModuleFilter] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-audit-logs', page, moduleFilter],
    queryFn: () => browserApi.admin.auditLogs.list({ page, pageSize: 25, module: moduleFilter || undefined }),
    enabled: canRead,
    placeholderData: (prev) => prev,
  })

  const columns = useMemo<ColumnDef<AdminAuditLogItem, unknown>[]>(
    () => [
      { header: 'When', cell: ({ row }) => new Date(row.original.createdAt).toLocaleString('en-IN') },
      { header: 'Admin', cell: ({ row }) => row.original.admin.fullName },
      { header: 'Module', accessorFn: (r) => r.module },
      { header: 'Action', accessorFn: (r) => r.action },
      { header: 'Entity', cell: ({ row }) => `${row.original.entity} · ${row.original.entityId.slice(0, 8)}` },
      {
        header: 'Result',
        cell: ({ row }) => (
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${row.original.result === 'SUCCESS' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {row.original.result}
          </span>
        ),
      },
    ],
    [],
  )

  if (!canRead) return <PermissionDenied permission="audit.read" />

  return (
    <div>
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      <p className="mt-1 text-sm text-slate-500">Read-only. Every admin write in the system lands here.</p>

      <div className="mt-4 flex gap-2">
        <select value={moduleFilter} onChange={(e) => { setModuleFilter(e.target.value); setPage(1) }} className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
          <option value="">All modules</option>
          <option value="users">Users</option>
          <option value="drivers">Drivers</option>
          <option value="rides">Rides</option>
          <option value="safety">Safety</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          isLoading={isLoading}
          isError={isError}
          emptyMessage="No audit entries yet."
          page={page}
          pageSize={25}
          total={data?.total ?? 0}
          onPageChange={setPage}
        />
      </div>
    </div>
  )
}
