export type Screen =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'register'
  | 'home'
  | 'search'
  | 'ride-detail'
  | 'post-ride'
  | 'chat-list'
  | 'chat-detail'
  | 'trips'
  | 'profile'
  | 'notifications'
  | 'wallet'
  | 'verification'
  | 'forgot-password'
  | 'reset-password'
  | 'notification-detail'
  | 'edit-profile'
  | 'notification-settings'
  | 'privacy-security'
  | 'dark-mode'
  | 'emergency-contacts'
  | 'help-support'
  | 'terms'
  | 'privacy-policy'
  | 'settings'
  | 'success'
  | 'booking-confirmation'
  | 'offer-a-ride'
  | 'request-a-ride'
  | 'payment'
  | 'ride-tracking'
  | 'rate-review'
  | 'public-profile'
  | 'sos'
  | 'language'

export interface Driver {
  id: string
  name: string
  avatar: string
  rating: number
  trips: number
  verified: boolean
  yearsActive: number
  bio: string
  languages: string[]
  responseTime: string
  memberSince: string
}

export interface Vehicle {
  make: string
  model: string
  year: number
  color: string
  regNumber: string
  fuelType: 'Petrol' | 'Diesel' | 'EV' | 'CNG'
  ac: boolean
  rcVerified: boolean
  insuranceVerified: boolean
  photo?: string
}

export interface Ride {
  id: string
  driver: Driver
  from: string
  fromShort: string
  to: string
  toShort: string
  date: string
  time: string
  price: number
  distance: string
  duration: string
  vehicle: Vehicle
  amenities: string[]
  rating: number
  reviews: number
  instantBook: boolean
  stops?: string[]
  route?: string
  matchScore?: 'great' | 'good' | 'ok'
  pickupProximity?: string
  postedAt?: string
}

// A passenger's posted ride request, shown alongside offered Rides in
// discovery feeds (Home's Latest Rides, Search's Requests tab). Deliberately
// has no seat/quantity field — see docs/current-architecture.md §5.
export interface RideRequestSummary {
  id: string
  passenger: { name: string; avatar: string; rating: number; verified: boolean; trips: number }
  from: string
  to: string
  date: string
  time: string
  distance: string
  note: string
  matchScore: 'great' | 'good' | 'ok'
  postedAt: string
}

export interface LocationSuggestion {
  name: string
  subtitle: string
}

// Controlled search state, lifted to App.tsx so it survives navigating to
// Ride Detail (or anywhere else) and back — see SearchScreen/HomeScreen.
export interface SearchQuery {
  pickup: string
  pickupSubtitle: string
  dropoff: string
  dropoffSubtitle: string
  date: string
  timeLabel: string
}

export interface ChatContact {
  id: string
  name: string
  avatar: string
  lastMessage: string
  lastTime: string
  unread: number
  online: boolean
  rideInfo?: string
}

export interface ChatMessage {
  id: string
  senderId: string
  text: string
  time: string
  read: boolean
  type: 'text' | 'image' | 'location' | 'ride'
}

export type TripStatus = 'upcoming' | 'completed' | 'cancelled'

export interface Trip {
  id: string
  type: 'requested' | 'offered'
  ride: Ride
  status: TripStatus
  bookingDate: string
  amount: number
}

export interface Notification {
  id: string
  type: 'ride' | 'message' | 'booking' | 'system' | 'promo'
  title: string
  body: string
  time: string
  read: boolean
  avatar?: string
  icon?: string
}

export interface Review {
  id: string
  author: string
  avatar: string
  rating: number
  comment: string
  date: string
  rideRoute?: string
}
