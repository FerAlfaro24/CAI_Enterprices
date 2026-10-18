import { challenges } from '../data/fixtures'
import type { CommunityState } from '../types'

export interface ChallengeBadge {
  id: 'first-answer' | 'three-consecutive' | 'five-days'
  title: string
  symbol: string
  description: string
  earned: boolean
  progress: number
  target: number
}

/** Read-only projections of attempts; no parallel points or badge-grant store. */
export function selectChallengeProgress(state: Pick<CommunityState, 'attempts' | 'challengeId'>) {
  const days = challenges.map((challenge) => ({ challenge, attempt: state.attempts[challenge.id] }))
  const answeredDays = days.filter((day) => day.attempt).length
  const points = days.reduce((sum, day) => sum + (day.attempt?.points ?? 0), 0)
  const selectedIndex = days.findIndex((day) => day.challenge.id === state.challengeId)
  // An unanswered selected day can continue yesterday's run. Future days do not count.
  const anchor = selectedIndex - (days[selectedIndex]?.attempt ? 0 : 1)
  let currentStreak = 0
  for (let index = anchor; index >= 0 && days[index]?.attempt; index -= 1) currentStreak += 1
  let run = 0
  let longestStreak = 0
  for (const day of days) {
    run = day.attempt ? run + 1 : 0
    longestStreak = Math.max(longestStreak, run)
  }
  const badges: ChallengeBadge[] = [
    { id: 'first-answer', title: 'Primera respuesta', symbol: '🎯', description: 'Comprueba una respuesta, aciertes o no.', earned: answeredDays >= 1, progress: Math.min(answeredDays, 1), target: 1 },
    { id: 'three-consecutive', title: '3 días seguidos', symbol: '🔥', description: 'Participa en tres días consecutivos de la demostración.', earned: longestStreak >= 3, progress: Math.min(longestStreak, 3), target: 3 },
    { id: 'five-days', title: 'En comunidad', symbol: '💙', description: 'Participa en los cinco retos compartidos de la demostración.', earned: answeredDays === days.length, progress: answeredDays, target: days.length },
  ]
  return { answeredDays, points, currentStreak, longestStreak, badges, totalDays: days.length }
}
