import s from '../admin.module.css'
import type { AccessRequest } from '../data/mockData'
import { canApprove } from '../state'
import { Icon } from './ui'

function nextStep(request: AccessRequest) {
  if (request.status === 'aprobada') return 'Ya aparece en el directorio de alumnos de la demo.'
  if (request.status === 'rechazada') return 'Puedes devolverla a revisión.'
  if (!canApprove(request)) return 'Falta confirmar la autorización del tutor.'
  return 'Comprueba los datos antes de decidir.'
}

/** Una sola entrada al detalle; las decisiones se toman después de revisar. */
export function RequestReview({ request, onReview }: { request: AccessRequest; onReview: () => void }) {
  const pending = request.status === 'pendiente'
  const hintId = `request-review-${request.id}`

  return (
    <div className={s['request-review']}>
      <p id={hintId} className={s['request-hint']}>{nextStep(request)}</p>
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
