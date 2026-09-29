export type UserRole = 'PASSENGER' | 'DRIVER' | 'ADMIN'

export type AdminRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'OPERATIONS_ADMIN'
  | 'VERIFICATION_ADMIN'
  | 'SAFETY_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'FINANCE_ADMIN'
  | 'CONTENT_ADMIN'
  | 'READ_ONLY_ADMIN'

export interface User {
  id: string
  phone?: string
  email?: string
  fullName: string
  avatarUrl?: string
  roles: UserRole[]
  createdAt: string
  updatedAt: string
}

export type VerificationStatus =
  | 'NOT_STARTED'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTION_REQUIRED'

export interface DriverProfile {
  userId: string
  bio?: string
  languages: string[]
  yearsActive: number
  verificationStatus: VerificationStatus
  rating: number
  totalTrips: number
}

export interface PassengerProfile {
  userId: string
  rating: number
  totalTrips: number
}

export interface Vehicle {
  id: string
  driverId: string
  make: string
  model: string
  year: number
  color: string
  fuelType: 'PETROL' | 'DIESEL' | 'EV' | 'CNG'
  registrationNumber: string
  ac: boolean
  verificationStatus: VerificationStatus
  verificationNote?: string
  photoUrl?: string
  isActive: boolean
}
