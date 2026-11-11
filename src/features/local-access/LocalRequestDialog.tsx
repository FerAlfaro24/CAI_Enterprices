import { useEffect, useRef, useState } from 'react'
import { Avatar, Icon, StatusBadge } from '../admin/components/ui'
import { formatDate } from '../admin/state'
import type { LocalRequest, RequestDecision } from './api'
import s from '../admin/admin.module.css'

export function LocalRequestDialog({ request, busy, error, onDecide, onClose }: {
  request: LocalRequest; busy: boolean; error: string
  onDecide: (decision: RequestDecision, reference?: string) => void; onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [reference, setReference] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const needsConsent = request.ageGroup === 'menor' && request.guardianConsent !== 'recibida'
  useEffect(() => { ref.current?.showModal() }, [])
  return (
    <dialog ref={ref} className={`${s.dialog} ${s['local-dialog']}`} aria-labelledby="local-request-title" onClose={onClose} onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
      <div className={s['dialog-head']}>
        <Avatar name={request.name} />
        <div><h2 id="local-request-title">{request.name}</h2><p>{request.id} · {formatDate(request.submittedAt)}</p></div>
        <button type="button" className={s['icon-btn']} onClick={onClose} disabled={busy} aria-label="Cerrar solicitud"><Icon name="close" /></button>
      </div>
      <div className={s['dialog-body']}>
        <dl className={s.details}>
          <dt>Estado</dt><dd><StatusBadge status={request.status} /></dd>
          <dt>Programa</dt><dd>{request.program}</dd>
          <dt>Grupo</dt><dd>{request.applicant.group}</dd>
          <dt>Correo</dt><dd className={s['local-break']}>{request.applicant.email}</dd>
          <dt>Edad</dt><dd>{request.applicant.age} años</dd>
          <dt>Nombre visible</dt><dd>{request.applicant.displayName}</dd>
          {request.applicant.guardian && <><dt>Tutor</dt><dd className={s['local-break']}>{request.applicant.guardian.name}<br />{request.applicant.guardian.contact}</dd></>}
        </dl>
        <blockquote className={s.quote}>{request.message}</blockquote>
        {request.status === 'pendiente' && <p className={s.alert}>Comprueba la inscripción y los datos antes de decidir. Aprobar añade al alumno al directorio local; su cuenta se activará en una etapa posterior.</p>}
        {needsConsent && request.status === 'pendiente' && (
          <fieldset className={s['local-consent']} disabled={busy}>
            <legend>Falta la autorización del tutor</legend>
            <label htmlFor="consent-reference">Referencia de la autorización recibida</label>
            <input id="consent-reference" type="text" value={reference} onChange={(event) => setReference(event.target.value)} maxLength={240} placeholder="Ejemplo ficticio: autorización en recepción, folio 12" />
            <label className={s.confirm}><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />Confirmé la autorización con el tutor.</label>
            <button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={!confirmed || reference.trim().length < 8} onClick={() => onDecide('consent', reference)}>Registrar autorización</button>
          </fieldset>
        )}
        {!needsConsent && request.ageGroup === 'menor' && <p className={`${s.alert} ${s['alert--ok']}`}>Autorización del tutor registrada.</p>}
        {error && <p role="alert" className={s.alert}>{error}</p>}
      </div>
      <div className={s['dialog-foot']} aria-busy={busy}>
        {request.status === 'pendiente' ? <>
          <button type="button" className={`${s.btn} ${s['btn--reject']}`} disabled={busy} onClick={() => onDecide('reject')}>Rechazar solicitud</button>
          <button type="button" className={`${s.btn} ${s['btn--approve']}`} disabled={busy || needsConsent} onClick={() => onDecide('approve')}>Aprobar solicitud</button>
        </> : <button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={() => onDecide('undo')}>Devolver a pendientes</button>}
      </div>
    </dialog>
  )
}
