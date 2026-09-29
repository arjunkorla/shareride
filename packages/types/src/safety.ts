export type ReportType = 'USER' | 'DRIVER' | 'PASSENGER' | 'RIDE' | 'FRAUD' | 'SAFETY_INCIDENT'
export type ReportStatus = 'NEW' | 'INVESTIGATING' | 'AWAITING_INFORMATION' | 'RESOLVED' | 'DISMISSED'

// The reporting user's own view of a report they filed — deliberately
// narrower than the admin console's Report shape (no assignedAdminId,
// no ReportAction history): moderation handling is internal, never
// exposed back through a user-facing endpoint.
export interface UserReport {
  id: string
  type: ReportType
  status: ReportStatus
  reportedUserId?: string
  tripId?: string
  reason: string
  description?: string
  createdAt: string
}

export interface EmergencyContact {
  id: string
  userId: string
  name: string
  phone: string
  relation?: string
  createdAt: string
}
