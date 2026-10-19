import { cx } from '../../landing/utils'
import s from '../admin.module.css'
import type { AccessRequest } from '../data/mockData'
import { canApprove, useAdmin } from '../state'
import { Icon } from './ui'

/** Botones de decisión compartidos por el resumen, la tabla y el detalle. */
export function RequestActions({ request, size = 'sm', onDone }: {
  request: AccessRequest
  size?: 'sm' | 'md'
  onDone?: () => void
}) {
  const { dispatch, announce } = useAdmin()
  const small = size === 'sm' && s['btn--sm']

  if (request.status !== 'pendiente') {
    return (
      <button type="button" className={cx(s.btn, s['btn--ghost'], small)} onClick={() => {
        dispatch({ type: 'undo', id: request.id })
        announce(`Solicitud de ${request.name} devuelta a pendiente.`)
        onDone?.()
      }}>
        <Icon name="undo" size={16} />Deshacer<span className={s['sr-only']}> decisión de {request.name}</span>
      </button>
    )
  }

  const approvable = canApprove(request)
  const decide = (status: 'aprobada' | 'rechazada') => {
    dispatch({ type: 'decide', id: request.id, status })
    announce(`Solicitud de ${request.name} ${status}.`)
    onDone?.()
  }

  return (
    <>
      <button type="button" className={cx(s.btn, s['btn--reject'], small)} onClick={() => decide('rechazada')}>
        <Icon name="x" size={16} />Rechazar<span className={s['sr-only']}> a {request.name}</span>
      </button>
      <button
        type="button"
        className={cx(s.btn, s['btn--approve'], small)}
        onClick={() => decide('aprobada')}
        disabled={!approvable}
        title={approvable ? undefined : 'Falta la autorización del tutor'}
        style={approvable ? undefined : { opacity: .45, cursor: 'not-allowed' }}
      >
        <Icon name="check" size={16} />Aprobar<span className={s['sr-only']}> a {request.name}{approvable ? '' : ' (falta autorización del tutor)'}</span>
      </button>
    </>
  )
}
