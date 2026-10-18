import { useState } from 'react'
import { useCommunity } from '../context'
import { CommunityIcon } from '../components/ui'
import { findBadge, badgeRequestLimits } from './catalog'
import type { BadgeRequest } from './types'
import s from './achievements.module.css'

function ReviewRow({ request }: { request: BadgeRequest }) {
  const { dispatch } = useCommunity()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const decide = (decision: 'approved' | 'rejected') => {
    const note = reason.trim() || (decision === 'approved' ? 'Reconocimiento concedido por CAI en esta simulación; no constituye una verificación real.' : 'Por ahora necesitamos una declaración más concreta. Puedes enviar una nueva solicitud ficticia.')
    if (note.length < 8) { setError('Escribe al menos 8 caracteres o deja la nota vacía para usar el motivo de muestra.'); return }
    dispatch({ type: 'reviewBadge', requestId: request.id, decision, reason: note })
    requestAnimationFrame(() => document.getElementById('badge-request-history')?.focus())
  }
  const badge = findBadge(request.badgeId)!
  return <article className={s.reviewRow} aria-label={`Revisar solicitud: ${badge.title}`}><h3>{badge.symbol} {badge.title} · Alex Demo</h3><p>{request.description}</p><small>Declaración del alumno ficticio, sin prueba verificada.</small><label>Nota de revisión (demo)<textarea rows={2} maxLength={badgeRequestLimits.reasonMax} value={reason} onChange={(event) => { setReason(event.target.value); setError('') }} placeholder="Opcional: usa un motivo de muestra al decidir." aria-invalid={Boolean(error)} /></label>{error && <p className={s.error} role="alert">{error}</p>}<div className={s.reviewActions}><button type="button" className={s.primaryButton} onClick={() => decide('approved')}>Aprobar solicitud</button><button type="button" className={s.secondaryButton} onClick={() => decide('rejected')}>Rechazar solicitud</button></div></article>
}
export function BadgeReviewPanel() {
  const { state } = useCommunity()
  if (state.mode !== 'moderator') return null
  const pending = state.badgeRequests.filter((request) => request.status === 'pending')
  return <section className={s.reviewPanel} aria-label="Revisión de insignias demo"><header><CommunityIcon name="shield" /><div><h2>Revisión de insignias · Solo demo</h2><p>{pending.length} solicitudes pendientes · Decisiones como CAI ficticio</p></div></header><p className={s.smallText}>Aprobar concede una insignia personal, sin publicar. Estos controles no son seguridad real ni el panel administrativo definitivo.</p>{pending.length ? pending.map((request) => <ReviewRow key={request.id} request={request} />) : <p className={s.emptyHistory}>No hay solicitudes pendientes de decisión.</p>}</section>
}
