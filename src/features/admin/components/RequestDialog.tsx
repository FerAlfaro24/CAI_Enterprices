import { useEffect, useRef } from 'react'
import { cx } from '../../landing/utils'
import s from '../admin.module.css'
import type { AccessRequest } from '../data/mockData'
import { canApprove, formatDate } from '../state'
import { RequestActions } from './RequestActions'
import { Avatar, Icon, StatusBadge } from './ui'

export function RequestDialog({ request, onClose }: { request: AccessRequest | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

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
            <dl className={s.details}>
              <dt>Estado</dt><dd><StatusBadge status={request.status} /></dd>
              <dt>Programa</dt><dd>{request.program}</dd>
              <dt>Grupo de edad</dt><dd>{request.ageGroup === 'menor' ? 'Menor de edad' : 'Adulto'}</dd>
              {request.ageGroup === 'menor' && (
                <><dt>Autorización del tutor</dt><dd>{request.guardianConsent === 'recibida' ? 'Recibida' : 'Pendiente'}</dd></>
              )}
              <dt>Origen</dt><dd>{request.source}</dd>
            </dl>
            <blockquote className={s.quote}>{request.message}</blockquote>
            {request.ageGroup === 'menor' && (
              <p className={cx(s.alert, canApprove(request) && s['alert--ok'])}>
                {canApprove(request)
                  ? 'Autorización del tutor registrada (simulada). Su perfil será privado por defecto.'
                  : 'No es posible aprobar a un menor sin la autorización de su padre, madre o tutor.'}
              </p>
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
