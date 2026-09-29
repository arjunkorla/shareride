import { z } from 'zod'

// Uppercased, whitespace-stripped so "ts09 ea 1234" and "TS09EA1234" are
// recognized as the same plate before the DB's unique constraint on
// registrationNumber ever sees them — normalization, not a check against
// an actual government registry (no such integration exists here).
const registrationNumber = z
  .string()
  .min(4)
  .max(20)
  .transform((value) => value.replace(/\s+/g, '').toUpperCase())

// Minimal vehicle-registration schema — just enough for a driver to have a
// real vehicleId to attach a RideOffer to (see docs/migration-plan.md
// Phase 6). Document upload/verification review is Phase 10 (admin
// side); this only captures what a driver types about their own car.
export const createVehicleSchema = z.object({
  make: z.string().min(1).max(60),
  model: z.string().min(1).max(60),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  color: z.string().min(1).max(40),
  fuelType: z.enum(['PETROL', 'DIESEL', 'EV', 'CNG']),
  registrationNumber,
  ac: z.boolean().optional().default(true),
})
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>

// A driver may only ever edit their own vehicle's descriptive fields —
// verificationStatus/isActive are deliberately absent here (admin-only
// and deactivate-endpoint-only, respectively; see
// apps/api/src/vehicles/vehicles.service.ts and admin/vehicles).
export const updateVehicleSchema = z
  .object({
    make: z.string().min(1).max(60),
    model: z.string().min(1).max(60),
    year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
    color: z.string().min(1).max(40),
    fuelType: z.enum(['PETROL', 'DIESEL', 'EV', 'CNG']),
    registrationNumber,
    ac: z.boolean(),
  })
  .partial()
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
