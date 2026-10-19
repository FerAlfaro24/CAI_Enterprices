import { useState } from 'react'
import { useCommunity } from '../context'
import { selectChallengeProgress } from '../challenges/progress'
import { demoMember } from '../data/members'
import { MemberLink } from '../components/MemberLink'
import { CommunityIcon } from '../components/ui'
import { MotionFeedback } from '../components/CommunityMotion'
import { findBadge } from './catalog'
import { selectBadgeGrants } from './model'
import { BadgeRequestForm } from './BadgeRequestForm'
import { BadgeCollection, BadgeCatalog } from './BadgeCollection'
import { BadgeRequestHistory } from './BadgeRequestHistory'
import { BadgeReviewPanel } from './BadgeReviewPanel'
import { BadgeArtwork } from './BadgeArtwork'
import { BadgeUnlockNotice } from './BadgeUnlockNotice'
import type { BadgeGrant } from './types'
import s from './achievements.module.css'

export function MyAchievements({ onRequest, onShare }: { onRequest: (id: string) => void; onShare: (grant: BadgeGrant) => void }) {
  const { state } = useCommunity()
  const [selectedBadge, setSelectedBadge] = useState('movie-explorer')
  const badge = findBadge(selectedBadge)!
  const grants = selectBadgeGrants(state)
  const progress = selectChallengeProgress(state)
  const pending = state.badgeRequests.filter((request) => request.memberId === 'alex' && request.status === 'pending').length
  const selectedRequest = [...state.badgeRequests].reverse().find((request) => request.memberId === 'alex' && request.badgeId === selectedBadge)
  const alreadyEarned = grants.some((grant) => grant.badgeId === selectedBadge)
  const stats = [{ icon: 'award', value: grants.length, label: 'Insignias conseguidas', tone: 'blue' }, { icon: 'comment', value: pending, label: 'Solicitudes pendientes', tone: 'peach' }, { icon: 'spark', value: grants.filter((grant) => grant.source === 'automatic').length, label: 'Automáticas de Retos', tone: 'mint' }, { icon: 'book', value: `${progress.currentStreak} ${progress.currentStreak === 1 ? 'día' : 'días'}`, label: 'Consecutivos al día seleccionado', tone: 'yellow' }] as const
  return <>
    <section className={s.stats} aria-label="Resumen personal de Alex">{stats.map((stat) => <div key={stat.label}><span className={`${s.badgeIcon} ${s[stat.tone]}`}><CommunityIcon name={stat.icon} size={23} /></span><div><strong>{stat.value}</strong><span>{stat.label}</span></div></div>)}</section>
    <div className={s.progressLine}><MemberLink member={demoMember} /> · <span>{progress.points} puntos de Retos</span> · <span>{progress.answeredDays} días respondidos</span> · <span>Mejor serie: {progress.longestStreak}</span></div>
    <BadgeCollection onShare={onShare} />
    <div className={s.requestGrid}><section className={s.requestCard} aria-labelledby="request-adventure-title"><span className={s.sectionKicker}>FUERA DE LA PANTALLA, TAMBIÉN APRENDES</span><h2 id="request-adventure-title">¿Conseguiste algo fuera de la plataforma?</h2><p>Selecciona una insignia y cuéntale a CAI cómo la conseguiste.</p><BadgeRequestForm badgeId={selectedBadge} onBadgeChange={setSelectedBadge} /></section><aside className={s.requestPreview} aria-label="Insignia para solicitar"><span className={s.yellowTag}>✦ {alreadyEarned ? 'INSIGNIA CONSEGUIDA' : selectedRequest?.status === 'pending' ? 'SOLICITUD EN REVISIÓN' : 'INSIGNIA POR SOLICITAR'}</span><BadgeArtwork badgeId={badge.id} symbol={badge.symbol} className={s.previewIcon} /><h2>{badge.title}</h2><p>{badge.description}</p><MotionFeedback key={alreadyEarned ? "earned" : selectedRequest?.status ?? "available"} className={s.previewState}>{alreadyEarned ? '✓ Conseguida' : selectedRequest?.status === 'pending' ? 'Pendiente de revisión' : selectedRequest?.status === 'rejected' ? 'Puedes volver a solicitarla' : 'Disponible para solicitar'}</MotionFeedback></aside></div>
    <BadgeCatalog onRequest={onRequest} />
    <BadgeRequestHistory />
    <BadgeReviewPanel />
    <BadgeUnlockNotice />
  </>
}
