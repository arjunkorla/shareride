import type { Driver, Ride, ChatContact, ChatMessage, Trip, Notification, Review, RideRequestSummary, LocationSuggestion } from './types'

// The signed-in person viewing the app — distinct from any driver/reviewer
// in the mock data below. avatar is intentionally omitted here to exercise
// Avatar's fallback (initials) state; set a URL once real profile photos
// exist.
export const currentUser = {
  id: 'me',
  name: 'Priya Sharma',
  avatar: undefined as string | undefined,
}

export const drivers: Driver[] = [
  {
    id: 'd1',
    name: 'Arjun Reddy',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format',
    rating: 4.9,
    trips: 247,
    verified: true,
    yearsActive: 3,
    bio: 'Daily commuter between Madhapur and Gachibowli. I value punctuality and keep my car clean. Non-smoker. Happy to share good music on the way!',
    languages: ['Telugu', 'Hindi', 'English'],
    responseTime: '< 5 min',
    memberSince: 'Jan 2022'
  },
  {
    id: 'd2',
    name: 'Priya Lakshmi',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b1b5?w=100&h=100&fit=crop&auto=format',
    rating: 4.8,
    trips: 183,
    verified: true,
    yearsActive: 2,
    bio: 'Safe and reliable commuter. Women-preferred rides available. I prefer a quiet ride but happy to chat!',
    languages: ['Telugu', 'Hindi', 'English'],
    responseTime: '< 10 min',
    memberSince: 'Mar 2023'
  },
  {
    id: 'd3',
    name: 'Rohit Sharma',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&auto=format',
    rating: 4.7,
    trips: 512,
    verified: true,
    yearsActive: 5,
    bio: 'Experienced long-distance traveller. 5+ years on Hyderabad–Warangal and Hyderabad–Vijayawada routes. Punctual, polite, pet-friendly.',
    languages: ['Telugu', 'Hindi', 'English'],
    responseTime: '< 15 min',
    memberSince: 'Jun 2020'
  }
]

export const rides: Ride[] = [
  {
    id: 'r1',
    driver: drivers[0],
    from: 'Madhapur, Hyderabad',
    fromShort: 'Madhapur',
    to: 'Gachibowli, Hyderabad',
    toShort: 'Gachibowli',
    date: 'Tomorrow',
    time: '08:00 AM',
    price: 120,
    distance: '7.4 km',
    duration: '22 min',
    vehicle: {
      make: 'Honda',
      model: 'City ZX',
      year: 2022,
      color: 'Pearl White',
      regNumber: 'TS 09 ** 7849',
      fuelType: 'Petrol',
      ac: true,
      rcVerified: true,
      insuranceVerified: true,
      photo: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=200&fit=crop&auto=format'
    },
    amenities: ['AC', 'Music', 'USB Charging'],
    rating: 4.9,
    reviews: 127,
    instantBook: true,
    route: 'via Hitech City Rd',
    matchScore: 'great',
    pickupProximity: '0.8 km away',
    postedAt: '5 min ago'
  },
  {
    id: 'r2',
    driver: drivers[1],
    from: 'Kondapur, Hyderabad',
    fromShort: 'Kondapur',
    to: 'HITEC City, Hyderabad',
    toShort: 'HITEC City',
    date: 'Tomorrow',
    time: '08:30 AM',
    price: 90,
    distance: '5.2 km',
    duration: '18 min',
    vehicle: {
      make: 'Maruti',
      model: 'Swift Dzire',
      year: 2021,
      color: 'Midnight Black',
      regNumber: 'TS 07 ** 3421',
      fuelType: 'CNG',
      ac: true,
      rcVerified: true,
      insuranceVerified: true
    },
    amenities: ['AC', 'Women Preferred', 'Silent Ride'],
    rating: 4.8,
    reviews: 89,
    instantBook: false,
    route: 'via Jubilee Hills Rd',
    matchScore: 'good',
    pickupProximity: '1.2 km away',
    postedAt: '22 min ago'
  },
  {
    id: 'r3',
    driver: drivers[2],
    from: 'Secunderabad',
    fromShort: 'Secunderabad',
    to: 'HITEC City, Hyderabad',
    toShort: 'HITEC City',
    date: 'Tomorrow',
    time: '07:45 AM',
    price: 200,
    distance: '18 km',
    duration: '45 min',
    vehicle: {
      make: 'Toyota',
      model: 'Innova Crysta',
      year: 2023,
      color: 'Silver Grey',
      regNumber: 'TS 05 ** 9012',
      fuelType: 'Diesel',
      ac: true,
      rcVerified: true,
      insuranceVerified: true,
      photo: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400&h=200&fit=crop&auto=format'
    },
    amenities: ['AC', 'Luggage Space', 'USB Charging', 'Pets OK'],
    rating: 4.7,
    reviews: 215,
    instantBook: true,
    stops: ['Ameerpet'],
    route: 'via Inner Ring Road',
    matchScore: 'ok',
    pickupProximity: '2.1 km away',
    postedAt: '1h ago'
  }
]

