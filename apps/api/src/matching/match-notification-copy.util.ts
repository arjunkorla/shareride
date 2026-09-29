export type MatchNotificationEvent = 'requested' | 'accepted' | 'declined'

export interface MatchNotificationCopy {
  title: string
  body: string
}

// Pure copy-building, extracted out of matching.service.ts so it's
// unit-testable without a database — request/offer/match language only,
// per docs/current-architecture.md §5 (no "booking"/seat wording).
export function buildMatchNotificationCopy(event: MatchNotificationEvent, destination: string): MatchNotificationCopy {
  switch (event) {
    case 'requested':
      return {
        title: 'New ride request',
        body: `A passenger wants to join your ride to ${destination}.`,
      }
    case 'accepted':
      return {
        title: 'Ride Confirmed!',
        body: `Your ride to ${destination} has been confirmed.`,
      }
    case 'declined':
      return {
        title: 'Request declined',
        body: `Your ride request to ${destination} was declined.`,
      }
  }
}
