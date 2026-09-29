import type { GeoPoint } from '@shareride/types'

// Local UI "view model" fixtures for Phase 3 (mobile shell + navigation
// parity) — screens render against these, shaped like the real
// packages/types domain models (RideOffer/RideRequest/Match/Trip), NOT the
// old flattened `Ride` from src/types.ts. There is deliberately no
// seat/quantity field anywhere here — see docs/current-architecture.md §5
// and docs/migration-plan.md Phase 3. Once Phase 5/6 land real endpoints,
// these get replaced by TanStack Query hooks returning the same shapes.

export const currentUser = {
  id: 'me',
  name: 'Priya Sharma',
  avatarUrl: undefined as string | undefined,
}

export interface DriverView {
  id: string
  name: string
  avatarUrl: string
  rating: number
  totalTrips: number
  verified: boolean
  yearsActive: number
  bio: string
  languages: string[]
  responseTimeLabel: string
  memberSinceLabel: string
}

export const drivers: DriverView[] = [
  {
    id: 'd1',
    name: 'Arjun Reddy',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format',
    rating: 4.9,
    totalTrips: 247,
    verified: true,
    yearsActive: 3,
    bio: 'Daily commuter between Madhapur and Gachibowli. I value punctuality and keep my car clean. Non-smoker. Happy to share good music on the way!',
    languages: ['Telugu', 'Hindi', 'English'],
    responseTimeLabel: '< 5 min',
    memberSinceLabel: 'Jan 2022',
  },
  {
    id: 'd2',
    name: 'Priya Lakshmi',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b1b5?w=200&h=200&fit=crop&auto=format',
    rating: 4.8,
    totalTrips: 183,
    verified: true,
    yearsActive: 2,
    bio: 'Safe and reliable commuter. Women-preferred rides available. I prefer a quiet ride but happy to chat!',
    languages: ['Telugu', 'Hindi', 'English'],
    responseTimeLabel: '< 10 min',
    memberSinceLabel: 'Mar 2023',
  },
  {
    id: 'd3',
    name: 'Rohit Sharma',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format',
    rating: 4.7,
    totalTrips: 512,
    verified: true,
    yearsActive: 5,
    bio: 'Experienced long-distance traveller. 5+ years on Hyderabad-Warangal and Hyderabad-Vijayawada routes. Punctual, polite, pet-friendly.',
    languages: ['Telugu', 'Hindi', 'English'],
    responseTimeLabel: '< 15 min',
    memberSinceLabel: 'Jun 2020',
  },
]

export interface VehicleView {
  make: string
  model: string
  year: number
  color: string
  registrationNumber: string
  fuelType: 'Petrol' | 'Diesel' | 'EV' | 'CNG'
  ac: boolean
  rcVerified: boolean
  insuranceVerified: boolean
  photoUrl?: string
}

export interface RidePreferencesView {
  womenOnly: boolean
  acAvailable: boolean
  petsOk: boolean
  luggageSpace: boolean
  silentRide: boolean
  /** Auto-confirm matching requests without manual driver approval. Replaces the legacy `instantBook` seat-booking flag. */
  autoConfirm: boolean
}

// A driver's posted RideOffer, joined with display fields a real
// GET /ride-offers endpoint would return already-hydrated. No seat count
// anywhere — pricePerPerson is charged once matched, not multiplied by seats.
export interface RideOfferView {
  id: string
  driver: DriverView
  vehicle: VehicleView
  origin: string
  originShort: string
  destination: string
  destinationShort: string
  originCoordinates: GeoPoint
  destinationCoordinates: GeoPoint
  departureDateLabel: string
  departureTimeLabel: string
  pricePerPerson: number
  distanceLabel: string
  durationLabel: string
  routeNote?: string
  stops: string[]
  preferences: RidePreferencesView
  reviewCount: number
  matchScore?: 'great' | 'good' | 'ok'
  pickupProximityLabel?: string
  postedAtLabel: string
}

