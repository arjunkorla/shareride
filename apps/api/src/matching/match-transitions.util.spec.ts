import type { MatchStatus } from '@shareride/types'
import { canAccept, canDecline, canRequest } from './match-transitions.util'

const ALL_STATUSES: MatchStatus[] = ['SUGGESTED', 'REQUESTED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'CONFIRMED']

describe('canRequest', () => {
  it('only allows requesting a SUGGESTED match', () => {
    expect(canRequest('SUGGESTED')).toBe(true)
    for (const status of ALL_STATUSES.filter((s) => s !== 'SUGGESTED')) {
      expect(canRequest(status)).toBe(false)
    }
  })
})

describe('canAccept / canDecline', () => {
  it('only allow acting on a REQUESTED match', () => {
    expect(canAccept('REQUESTED')).toBe(true)
    expect(canDecline('REQUESTED')).toBe(true)
    for (const status of ALL_STATUSES.filter((s) => s !== 'REQUESTED')) {
      expect(canAccept(status)).toBe(false)
      expect(canDecline(status)).toBe(false)
    }
  })
})
