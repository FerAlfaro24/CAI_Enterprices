import { useId, useState } from 'react'
import { useCommunity } from '../context'
import { formatPostDate } from '../model'
import { CommunityIcon } from '../components/ui'
import { useCommunityDialog } from '../useCommunityDialog'
import { findBadge } from './catalog'
import type { BadgeRequest } from './types'
import s from './achievements.module.css'

const labels = { pending: 'Pendiente', approved: 'Aprobada', rejected: 'Rechazada' }
function RequestDetail({ request, onClose }: { request: BadgeRequest; onClose: () => void }) {
  const dialog = useCommunityDialog()
  const id = useId()
  return <dialog ref={dialog} className={s.dialog} aria-labelledby={id} onCancel={(event) => { event.preventDefault(); onClose() }}><header className={s.dialogHeading}><h2 id={id}>Tu solicitud: {findBadge(request.badgeId)?.title}</h2><button type="button" className={s.iconButton} aria-label="Cerrar detalles de solicitud" onClick={onClose}><CommunityIcon name="close" /></button></header><span className={`${s.status} ${s[request.status]}`}>{labels[request.status]}</span><p className={s.dialogIntro}>Declaración ficticia para revisión; no es prueba verificada ni una historia pública.</p><blockquote className={s.statement}>{request.description}</blockquote><p className={s.smallText}>Enviada: {formatPostDate(request.createdAt)} · Escenario ficticio</p>{request.status !== 'pending' && <div className={s.decision}><strong>Decisión de CAI · Demo</strong><p>{request.decisionReason}</p><small>{formatPostDate(request.reviewedAt)}</small></div>}</dialog>
}

export function BadgeRequestHistory() {
  const { state } = useCommunity()
  const [selected, setSelected] = useState<string | null>(null)
  const requests = state.badgeRequests.filter((request) => request.memberId === 'alex').reverse()
  const current = requests.find((request) => request.id === selected)
  return <section className={s.history} aria-labelledby="badge-request-history-title" id="badge-request-history" tabIndex={-1}><h2 id="badge-request-history-title"><span aria-hidden="true">⌛</span> Tus solicitudes</h2><p className={s.smallText}>Tu declaración queda en esta demostración. No aparece automáticamente en La comunidad.</p>{requests.length ? requests.map((request) => {
    const badge = findBadge(request.badgeId)!
    return <article key={request.id} className={s.requestRow} aria-label={`Solicitud de ${badge.title}: ${labels[request.status]}`}><span className={`${s.badgeIcon} ${s[badge.tone]}`} aria-hidden="true">{badge.symbol}</span><div><h3>{badge.title}</h3><p className={s.requestExcerpt}>{request.description}</p><small>{formatPostDate(request.createdAt)} · Declaración ficticia</small></div><div className={s.requestState}><span className={`${s.status} ${s[request.status]}`}>{labels[request.status]}</span><button type="button" className={s.textButton} onClick={() => setSelected(request.id)} aria-haspopup="dialog">Consultar solicitud</button></div></article>
  }) : <p className={s.emptyHistory}>Todavía no enviaste solicitudes. Tu próxima aventura puede empezar arriba.</p>}{current && <RequestDetail request={current} onClose={() => setSelected(null)} />}</section>
}
