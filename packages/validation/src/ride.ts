import { z } from 'zod'
import { geoPointSchema } from './geo'

// Mirrors packages/types RidePreferences. No seat count / seat quantity
// field belongs here — see docs/current-architecture.md §5.
export const ridePreferencesSchema = z.object({
  womenOnly: z.boolean().optional(),
  acPreferred: z.boolean().optional(),
  petsOk: z.boolean().optional(),
  luggageSpace: z.boolean().optional(),
  silentRide: z.boolean().optional(),
  autoConfirm: z.boolean().optional(),
})

export const createRideRequestSchema = z.object({
  origin: z.string().min(2).max(200),
  destination: z.string().min(2).max(200),
  originCoordinates: geoPointSchema,
  destinationCoordinates: geoPointSchema,
  preferredDate: z.string().date(),
  preferredTimeStart: z.string().regex(/^\d{2}:\d{2}$/),
  preferredTimeEnd: z.string().regex(/^\d{2}:\d{2}$/),
  preferences: ridePreferencesSchema.optional(),
  notes: z.string().max(500).optional(),
})
export type CreateRideRequestInput = z.infer<typeof createRideRequestSchema>

export const createRideOfferSchema = z.object({
  vehicleId: z.string().uuid(),
  origin: z.string().min(2).max(200),
  destination: z.string().min(2).max(200),
  originCoordinates: geoPointSchema,
  destinationCoordinates: geoPointSchema,
  departureDate: z.string().date(),
  departureTime: z.string().regex(/^\d{2}:\d{2}$/),
  stops: z.array(z.string().min(1).max(200)).max(5).default([]),
  pricePerPerson: z.number().positive().max(100000),
  preferences: ridePreferencesSchema.optional(),
  notes: z.string().max(500).optional(),
})
export type CreateRideOfferInput = z.infer<typeof createRideOfferSchema>
