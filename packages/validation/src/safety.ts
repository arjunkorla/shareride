import { z } from 'zod'

// ReportType mirrors the Prisma enum exactly (packages/database's schema
// already defines the canonical target-type list) — status/assignment are
// admin-only fields (apps/api/src/admin/reports), never set by the
// reporting user. There's no canonical "reason" enum in the schema (it's
// a free-text column), so this only bounds its length; the curated
// reason chips a report screen might show are a mobile-side presentation
// concern, not a shared contract.
// USER/DRIVER/PASSENGER/RIDE reports are inherently about a specific
// entity, so one of reportedUserId/tripId is required for those. FRAUD
// and SAFETY_INCIDENT can be a general concern with no specific target
// yet (e.g. filed from the Help & Support "Safety Center" entry point,
// not from a specific trip/profile screen) — not requiring one there.
const TARGETED_TYPES = new Set(['USER', 'DRIVER', 'PASSENGER', 'RIDE'])

export const createReportSchema = z
  .object({
    type: z.enum(['USER', 'DRIVER', 'PASSENGER', 'RIDE', 'FRAUD', 'SAFETY_INCIDENT']),
    reportedUserId: z.string().uuid().optional(),
    tripId: z.string().uuid().optional(),
    reason: z.string().min(1).max(200),
    description: z.string().max(2000).optional(),
  })
  .refine((data) => !TARGETED_TYPES.has(data.type) || Boolean(data.reportedUserId) || Boolean(data.tripId), {
    message: 'This report type needs a reported user or a trip to be about',
  })
export type CreateReportInput = z.infer<typeof createReportSchema>

export const createEmergencyContactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(6).max(20),
  relation: z.string().max(60).optional(),
})
export type CreateEmergencyContactInput = z.infer<typeof createEmergencyContactSchema>
