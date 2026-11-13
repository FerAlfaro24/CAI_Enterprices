import { badgeDefinitions } from '../../../../shared/badges'
import { selectChallengeProgress } from '../challenges/progress'
import type { BadgeDefinition, BadgeTone } from './types'

const automatic = selectChallengeProgress({ attempts: {}, challengeId: 'day-1' }).badges
const tones: BadgeTone[] = ['blue', 'yellow', 'purple']
/** Retos owns automatic definitions and rules; this catalogue adds presentation. */
export const badgeCatalog: readonly BadgeDefinition[] = [
  ...automatic.map((badge, index): BadgeDefinition => ({ id: badge.id, title: badge.title, description: badge.description, symbol: badge.symbol, tone: tones[index]!, category: 'retos', mode: 'automatic', availability: 'active', automaticRule: badge.id })),
  ...badgeDefinitions.filter(badge=>badge.mode==='review'),
]
export const requestableBadges = badgeCatalog.filter((badge) => badge.mode === 'review' && badge.availability === 'active')
export const findBadge = (id: string) => badgeCatalog.find((badge) => badge.id === id)
export const badgeRequestLimits = { min: 20, max: 600, reasonMax: 280 } as const
