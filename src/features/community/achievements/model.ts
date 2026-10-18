import { selectChallengeProgress } from '../challenges/progress'
import type { CommunityState, Post } from '../types'
import { badgeCatalog, badgeRequestLimits, findBadge } from './catalog'
import { publicGrantExamples } from './seeds'
import type { BadgeGrant, BadgeRequest, PublicRecognition } from './types'

type BadgeState = Pick<CommunityState, 'attempts' | 'challengeId' | 'badgeRequests'>

export function selectBadgeGrants(state: BadgeState, memberId = 'alex'): BadgeGrant[] {
  if (memberId !== 'alex') return publicGrantExamples.filter((example) => example.grant.memberId === memberId).map((example) => example.grant)
  const automatic: BadgeGrant[] = selectChallengeProgress(state).badges.filter((badge) => badge.earned).map((badge) => ({ id: `grant:alex:${badge.id}`, badgeId: badge.id, memberId, source: 'automatic', condition: badge.description }))
  const reviewed: BadgeGrant[] = state.badgeRequests.flatMap((request) => request.memberId === memberId && request.status === 'approved' && findBadge(request.badgeId)?.mode === 'review'
    ? [{ id: `grant:${memberId}:${request.badgeId}`, badgeId: request.badgeId, memberId, source: 'cai', condition: 'CAI aprobó esta solicitud en la demostración. Declaración ficticia; no es una verificación real.', awardedAt: request.reviewedAt, requestId: request.id }] : [])
  return [...new Map([...automatic, ...reviewed].map((grant) => [grant.badgeId, grant])).values()]
}

export function badgeRequestBlock(state: BadgeState, badgeId: string): string | undefined {
  const badge = findBadge(badgeId)
  if (!badge || badge.mode !== 'review' || badge.availability !== 'active') return 'Elige una insignia disponible que admita solicitud a CAI.'
  if (selectBadgeGrants(state).some((grant) => grant.badgeId === badgeId)) return 'Esta insignia ya está conseguida. No necesitas volver a solicitarla.'
  if (state.badgeRequests.some((request) => request.memberId === 'alex' && request.badgeId === badgeId && request.status === 'pending')) return 'Esta insignia ya tiene una solicitud pendiente.'
  return undefined
}

export function validateBadgeRequest(state: BadgeState, badgeId: string, description: string) {
  const value = description.trim()
  return { badgeId: badgeRequestBlock(state, badgeId), description: value.length < badgeRequestLimits.min ? `Escribe una declaración ficticia de al menos ${badgeRequestLimits.min} caracteres.` : value.length > badgeRequestLimits.max ? `Usa como máximo ${badgeRequestLimits.max} caracteres.` : undefined }
}

export function requestBadge(state: CommunityState, action: { id: string; badgeId: string; description: string }, createdAt: string): CommunityState {
  const errors = validateBadgeRequest(state, action.badgeId, action.description)
  if (state.mode !== 'student' || !action.id.trim() || action.id.length > 100 || state.badgeRequests.some((request) => request.id === action.id) || errors.badgeId || errors.description) return state
  const request: BadgeRequest = { id: action.id, badgeId: action.badgeId, memberId: 'alex', description: action.description.trim(), status: 'pending', createdAt }
  return { ...state, badgeRequests: [...state.badgeRequests, request], sequence: state.sequence + 1, notice: 'Solicitud ficticia pendiente. No concede una insignia ni crea una publicación.' }
}

export function reviewBadgeRequest(state: CommunityState, action: { requestId: string; decision: 'approved' | 'rejected'; reason: string }, reviewedAt: string): CommunityState {
  const request = state.badgeRequests.find((item) => item.id === action.requestId && item.status === 'pending')
  const reason = action.reason.trim()
  if (state.mode !== 'moderator' || !request || reason.length < 8 || reason.length > badgeRequestLimits.reasonMax) return state
  const badge = findBadge(request.badgeId)
  if (!badge || badge.mode !== 'review' || badge.availability !== 'active') return state
  if (action.decision !== 'approved' && action.decision !== 'rejected') return state
  if (action.decision === 'approved' && selectBadgeGrants(state, request.memberId).some((grant) => grant.badgeId === request.badgeId)) return state
  const reviewed: BadgeRequest = { ...request, status: action.decision, reviewedAt, reviewedBy: 'cai-demo', decisionReason: reason }
  return { ...state, badgeRequests: state.badgeRequests.map((item) => item.id === request.id ? reviewed : item), sequence: state.sequence + 1, notice: action.decision === 'approved' ? 'Solicitud aprobada en la demo. Insignia personal conseguida; no se ha publicado una historia.' : 'Solicitud rechazada en la demo. Puedes leer el motivo y enviar otra; conservamos el historial.' }
}

export function selectAchievementStories(posts: readonly Post[]) {
  return posts.filter((post) => post.status === 'approved' && post.category === 'achievement').sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id))
}

export function selectPublicRecognitions(state: CommunityState): PublicRecognition[] {
  const examples: PublicRecognition[] = publicGrantExamples.flatMap((example) => {
    const post = state.posts.find((item) => item.id === example.postId && item.authorId === example.grant.memberId && item.status === 'approved')
    const badge = findBadge(example.grant.badgeId)
    return post && badge ? [{ grant: example.grant, badge, post, reason: example.reason, sharedAt: example.grant.awardedAt ?? post.createdAt }] : []
  })
  const grants = selectBadgeGrants(state)
  const shared: PublicRecognition[] = state.posts.flatMap((post) => {
    const grant = grants.find((item) => item.badgeId === post.badgeId)
    const badge = post.badgeId ? findBadge(post.badgeId) : undefined
    return post.status === 'approved' && post.category === 'achievement' && post.authorId === 'alex' && grant && badge ? [{ grant, badge, post, reason: post.title, sharedAt: post.createdAt }] : []
  })
  const sorted = [...examples, ...shared].sort((a, b) => Date.parse(b.sharedAt) - Date.parse(a.sharedAt) || a.grant.id.localeCompare(b.grant.id))
  const unique = new Map<string, PublicRecognition>()
  for (const item of sorted) { const key = `${item.grant.memberId}:${item.grant.badgeId}`; if (!unique.has(key)) unique.set(key, item) }
  return [...unique.values()]
}
export const personalBadgeCatalog = badgeCatalog.filter((badge) => badge.availability === 'active')
