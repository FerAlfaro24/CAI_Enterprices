import { useEffect, useRef } from 'react'
import { cx } from '../../landing/utils'
import s from '../admin.module.css'
import type { AccessRequest } from '../data/mockData'
import { canApprove, formatDate, useAdmin } from '../state'
import { RequestActions } from './RequestActions'
import { Avatar, Icon, StatusBadge } from './ui'

export function RequestDialog({ request, onClose }: { request: AccessRequest | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const applicant = request?.applicant
  const { dispatch, announce } = useAdmin()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (request && !dialog.open) dialog.showModal()
    if (!request && dialog.open) dialog.close()
  }, [request])

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby="request-dialog-title"
      onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      {request && (
        <>
          <div className={s['dialog-head']}>
            <Avatar name={request.name} />
            <div>
              <h2 id="request-dialog-title">{request.name}</h2>
              <p>Solicitud {request.id} · {formatDate(request.submittedAt)}</p>
            </div>
            <button type="button" className={s['icon-btn']} onClick={onClose} aria-label="Cerrar detalle">
              <Icon name="close" />
            </button>
          </div>
          <div className={s['dialog-body']}>
            {request.status === 'pendiente' && (
              <section className={s['request-guide']} aria-labelledby="request-guide-title">
                <h3 id="request-guide-title">Antes de decidir</h3>
                <ol>
                  <li>Comprueba que el alumno esté inscrito en CAI y que sus datos sean correctos.</li>
                  {request.ageGroup === 'menor' && <li>Confirma la autorización con su madre, padre o tutor antes de registrarla como recibida.</li>}
                  <li>Aprueba para añadirlo al directorio de la demo o rechaza si la solicitud no corresponde.</li>
                </ol>
                <p>¿Faltan datos? Cierra este detalle: la solicitud seguirá pendiente.</p>
              </section>
            )}
            <dl className={s.details}>
              <dt>Estado</dt><dd><StatusBadge status={request.status} /></dd>
              <dt>Programa</dt><dd>{request.program}</dd>
              <dt>Grupo de edad</dt><dd>{request.ageGroup === 'menor' ? 'Menor de edad' : 'Adulto'}</dd>
              {request.ageGroup === 'menor' && (
                <><dt>Autorización del tutor</dt><dd>{request.guardianConsent === 'recibida' ? 'Recibida' : 'Pendiente'}</dd></>
              )}
              <dt>Origen</dt><dd>{request.source}</dd>
              {applicant && (
                <>
                  <dt>Llenada por</dt><dd>{applicant.filledBy === 'tutor' ? 'Madre, padre o tutor' : 'El alumno'}</dd>
                  <dt>Edad</dt><dd>{applicant.age} años</dd>
                  <dt>Grupo</dt><dd>{applicant.group}</dd>
                  <dt>Matrícula</dt><dd>{applicant.studentCode ?? 'No indicada'}</dd>
                  <dt>Correo</dt><dd>{applicant.email}</dd>
                  <dt>Nombre visible</dt><dd>{applicant.displayName}</dd>
                  <dt>Perfil</dt><dd>{applicant.visibility === 'privado' ? 'Solo su grupo' : 'Toda la comunidad'}</dd>
                  {applicant.guardian && (
                    <><dt>Tutor</dt><dd>{applicant.guardian.name} · {applicant.guardian.relationship}<br />{applicant.guardian.contact}</dd></>
                  )}
                </>
              )}
            </dl>
            <blockquote className={s.quote}>{request.message}</blockquote>
            {request.ageGroup === 'menor' && (
              <p className={cx(s.alert, canApprove(request) && s['alert--ok'])}>
                {canApprove(request)
                  ? 'Autorización del tutor registrada (simulada). Su perfil será privado por defecto.'
                  : 'No es posible aprobar a un menor sin la autorización de su padre, madre o tutor.'}
              </p>
            )}
            {request.ageGroup === 'menor' && !canApprove(request) && request.status === 'pendiente' && (
              <button type="button" className={cx(s.btn, s['btn--ghost'], s['btn--sm'])} onClick={() => {
                dispatch({ type: 'consent', id: request.id })
                announce(`Autorización del tutor de ${request.name} registrada.`)
              }}>
                <Icon name="check" size={16} />Registrar autorización recibida (simulado)
              </button>
            )}
          </div>
          <div className={s['dialog-foot']}>
            <RequestActions request={request} size="md" onDone={onClose} />
          </div>
        </>
      )}
    </dialog>
  )
}