export const rideOffers: RideOfferView[] = [
  {
    id: 'ro1',
    driver: drivers[0],
    vehicle: {
      make: 'Honda', model: 'City ZX', year: 2022, color: 'Pearl White',
      registrationNumber: 'TS 09 ** 7849', fuelType: 'Petrol', ac: true,
      rcVerified: true, insuranceVerified: true,
      photoUrl: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=200&fit=crop&auto=format',
    },
    origin: 'Madhapur, Hyderabad', originShort: 'Madhapur',
    destination: 'Gachibowli, Hyderabad', destinationShort: 'Gachibowli',
    originCoordinates: { lat: 17.4483, lng: 78.3915 },
    destinationCoordinates: { lat: 17.4401, lng: 78.3489 },
    departureDateLabel: 'Tomorrow', departureTimeLabel: '08:00 AM',
    pricePerPerson: 120, distanceLabel: '7.4 km', durationLabel: '22 min',
    routeNote: 'via Hitech City Rd', stops: [],
    preferences: { womenOnly: false, acAvailable: true, petsOk: false, luggageSpace: false, silentRide: false, autoConfirm: true },
    reviewCount: 127, matchScore: 'great', pickupProximityLabel: '0.8 km away', postedAtLabel: '5 min ago',
  },
  {
    id: 'ro2',
    driver: drivers[1],
    vehicle: {
      make: 'Maruti', model: 'Swift Dzire', year: 2021, color: 'Midnight Black',
      registrationNumber: 'TS 07 ** 3421', fuelType: 'CNG', ac: true,
      rcVerified: true, insuranceVerified: true,
    },
    origin: 'Kondapur, Hyderabad', originShort: 'Kondapur',
    destination: 'HITEC City, Hyderabad', destinationShort: 'HITEC City',
    originCoordinates: { lat: 17.4615, lng: 78.3672 },
    destinationCoordinates: { lat: 17.4435, lng: 78.3772 },
    departureDateLabel: 'Tomorrow', departureTimeLabel: '08:30 AM',
    pricePerPerson: 90, distanceLabel: '5.2 km', durationLabel: '18 min',
    routeNote: 'via Jubilee Hills Rd', stops: [],
    preferences: { womenOnly: true, acAvailable: true, petsOk: false, luggageSpace: false, silentRide: true, autoConfirm: false },
    reviewCount: 89, matchScore: 'good', pickupProximityLabel: '1.2 km away', postedAtLabel: '22 min ago',
  },
  {
    id: 'ro3',
    driver: drivers[2],
    vehicle: {
      make: 'Toyota', model: 'Innova Crysta', year: 2023, color: 'Silver Grey',
      registrationNumber: 'TS 05 ** 9012', fuelType: 'Diesel', ac: true,
      rcVerified: true, insuranceVerified: true,
      photoUrl: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=200&fit=crop&auto=format',
    },
    origin: 'Secunderabad, Hyderabad', originShort: 'Secunderabad',
    destination: 'HITEC City, Hyderabad', destinationShort: 'HITEC City',
    originCoordinates: { lat: 17.4399, lng: 78.4983 },
    destinationCoordinates: { lat: 17.4435, lng: 78.3772 },
    departureDateLabel: 'Tomorrow', departureTimeLabel: '07:45 AM',
    pricePerPerson: 200, distanceLabel: '18 km', durationLabel: '45 min',
    routeNote: 'via Inner Ring Road', stops: ['Ameerpet'],
    preferences: { womenOnly: false, acAvailable: true, petsOk: true, luggageSpace: true, silentRide: false, autoConfirm: true },
    reviewCount: 215, matchScore: 'ok', pickupProximityLabel: '2.1 km away', postedAtLabel: '1h ago',
  },
]

export interface RideRequestView {
  id: string
  passenger: { id: string; name: string; avatarUrl: string; rating: number; verified: boolean; totalTrips: number }
  origin: string
  destination: string
  preferredDateLabel: string
  preferredTimeLabel: string
  distanceFromRouteLabel: string
  notes?: string
  matchScore: 'great' | 'good' | 'ok'
  postedAtLabel: string
}

