// Controlled search state shared by Home and Discover — mirrors
// src/types.ts's SearchQuery so both screens read/write the same shape via
// Zustand instead of App.tsx prop-drilling (there's no single root
// component to lift state into on Expo Router's file-based routes).
export interface SearchQuery {
  pickup: string
  pickupSubtitle: string
  dropoff: string
  dropoffSubtitle: string
  date: string
  timeLabel: string
}

export const emptySearchQuery: SearchQuery = {
  pickup: '',
  pickupSubtitle: '',
  dropoff: '',
  dropoffSubtitle: '',
  date: 'Today',
  timeLabel: 'Any Time',
}
