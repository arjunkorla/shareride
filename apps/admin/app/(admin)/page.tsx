import type { DashboardSummary } from '@shareride/api-client'
import { getCurrentAdmin, hasPermission } from '../../lib/auth'
import { getServerApiClient } from '../../lib/api-server'
import { PermissionDenied } from '../../components/permission-denied'

const KPI_LABELS: Record<string, string> = {
  totalUsers: 'Total Users',
  activeUsers: 'Active Users',
  drivers: 'Drivers',
  passengers: 'Passengers',
  verifiedDrivers: 'Verified Drivers',
  pendingVerification: 'Pending Verification',
  activeRideRequests: 'Active Ride Requests',
  activeRideOffers: 'Active Ride Offers',
  activeMatches: 'Active Matches',
  confirmedTrips: 'Confirmed Trips',
  completedTrips: 'Completed Trips',
  cancelledTrips: 'Cancelled Trips',
  openReports: 'Open Safety Reports',
}

export default async function DashboardPage() {
  const admin = await getCurrentAdmin()
  if (!hasPermission(admin, 'analytics.read')) return <PermissionDenied permission="analytics.read" />

  const api = await getServerApiClient()

  let summary: DashboardSummary | null = null
  let error: string | null = null
  try {
    summary = await api.admin.dashboard.getSummary()
  } catch {
    error = 'Could not load dashboard metrics. Is the API running and is DATABASE_URL configured?'
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">Hyderabad, Telangana — live counts from the database.</p>

      {error && <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Object.entries(KPI_LABELS).map(([key, label]) => (
            <div key={key} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
              <div className="mt-1 text-2xl font-bold">{summary?.[key as keyof DashboardSummary] ?? '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