// Passenger-posted RideRequests, shown alongside RideOffers in discovery
// feeds (Home's Latest Rides, Discover's Requests tab).
export const rideRequests: RideRequestView[] = [
  {
    id: 'rr1',
    passenger: { id: 'p1', name: 'Sneha Reddy', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&auto=format', rating: 4.8, verified: true, totalTrips: 23 },
    origin: 'Madhapur', destination: 'Gachibowli', preferredDateLabel: 'Tomorrow', preferredTimeLabel: '08:00 - 09:00 AM',
    distanceFromRouteLabel: '0.6 km from route', notes: 'Pickup near Cyber Towers gate.',
    matchScore: 'great', postedAtLabel: '12 min ago',
  },
  {
    id: 'rr2',
    passenger: { id: 'p2', name: 'Aditya Kumar', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&auto=format', rating: 4.6, verified: true, totalTrips: 41 },
    origin: 'Kondapur', destination: 'HITEC City', preferredDateLabel: 'Tomorrow', preferredTimeLabel: '08:30 - 09:30 AM',
    distanceFromRouteLabel: '1.1 km from route',
    matchScore: 'good', postedAtLabel: '40 min ago',
  },
  {
    id: 'rr3',
    passenger: { id: 'p3', name: 'Anjali Nair', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&auto=format', rating: 4.9, verified: true, totalTrips: 87 },
    origin: 'Jubilee Hills', destination: 'Financial District', preferredDateLabel: 'Tomorrow', preferredTimeLabel: '09:00 AM',
    distanceFromRouteLabel: '1.8 km from route', notes: 'Small bag only, no fragrance please.',
    matchScore: 'ok', postedAtLabel: '2h ago',
  },
]

export interface LocationSuggestion {
  name: string
  subtitle: string
}

export const hyderabadLocations: LocationSuggestion[] = [
  { name: 'Madhapur', subtitle: 'Hyderabad' },
  { name: 'HITEC City', subtitle: 'Hyderabad' },
  { name: 'Gachibowli', subtitle: 'Hyderabad' },
  { name: 'Gachibowli Stadium', subtitle: 'Gachibowli, Hyderabad' },
  { name: 'Gachibowli X Road', subtitle: 'Gachibowli, Hyderabad' },
  { name: 'Kondapur', subtitle: 'Hyderabad' },
  { name: 'Financial District', subtitle: 'Nanakramguda, Hyderabad' },
  { name: 'Jubilee Hills', subtitle: 'Hyderabad' },
  { name: 'Banjara Hills', subtitle: 'Hyderabad' },
  { name: 'Secunderabad', subtitle: 'Hyderabad' },
  { name: 'Kukatpally', subtitle: 'Hyderabad' },
  { name: 'Miyapur', subtitle: 'Hyderabad' },
  { name: 'Ameerpet', subtitle: 'Hyderabad' },
  { name: 'LB Nagar', subtitle: 'Hyderabad' },
  { name: 'Uppal', subtitle: 'Hyderabad' },
  { name: 'Shamshabad Airport', subtitle: 'Rajiv Gandhi International Airport' },
  { name: 'Warangal', subtitle: 'Telangana' },
  { name: 'Vijayawada', subtitle: 'Andhra Pradesh' },
]

export const popularLocations: LocationSuggestion[] = hyderabadLocations.filter(
  (l) => !['Gachibowli Stadium', 'Gachibowli X Road', 'Warangal', 'Vijayawada'].includes(l.name),
)

export const popularRoutes: { from: string; to: string }[] = [
  { from: 'Madhapur', to: 'Gachibowli' },
  { from: 'Kondapur', to: 'HITEC City' },
  { from: 'Jubilee Hills', to: 'Financial District' },
  { from: 'Secunderabad', to: 'HITEC City' },
  { from: 'Hyderabad', to: 'Warangal' },
]

export const savedLocations: { label: string; name: string; subtitle: string }[] = [
  { label: 'Home', name: 'Kondapur', subtitle: 'Saved address' },
  { label: 'Work', name: 'HITEC City', subtitle: 'Saved address' },
]

export const recentSearches: { from: string; to: string; date: string }[] = [
  { from: 'Madhapur', to: 'Gachibowli', date: 'Yesterday' },
  { from: 'Kondapur', to: 'HITEC City', date: '2 days ago' },
]

export interface ChatContactView {
  id: string
  name: string
  avatarUrl: string
  lastMessage: string
  lastTimeLabel: string
  unread: number
  online: boolean
  rideInfo?: string
}

export const chatContacts: ChatContactView[] = [
  {
    id: 'c1', name: 'Arjun Reddy',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format',
    lastMessage: 'I will pick you up from the main gate. See you tomorrow!',
    lastTimeLabel: '2m ago', unread: 2, online: true,
    rideInfo: 'Madhapur -> Gachibowli - Tomorrow 8:00 AM',
  },
  {
    id: 'c2', name: 'Priya Lakshmi',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108755-2616b612b1b5?w=200&h=200&fit=crop&auto=format',
    lastMessage: 'Sure, I will be at Kondapur signal at 8:25 AM',
    lastTimeLabel: '1h ago', unread: 0, online: false,
    rideInfo: 'Kondapur -> HITEC City - Tomorrow 8:30 AM',
  },
  {
    id: 'c3', name: 'ShareRide Support', avatarUrl: '',
    lastMessage: 'Your account has been verified successfully!',
    lastTimeLabel: '2d ago', unread: 0, online: true,
  },
]

export interface ChatMessageView {
  id: string
  senderId: string
  text: string
  timeLabel: string
  read: boolean
}

export const chatMessages: Record<string, ChatMessageView[]> = {
  c1: [
    { id: 'm1', senderId: 'd1', text: 'Hi! I saw your ride request for Madhapur to Gachibowli tomorrow.', timeLabel: '10:30 AM', read: true },
    { id: 'm2', senderId: 'me', text: 'Hi Arjun! Yes, I need to reach Gachibowli by 8:30 AM.', timeLabel: '10:32 AM', read: true },
    { id: 'm3', senderId: 'd1', text: 'Great! I am heading that way too. I can confirm the match. Are you okay with the Hitech City road route?', timeLabel: '10:33 AM', read: true },
    { id: 'm4', senderId: 'me', text: 'Perfect, that works for me. Where is the pickup point?', timeLabel: '10:35 AM', read: true },
    { id: 'm5', senderId: 'd1', text: 'Exactly at 8:00 AM near Madhapur metro exit. Please be there 5 minutes early. See you tomorrow!', timeLabel: '10:36 AM', read: false },
  ],
  c2: [
    { id: 'm6', senderId: 'd2', text: 'Sure, I will be at Kondapur signal at 8:25 AM', timeLabel: '9:10 AM', read: true },
  ],
  c3: [
    { id: 'm7', senderId: 'd3', text: 'Your account has been verified successfully!', timeLabel: '2d ago', read: true },
  ],
}

export type TripStatus = 'upcoming' | 'completed' | 'cancelled'

export interface TripView {
  id: string
  type: 'requested' | 'offered'
  rideOffer: RideOfferView
  status: TripStatus
  matchedOnLabel: string
  amount: number
}

export const trips: TripView[] = [
  { id: 't1', type: 'requested', rideOffer: rideOffers[0], status: 'upcoming', matchedOnLabel: '7 Aug 2026', amount: 120 },
  { id: 't2', type: 'requested', rideOffer: { ...rideOffers[1], departureDateLabel: 'Mon, 28 Jul' }, status: 'completed', matchedOnLabel: '25 Jul 2026', amount: 90 },
  { id: 't3', type: 'offered', rideOffer: { ...rideOffers[2], departureDateLabel: 'Fri, 1 Aug' }, status: 'completed', matchedOnLabel: '30 Jul 2026', amount: 200 },
]

export interface NotificationView {
  id: string
  type: 'ride' | 'message' | 'match' | 'system' | 'promo'
  title: string
  body: string
  timeLabel: string
  read: boolean
  avatarUrl?: string
}

export const notifications: NotificationView[] = [
  {
    id: 'n1', type: 'match', title: 'Ride Confirmed!',
    body: 'Arjun Reddy accepted your ride request for Madhapur -> Gachibowli tomorrow at 8:00 AM.',
    timeLabel: '2m ago', read: false,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format',
  },
  {
    id: 'n2', type: 'message', title: 'New message from Arjun',
    body: 'I will pick you up near Madhapur metro exit. See you tomorrow!',
    timeLabel: '5m ago', read: false,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format',
  },
  {
    id: 'n3', type: 'ride', title: '4 new route matches near you',
    body: 'Madhapur -> Gachibowli rides available tomorrow morning. Best match: 0.8 km pickup.',
    timeLabel: '1h ago', read: false,
  },
  {
    id: 'n4', type: 'system', title: 'Verification Complete',
    body: 'Your driving license has been verified. You can now offer rides on ShareRide!',
    timeLabel: '2h ago', read: true,
  },
  {
    id: 'n5', type: 'promo', title: 'First ride 20% off',
    body: 'Use code SHARE20 on your next ride request. Valid till 15 Aug.',
    timeLabel: '1d ago', read: true,
  },
]

export interface ReviewView {
  id: string
  authorName: string
  authorAvatarUrl: string
  rating: number
  comment: string
  dateLabel: string
  routeLabel?: string
}

export const reviews: ReviewView[] = [
  {
    id: 'rv1', authorName: 'Sneha Patel',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&auto=format',
    rating: 5, comment: 'Arjun was incredibly punctual and the car was spotless. Best match I have had on this platform!',
    dateLabel: '28 Jul 2026', routeLabel: 'Madhapur -> Gachibowli',
  },
  {
    id: 'rv2', authorName: 'Karan Malhotra',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&auto=format',
    rating: 5, comment: 'Great music, smooth drive, and perfect communication beforehand. Highly recommended!',
    dateLabel: '21 Jul 2026', routeLabel: 'Kondapur -> HITEC City',
  },
  {
    id: 'rv3', authorName: 'Ananya Rao',
    authorAvatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&auto=format',
    rating: 4, comment: 'Good driver, pleasant conversation. Left a few minutes late but overall a great experience.',
    dateLabel: '15 Jul 2026', routeLabel: 'Jubilee Hills -> Financial District',
  },
]
