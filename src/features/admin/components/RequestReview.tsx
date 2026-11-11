import s from '../admin.module.css'
import type { AccessRequest } from '../data/mockData'
import { canApprove } from '../state'
import { Icon } from './ui'

function nextStep(request: AccessRequest, local: boolean) {
  if (request.status === 'aprobada') return local ? 'Ya aparece en el directorio local de alumnos.' : 'Ya aparece en el directorio de alumnos de la demo.'
  if (request.status === 'rechazada') return 'Puedes devolverla a revisión.'
  if (!canApprove(request)) return 'Falta confirmar la autorización del tutor.'
  return 'Comprueba los datos antes de decidir.'
}

/** Una sola entrada al detalle; las decisiones se toman después de revisar. */
export function RequestReview({ request, onReview, local = false }: { request: AccessRequest; onReview: () => void; local?: boolean }) {
  const pending = request.status === 'pendiente'
  const hintId = `request-review-${request.id}`

  return (
    <div className={s['request-review']}>
      <p id={hintId} className={s['request-hint']}>{nextStep(request, local)}</p>
      <button
        type="button"
        className={`${s.btn} ${pending ? s['btn--primary'] : s['btn--ghost']} ${s['btn--sm']}`}
        onClick={onReview}
        aria-haspopup="dialog"
        aria-describedby={hintId}
      >
        <Icon name="eye" size={16} />{pending ? 'Revisar solicitud' : 'Ver decisión'}<span className={s['sr-only']}> de {request.name}</span>
      </button>
    </div>
  )
}