// Passenger-posted ride requests — shown alongside offered `rides` in
// discovery feeds (Home's Latest Rides, Search's Requests tab).
export const passengerRequests: RideRequestSummary[] = [
  {
    id: 'pr1',
    passenger: { name: 'Sneha Reddy', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format', rating: 4.8, verified: true, trips: 23 },
    from: 'Madhapur', to: 'Gachibowli', date: 'Tomorrow', time: '08:00 – 09:00 AM',
    distance: '0.6 km from route', note: 'Pickup near Cyber Towers gate.',
    matchScore: 'great', postedAt: '12 min ago',
  },
  {
    id: 'pr2',
    passenger: { name: 'Aditya Kumar', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format', rating: 4.6, verified: true, trips: 41 },
    from: 'Kondapur', to: 'HITEC City', date: 'Tomorrow', time: '08:30 – 09:30 AM',
    distance: '1.1 km from route', note: '',
    matchScore: 'good', postedAt: '40 min ago',
  },
  {
    id: 'pr3',
    passenger: { name: 'Anjali Nair', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&auto=format', rating: 4.9, verified: true, trips: 87 },
    from: 'Jubilee Hills', to: 'Financial District', date: 'Tomorrow', time: '09:00 AM',
    distance: '1.8 km from route', note: 'Small bag only, no fragrance please.',
    matchScore: 'ok', postedAt: '2h ago',
  },
]

// Hyderabad-first location catalog used by the shared LocationPickerSheet
// (Home search card + Search screen Pickup/Drop-off) for suggestions,
// popular-location chips, and popular-route prefill. Landmark variants
// (e.g. "Gachibowli Stadium") exist so typing "Gachi" returns a short,
// realistic suggestion list rather than one entry.
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
  { name: 'Nalgonda', subtitle: 'Telangana' },
  { name: 'Karimnagar', subtitle: 'Telangana' },
]

export const popularLocations: LocationSuggestion[] = hyderabadLocations.filter(
  (l) => !['Gachibowli Stadium', 'Gachibowli X Road', 'Warangal', 'Vijayawada', 'Nalgonda', 'Karimnagar'].includes(l.name),
)

export const popularRoutes: { from: string; to: string }[] = [
  { from: 'Madhapur', to: 'Gachibowli' },
  { from: 'Kondapur', to: 'HITEC City' },
  { from: 'Jubilee Hills', to: 'Financial District' },
  { from: 'Secunderabad', to: 'HITEC City' },
  { from: 'Hyderabad', to: 'Warangal' },
  { from: 'Hyderabad', to: 'Vijayawada' },
]

export const savedLocations: { label: string; name: string; subtitle: string }[] = [
  { label: 'Home', name: 'Kondapur', subtitle: 'Saved address' },
  { label: 'Work', name: 'HITEC City', subtitle: 'Saved address' },
]

export const recentSearches: { from: string; to: string; date: string }[] = [
  { from: 'Madhapur', to: 'Gachibowli', date: 'Yesterday' },
  { from: 'Kondapur', to: 'HITEC City', date: '2 days ago' },
]

export const chatContacts: ChatContact[] = [
  {
    id: 'c1',
    name: 'Arjun Reddy',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format',
    lastMessage: 'I will pick you up from the main gate. See you tomorrow!',
    lastTime: '2m ago',
    unread: 2,
    online: true,
    rideInfo: 'Madhapur → Gachibowli · Tomorrow 8:00 AM'
  },
  {
    id: 'c2',
    name: 'Priya Lakshmi',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b1b5?w=100&h=100&fit=crop&auto=format',
    lastMessage: 'Sure, I will be at Kondapur signal at 8:25 AM',
    lastTime: '1h ago',
    unread: 0,
    online: false,
    rideInfo: 'Kondapur → HITEC City · Tomorrow 8:30 AM'
  },
  {
    id: 'c3',
    name: 'ShareRide Support',
    avatar: '',
    lastMessage: 'Your account has been verified successfully!',
    lastTime: '2d ago',
    unread: 0,
    online: true
  }
]

export const chatMessages: ChatMessage[] = [
  { id: 'm1', senderId: 'd1', text: 'Hi! I saw your ride request for Madhapur to Gachibowli tomorrow.', time: '10:30 AM', read: true, type: 'text' },
  { id: 'm2', senderId: 'me', text: 'Hi Arjun! Yes, I need to reach Gachibowli by 8:30 AM.', time: '10:32 AM', read: true, type: 'text' },
  { id: 'm3', senderId: 'd1', text: 'Great! I am heading that way too. I can confirm the match. Are you okay with the Hitech City road route?', time: '10:33 AM', read: true, type: 'text' },
  { id: 'm4', senderId: 'me', text: 'Perfect, that works for me. Where is the pickup point?', time: '10:35 AM', read: true, type: 'text' },
  { id: 'm5', senderId: 'd1', text: 'Exactly at 8:00 AM near Madhapur metro exit. Please be there 5 minutes early. See you tomorrow!', time: '10:36 AM', read: false, type: 'text' }
]

export const trips: Trip[] = [
  {
    id: 't1',
    type: 'requested',
    ride: rides[0],
    status: 'upcoming',
    bookingDate: '7 Aug 2026',
    amount: 120
  },
  {
    id: 't2',
    type: 'requested',
    ride: { ...rides[1], date: 'Mon, 28 Jul' } as Ride,
    status: 'completed',
    bookingDate: '25 Jul 2026',
    amount: 90
  },
  {
    id: 't3',
    type: 'offered',
    ride: { ...rides[2], date: 'Fri, 1 Aug' } as Ride,
    status: 'completed',
    bookingDate: '30 Jul 2026',
    amount: 200
  }
]

export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'booking',
    title: 'Ride Confirmed!',
    body: 'Arjun Reddy accepted your ride request for Madhapur → Gachibowli tomorrow at 8:00 AM.',
    time: '2m ago',
    read: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format'
  },
  {
    id: 'n2',
    type: 'message',
    title: 'New message from Arjun',
    body: 'I will pick you up near Madhapur metro exit. See you tomorrow!',
    time: '5m ago',
    read: false,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format'
  },
  {
    id: 'n3',
    type: 'ride',
    title: '4 new route matches near you',
    body: 'Madhapur → Gachibowli rides available tomorrow morning. Best match: 0.8 km pickup.',
    time: '1h ago',
    read: false
  },
  {
    id: 'n4',
    type: 'system',
    title: 'Verification Complete',
    body: 'Your driving license has been verified. You can now offer rides on ShareRide!',
    time: '2h ago',
    read: true
  },
  {
    id: 'n5',
    type: 'promo',
    title: '🎉 First ride 20% off',
    body: 'Use code SHARE20 on your next ride request. Valid till 15 Aug.',
    time: '1d ago',
    read: true
  }
]

export const reviews: Review[] = [
  {
    id: 'rv1',
    author: 'Sneha Patel',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&auto=format',
    rating: 5,
    comment: 'Arjun was incredibly punctual and the car was spotless. Best match I have had on this platform!',
    date: '28 Jul 2026',
    rideRoute: 'Madhapur → Gachibowli'
  },
  {
    id: 'rv2',
    author: 'Karan Malhotra',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&auto=format',
    rating: 5,
    comment: 'Great music, smooth drive, and perfect communication beforehand. Highly recommended!',
    date: '21 Jul 2026',
    rideRoute: 'Kondapur → HITEC City'
  },
  {
    id: 'rv3',
    author: 'Ananya Rao',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&auto=format',
    rating: 4,
    comment: 'Good driver, pleasant conversation. Left a few minutes late but overall a great experience.',
    date: '15 Jul 2026',
    rideRoute: 'Jubilee Hills → Financial District'
  }
]
