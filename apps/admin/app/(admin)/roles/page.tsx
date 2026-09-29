'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PERMISSIONS, type Permission } from '@shareride/types'
import { browserApi } from '../../../lib/api-browser'
import { useHasPermission } from '../../../components/admin-context'
import { PermissionDenied } from '../../../components/permission-denied'

export default function RolesPage() {
  const canManageRoles = useHasPermission('admin.role.manage')
  const canManageAdmins = useHasPermission('admin.user.manage')
  const queryClient = useQueryClient()

  const roles = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => browserApi.admin.roles.list(),
    enabled: canManageRoles || canManageAdmins,
  })

  const adminUsers = useQuery({
    queryKey: ['admin-admin-users'],
    queryFn: () => browserApi.admin.adminUsers.list(),
    enabled: canManageAdmins,
  })

  const [editingRoleId, setEditingRoleId] = useState<string | null>(null)
  const [draftPermissions, setDraftPermissions] = useState<Permission[]>([])

  const updateRole = useMutation({
    mutationFn: (vars: { id: string; permissions: Permission[] }) => browserApi.admin.roles.updatePermissions(vars.id, vars.permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] })
      setEditingRoleId(null)
    },
  })

  const [newAdmin, setNewAdmin] = useState({ id: '', email: '', fullName: '', roleId: '' })
  const createAdmin = useMutation({
    mutationFn: () => browserApi.admin.adminUsers.create(newAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-admin-users'] })
      setNewAdmin({ id: '', email: '', fullName: '', roleId: '' })
    },
  })
  const toggleAdmin = useMutation({
    mutationFn: (vars: { id: string; active: boolean }) =>
      vars.active ? browserApi.admin.adminUsers.reactivate(vars.id) : browserApi.admin.adminUsers.deactivate(vars.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-admin-users'] }),
  })

  if (!canManageRoles && !canManageAdmins) return <PermissionDenied permission="admin.role.manage" />

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Roles &amp; Permissions</h1>
        <p className="mt-1 text-sm text-slate-500">Nine role templates, each a set of granular permissions.</p>

        <div className="mt-4 space-y-3">
          {roles.data?.map((role) => {
            const editing = editingRoleId === role.id
            return (
              <div key={role.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-800">{role.name}</div>
                    <div className="text-xs text-slate-400">{role.key} · {role.permissions.length} permissions</div>
                  </div>
                  {canManageRoles && !editing && (
                    <button
                      onClick={() => { setEditingRoleId(role.id); setDraftPermissions(role.permissions) }}
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium hover:bg-slate-50"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editing ? (
                  <div className="mt-3">
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                      {PERMISSIONS.map((permission) => (
                        <label key={permission} className="flex items-center gap-1.5 text-xs text-slate-600">
                          <input
                            type="checkbox"
                            checked={draftPermissions.includes(permission)}
                            onChange={(e) =>
                              setDraftPermissions((prev) =>
                                e.target.checked ? [...prev, permission] : prev.filter((p) => p !== permission),
                              )
                            }
                          />
                          {permission}
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => updateRole.mutate({ id: role.id, permissions: draftPermissions })}
                        disabled={updateRole.isPending}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingRoleId(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {role.permissions.map((p) => (
                      <span key={p} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {canManageAdmins && (
        <div>
          <h2 className="text-lg font-bold">Admin Accounts</h2>
          <p className="mt-1 text-sm text-slate-500">
            Promotes an existing Supabase user to admin — paste their Supabase auth user id (find it in the Supabase dashboard after they sign up).
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <label className="block text-xs font-medium text-slate-500">Supabase user id</label>
              <input value={newAdmin.id} onChange={(e) => setNewAdmin((s) => ({ ...s, id: e.target.value }))} className="mt-1 w-64 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Email</label>
              <input value={newAdmin.email} onChange={(e) => setNewAdmin((s) => ({ ...s, email: e.target.value }))} className="mt-1 w-56 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Full name</label>
              <input value={newAdmin.fullName} onChange={(e) => setNewAdmin((s) => ({ ...s, fullName: e.target.value }))} className="mt-1 w-48 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500">Role</label>
              <select value={newAdmin.roleId} onChange={(e) => setNewAdmin((s) => ({ ...s, roleId: e.target.value }))} className="mt-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm">
                <option value="">Select…</option>
                {roles.data?.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => createAdmin.mutate()}
              disabled={createAdmin.isPending || !newAdmin.id || !newAdmin.email || !newAdmin.fullName || !newAdmin.roleId}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
            >
              Add admin
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Email</th>
                  <th className="px-4 py-2.5">Role</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.data?.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{a.fullName}</td>
                    <td className="px-4 py-2.5 text-slate-500">{a.email}</td>
                    <td className="px-4 py-2.5 text-slate-500">{a.role.name}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                        {a.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <button
                        onClick={() => toggleAdmin.mutate({ id: a.id, active: !a.isActive })}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-medium hover:bg-slate-50"
                      >
                        {a.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {adminUsers.data?.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">No admin accounts yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
