import { useEffect, useRef, useState } from 'react'
import { publicationCategories } from '../../../server/contracts'
import { rejectReasons } from '../admin/data/mockData'
import { Avatar, Icon } from '../admin/components/ui'
import type { PublicationDecision, ReviewPost } from '../local-access/api'
import { PublicationStatusLabel } from './PublicationCard'
import s from '../admin/admin.module.css'
import p from './publications.module.css'

export function PublicationReviewDialog({ post, busy, error, onDecide, onClose }: {
  post: ReviewPost; busy: boolean; error: string; onClose: () => void
  onDecide: (decision: PublicationDecision, reason?: string, confirmed?: boolean) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  useEffect(() => { ref.current?.showModal() }, [])
  return <dialog ref={ref} className={`${s.dialog} ${s['local-dialog']}`} aria-labelledby="publication-review-title" onClose={onClose} onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <div className={s['dialog-head']}>
      <Avatar name={post.studentName} />
      <div><h2 id="publication-review-title">{post.title}</h2><p>{post.studentName} · {post.studentId}</p></div>
      <button type="button" className={s['icon-btn']} disabled={busy} onClick={onClose} aria-label="Cerrar revisión"><Icon name="close" /></button>
    </div>
    <div className={s['dialog-body']}>
      <div className={p.meta}><PublicationStatusLabel status={post.status} /><span>{publicationCategories[post.category]}</span>{post.authorIsMinor && <span>Autor menor de edad</span>}</div>
      <dl className={s.details}><dt>Programa</dt><dd>{post.program}</dd><dt>Grupo</dt><dd>{post.group}</dd><dt>Nombre visible</dt><dd>{post.author.displayName}</dd></dl>
      <p className={p.body}>{post.body}</p>
      {post.status === 'pendiente' && <>
        <p className={s.alert}>Al publicarla, solo la verá su programa y grupo. Revisa que el contenido sea adecuado y no incluya datos personales de otras personas.</p>
        {!post.authorActive && <p className={s.alert}>El autor no tiene acceso activo a este grupo. Podrás publicar cuando CAI regularice su acceso.</p>}
        <label className={s.confirm}><input type="checkbox" checked={confirmed} disabled={busy} onChange={(event) => setConfirmed(event.target.checked)} />Revisé el contenido y la privacidad; se puede publicar.</label>
        <div className={p.reasonLabel}><label htmlFor="publication-reason">Motivo si la rechazas</label>
          <select className={p.reason} id="publication-reason" value={reason} disabled={busy} onChange={(event) => { setReason(event.target.value); setReasonError('') }} aria-invalid={Boolean(reasonError)} aria-describedby={reasonError ? 'publication-reason-error' : undefined}>
            <option value="">Selecciona un motivo</option>{rejectReasons.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        {reasonError && <p role="alert" id="publication-reason-error">{reasonError}</p>}
      </>}
      {post.reason && <p className={s.alert}>Motivo: {post.reason}</p>}
      {post.status === 'publicada' && <p className={s.alert}>Devolverla a revisión la ocultará del grupo hasta que vuelvas a publicarla.</p>}
      {post.status === 'retirada' && <p className={s.alert}>El alumno decidió retirarla. Se conserva el registro, pero no puedes volver a publicarla.</p>}
      {error && <p className={s.alert} role="alert">{error}</p>}
    </div>
    <div className={s['dialog-foot']} aria-busy={busy}>
      {post.status === 'pendiente' ? <>
        <button type="button" className={`${s.btn} ${s['btn--reject']}`} disabled={busy} onClick={() => { if (!reason) { setReasonError('Selecciona un motivo para que el alumno sepa qué corregir.'); return } onDecide('reject', reason) }}>Rechazar publicación</button>
        <button type="button" className={`${s.btn} ${s['btn--approve']}`} disabled={busy || !confirmed || !post.authorActive} onClick={() => onDecide('approve', undefined, confirmed)}>Publicar en su grupo</button>
      </> : post.status !== 'retirada' && <button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={() => onDecide('undo')}>Devolver a revisión</button>}
    </div>
  </dialog>
}
