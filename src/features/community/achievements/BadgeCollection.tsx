import { useState } from 'react'
import { MotionButton, MotionCard } from '../components/CommunityMotion'
import { BadgeArtwork } from './BadgeArtwork'
import { useCommunity } from '../context'
import { selectChallengeProgress } from '../challenges/progress'
import { formatPostDate } from '../model'
import { findBadge } from './catalog'
import { personalBadgeCatalog, selectBadgeGrants } from './model'
import type { BadgeGrant } from './types'
import s from './achievements.module.css'

export function BadgeCollection({ onShare }: { onShare: (grant: BadgeGrant) => void }) {
  const { state, dispatch } = useCommunity()
  const grants = selectBadgeGrants(state)
  return <section aria-labelledby="my-badges-title" id="my-badge-collection" tabIndex={-1} className={s.collection}><header className={s.sectionHeading}><div><h2 id="my-badges-title">Mis insignias</h2><p>Estas sí son tuyas: las ganaste participando o CAI te las otorgó.</p></div><span className={`${s.status} ${s.approved}`}>{grants.length} CONSEGUIDAS</span></header><div className={s.collectionGrid} role="region" aria-label="Insignias conseguidas de Alex">{grants.length ? grants.map((grant) => {
    const badge = findBadge(grant.badgeId)!
    return <MotionCard key={grant.id} className={s.earnedCard} data-badge-id={badge.id} aria-label={`${badge.title}, conseguida`}><BadgeArtwork badgeId={badge.id} symbol={badge.symbol} className={`${s.badgeIcon} ${s[badge.tone]}`} /><h3>{badge.title}</h3><p>{badge.description}</p><small>{grant.source === 'automatic' ? 'Automática · Durante esta visita' : `Otorgada por CAI · ${formatPostDate(grant.awardedAt!)}`}</small><span className={`${s.status} ${s.approved}`}>✓ Conseguida</span><details><summary>Condición satisfecha</summary><p>{grant.condition}</p></details><MotionButton type="button" className={s.shareButton} disabled={state.mode !== 'student'} onClick={() => onShare(grant)} aria-haspopup="dialog">Compartir mi logro <span aria-hidden="true">↗</span></MotionButton></MotionCard>
  }) : <div className={s.emptyCollection}><span aria-hidden="true">🎯</span><div><h3>Tu primer paso también merece celebrarse.</h3><p>Aún no tienes insignias conseguidas. Un intento en Retos puede empezar tu colección.</p></div><button type="button" className={s.primaryButton} onClick={() => dispatch({ type: 'section', section: 'challenges' })}>Ir a Retos →</button></div>}</div>{state.mode !== 'student' && grants.length > 0 && <p className={s.smallText}>Para compartir como Alex, cambia a Vista alumno en las opciones de demostración.</p>}</section>
}

export function BadgeCatalog({ onRequest }: { onRequest: (id: string) => void }) {
  const { state, dispatch } = useCommunity()
  const [expanded, setExpanded] = useState(false)
  const grants = selectBadgeGrants(state)
  const progress = selectChallengeProgress(state)
  const available = [...personalBadgeCatalog].sort((a, b) => Number(a.mode === 'automatic') - Number(b.mode === 'automatic')).filter((badge) => !grants.some((grant) => grant.badgeId === badge.id))
  const showing = expanded ? available : available.slice(0, 4)
  return <section aria-labelledby="badge-catalog-title" id="badge-catalog" tabIndex={-1} className={s.catalog}><header className={s.sectionHeading}><div><h2 id="badge-catalog-title">Tu próxima aventura empieza aquí</h2><p>Elige un desafío. No tienes que hacerlo perfecto.</p></div>{available.length > 4 && <button type="button" className={s.catalogToggle} aria-expanded={expanded} aria-controls="badge-catalog-grid" onClick={() => setExpanded(!expanded)}>{expanded ? 'Mostrar menos' : `Ver catálogo completo (${available.length})`} →</button>}</header><div className={s.catalogGrid} id="badge-catalog-grid">{showing.map((badge) => {
    const request = [...state.badgeRequests].reverse().find((item) => item.memberId === 'alex' && item.badgeId === badge.id)
    const pending = request?.status === 'pending'
    const automatic = progress.badges.find((item) => item.id === badge.automaticRule)
    return <MotionCard className={s.catalogCard} key={badge.id} data-badge-id={badge.id}><div className={s.catalogIdentity}><BadgeArtwork badgeId={badge.id} symbol={badge.symbol} className={`${s.badgeIcon} ${s[badge.tone]}`} /><div><h3>{badge.title}</h3><p>{badge.description}</p></div></div>{automatic ? <><span className={`${s.status} ${s.automatic}`}>Automática · {automatic.progress}/{automatic.target}</span><progress value={automatic.progress} max={automatic.target} aria-label={`Progreso de ${badge.title}`} /><button className={s.textButton} type="button" onClick={() => dispatch({ type: 'section', section: 'challenges' })}>Continuar en Retos →</button></> : pending ? <><span className={`${s.status} ${s.pending}`}>Pendiente de revisión</span><p className={s.smallText}>No está conseguida. Consulta Tus solicitudes.</p></> : <>{request?.status === 'rejected' && <span className={`${s.status} ${s.rejected}`}>Rechazada · Puedes volver a intentar</span>}<button className={s.primaryButton} type="button" disabled={state.mode !== 'student'} onClick={() => onRequest(badge.id)} aria-haspopup="dialog">Solicitar →</button><small>Con revisión de CAI</small></>}</MotionCard>
  })}</div>{!available.length && <p className={s.emptyHistory}>¡Completaste las insignias disponibles en esta demostración!</p>}</section>
}
