import type { ChallengeBadge } from '../challenges/progress'
import type { Post } from '../types'

export type BadgeTone = 'blue' | 'yellow' | 'mint' | 'purple' | 'peach'
export interface BadgeDefinition {
  id: string
  title: string
  description: string
  symbol: string
  tone: BadgeTone
  category: 'retos' | 'aventuras' | 'comunidad'
  mode: 'automatic' | 'review'
  availability: 'active' | 'institutional'
  automaticRule?: ChallengeBadge['id']
}
interface RequestBase { id: string; badgeId: string; memberId: string; description: string; createdAt: string }
export type BadgeRequest = RequestBase & (
  | { status: 'pending' }
  | { status: 'approved' | 'rejected'; reviewedAt: string; reviewedBy: 'cai-demo'; decisionReason: string }
)
/** Read-only receipt, distinct from a definition and a request. */
export interface BadgeGrant {
  id: string
  badgeId: string
  memberId: string
  source: 'automatic' | 'cai'
  condition: string
  awardedAt?: string
  requestId?: string
}
export interface PublicRecognition { grant: BadgeGrant; badge: BadgeDefinition; post: Post; reason: string; sharedAt: string }
