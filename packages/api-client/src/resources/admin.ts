import type { Permission } from '@shareride/types'
import type { HttpClient } from '../http'

export interface Paginated<T> {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  [key: string]: string | number | undefined
}

function toQueryString(params?: ListParams) {
  if (!params) return ''
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function adminResource(http: HttpClient) {
  return {
    dashboard: {
      getSummary: () => http.get<DashboardSummary>('/admin/dashboard'),
    },
    users: {
      list: (params?: ListParams) => http.get<Paginated<AdminUserListItem>>(`/admin/users${toQueryString(params)}`),
      detail: (id: string) => http.get<Record<string, unknown>>(`/admin/users/${id}`),
      suspend: (id: string, reason?: string) => http.post(`/admin/users/${id}/suspend`, { reason }),
      reactivate: (id: string, reason?: string) => http.post(`/admin/users/${id}/reactivate`, { reason }),
      block: (id: string, reason?: string) => http.post(`/admin/users/${id}/block`, { reason }),
      unblock: (id: string, reason?: string) => http.post(`/admin/users/${id}/unblock`, { reason }),
    },
    drivers: {
      list: (params?: ListParams) => http.get<Paginated<AdminDriverListItem>>(`/admin/drivers${toQueryString(params)}`),
      detail: (userId: string) => http.get<Record<string, unknown>>(`/admin/drivers/${userId}`),
      approve: (userId: string, note?: string) => http.post(`/admin/drivers/${userId}/approve`, { note }),
      reject: (userId: string, note?: string) => http.post(`/admin/drivers/${userId}/reject`, { note }),
      requestInfo: (userId: string, note?: string) => http.post(`/admin/drivers/${userId}/request-info`, { note }),
    },
    rides: {
      requests: (params?: ListParams) => http.get<Paginated<Record<string, unknown>>>(`/admin/rides/requests${toQueryString(params)}`),
      offers: (params?: ListParams) => http.get<Paginated<Record<string, unknown>>>(`/admin/rides/offers${toQueryString(params)}`),
      matches: (params?: ListParams) => http.get<Paginated<Record<string, unknown>>>(`/admin/rides/matches${toQueryString(params)}`),
      trips: (params?: ListParams) => http.get<Paginated<Record<string, unknown>>>(`/admin/rides/trips${toQueryString(params)}`),
      tripDetail: (id: string) => http.get<Record<string, unknown>>(`/admin/rides/trips/${id}`),
      cancelTrip: (id: string, reason?: string) => http.post(`/admin/rides/trips/${id}/cancel`, { reason }),
    },
    reports: {
      list: (params?: ListParams) => http.get<Paginated<AdminReportListItem>>(`/admin/reports${toQueryString(params)}`),
      detail: (id: string) => http.get<Record<string, unknown>>(`/admin/reports/${id}`),
      assignToSelf: (id: string) => http.post(`/admin/reports/${id}/assign`),
      addNote: (id: string, note: string) => http.post(`/admin/reports/${id}/notes`, { note }),
      resolve: (id: string, note?: string) => http.post(`/admin/reports/${id}/resolve`, { note }),
      dismiss: (id: string, note?: string) => http.post(`/admin/reports/${id}/dismiss`, { note }),
    },
    vehicles: {
      list: (params?: ListParams) => http.get<Paginated<AdminVehicleListItem>>(`/admin/vehicles${toQueryString(params)}`),
      detail: (id: string) => http.get<Record<string, unknown>>(`/admin/vehicles/${id}`),
      approve: (id: string, note?: string) => http.post(`/admin/vehicles/${id}/approve`, { note }),
      reject: (id: string, note?: string) => http.post(`/admin/vehicles/${id}/reject`, { note }),
    },
    support: {
      list: (params?: ListParams) => http.get<Paginated<AdminSupportTicketListItem>>(`/admin/support/tickets${toQueryString(params)}`),
      detail: (id: string) => http.get<Record<string, unknown>>(`/admin/support/tickets/${id}`),
      updateStatus: (id: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') =>
        http.post(`/admin/support/tickets/${id}/status`, { status }),
    },
    payments: {
      list: (params?: ListParams) => http.get<Paginated<AdminPaymentListItem>>(`/admin/payments${toQueryString(params)}`),
      detail: (id: string) => http.get<Record<string, unknown>>(`/admin/payments/${id}`),
      refund: (id: string, reason?: string) => http.post(`/admin/payments/${id}/refund`, { reason }),
    },
    roles: {
      list: () => http.get<AdminRoleDefinition[]>('/admin/roles'),
      detail: (id: string) => http.get<AdminRoleDefinition>(`/admin/roles/${id}`),
      updatePermissions: (id: string, permissions: Permission[]) =>
        http.patch<AdminRoleDefinition>(`/admin/roles/${id}/permissions`, { permissions }),
    },
    adminUsers: {
      list: () => http.get<AdminUserAccount[]>('/admin/admin-users'),
      create: (body: { id: string; email: string; fullName: string; roleId: string }) =>
        http.post<AdminUserAccount>('/admin/admin-users', body),
      deactivate: (id: string) => http.patch(`/admin/admin-users/${id}/deactivate`),
      reactivate: (id: string) => http.patch(`/admin/admin-users/${id}/reactivate`),
    },
    auditLogs: {
      list: (params?: ListParams) => http.get<Paginated<AdminAuditLogItem>>(`/admin/audit-logs${toQueryString(params)}`),
    },
  }
}

export interface DashboardSummary {
  totalUsers: number
  activeUsers: number
  drivers: number
  passengers: number
  verifiedDrivers: number
  pendingVerification: number
  activeRideRequests: number
  activeRideOffers: number
  activeMatches: number
  confirmedTrips: number
  completedTrips: number
  cancelledTrips: number
  openReports: number
}

export interface AdminUserListItem {
  id: string
  fullName: string
  phone: string | null
  email: string | null
  roles: string[]
  accountStatus: 'ACTIVE' | 'SUSPENDED' | 'BLOCKED'
  createdAt: string
  driverProfile: { rating: string; totalTrips: number; verificationStatus: string } | null
  passengerProfile: { rating: string; totalTrips: number } | null
}

export interface AdminDriverListItem {
  userId: string
  verificationStatus: string
  verificationNote: string | null
  rating: string
  totalTrips: number
  yearsActive: number
  user: { fullName: string; phone: string | null; email: string | null; accountStatus: string }
}

export interface AdminVehicleListItem {
  id: string
  make: string
  model: string
  year: number
  registrationNumber: string
  verificationStatus: string
  verificationNote: string | null
  isActive: boolean
  driver: { fullName: string; phone: string | null; email: string | null }
}

export interface AdminSupportTicketListItem {
  id: string
  category: string
  subject: string
  status: string
  createdAt: string
  user: { fullName: string; phone: string | null; email: string | null }
}

export interface AdminPaymentListItem {
  id: string
  tripId: string
  provider: string
  providerOrderId: string | null
  providerPaymentId: string | null
  amount: number
  currency: string
  status: string
  createdAt: string
  paidAt: string | null
  payer: { fullName: string; phone: string | null; email: string | null }
  trip: { id: string; status: string }
}

export interface AdminReportListItem {
  id: string
  type: string
  status: string
  reason: string
  createdAt: string
  reporter: { fullName: string }
  reportedUser: { fullName: string } | null
  assignedAdmin: { fullName: string } | null
}

export interface AdminRoleDefinition {
  id: string
  key: string
  name: string
  permissions: Permission[]
}

export interface AdminUserAccount {
  id: string
  email: string
  fullName: string
  isActive: boolean
  role: { key: string; name: string }
}

export interface AdminAuditLogItem {
  id: string
  action: string
  module: string
  entity: string
  entityId: string
  result: string
  createdAt: string
  admin: { fullName: string; email: string }
}
