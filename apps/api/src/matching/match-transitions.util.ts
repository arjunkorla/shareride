import type { MatchStatus } from '@shareride/types'

// Pure guard predicates for the Match state machine (docs/migration-plan.md
// Phase 8): SUGGESTED (Phase 7's automatic output) -[passenger requests]->
// REQUESTED -[driver accepts]-> CONFIRMED (+ RideAgreement + Trip created
// atomically — see matching.service.ts) or -[driver declines]-> DECLINED.
// ACCEPTED exists in the schema's enum but is deliberately unused here:
// there's no separate mobile action between "driver accepts" and "the
// agreement exists," so recording an intermediate ACCEPTED state nobody
// can ever observe would just be dead history, not a real transition.
export function canRequest(status: MatchStatus): boolean {
  return status === 'SUGGESTED'
}

export function canAccept(status: MatchStatus): boolean {
  return status === 'REQUESTED'
}

export function canDecline(status: MatchStatus): boolean {
  return status === 'REQUESTED'
}
