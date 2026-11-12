import { Link } from 'react-router'
import { RequestReview } from '../admin/components/RequestReview'
import { StatusBadge } from '../admin/components/ui'
import type { LocalRequest, LocalStudent } from './api'
import s from '../admin/admin.module.css'

export function LocalRequests({ requests, onReview }: {
  requests: LocalRequest[]; onReview: (request: LocalRequest) => void
}) {
  return (
    <ul className={`${s.queue} ${s['local-records']}`}>
      {requests.map((request) => (
        <li key={request.id}>
          <div className={s['queue-person']}>
            <div><strong>{request.name}</strong><span>{request.id} · {request.program}</span></div>
          </div>
          <StatusBadge status={request.status} />
          <RequestReview request={request} onReview={() => onReview(request)} local />
        </li>
      ))}
    </ul>
  )
}

export function LocalStudents({ students, busy, onStatus, onInvite }: {
  students: LocalStudent[]; busy: boolean; onStatus: (student: LocalStudent) => void; onInvite: (student: LocalStudent) => void
}) {
  return (
    <ul className={`${s.queue} ${s['local-records']}`}>
      {students.map((student) => (
        <li key={student.id}>
          <div className={s['queue-person']}>
            <div><strong>{student.name}</strong><span>{student.id} · {student.program} · {student.group}</span><span>{student.accountStatus === 'activada' ? 'Cuenta activada' : 'Cuenta por activar'}</span></div>
          </div>
          <StatusBadge status={student.status} />
          {student.accountStatus !== 'activada' && <button
            type="button"
            className={`${s.btn} ${s['btn--primary']}`}
            disabled={busy || student.status !== 'activo'}
            onClick={() => onInvite(student)}
          >Preparar acceso<span className={s['sr-only']}> de {student.name}</span></button>}
          <button
            type="button"
            className={`${s.btn} ${s['btn--ghost']}`}
            disabled={busy}
            onClick={() => onStatus(student)}
          >
            {student.status === 'activo' ? 'Suspender' : 'Reactivar'}
            <span className={s['sr-only']}> a {student.name}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function LocalOverview({ requests, students, pendingPosts, onReview }: {
  requests: LocalRequest[]; students: LocalStudent[]; pendingPosts: number; onReview: (request: LocalRequest) => void
}) {
  const pending = requests.filter((request) => request.status === 'pendiente')
  const missingConsent = pending.filter((request) => request.ageGroup === 'menor' && request.guardianConsent !== 'recibida').length
  const active = students.filter((student) => student.status === 'activo').length
  return (
    <>
      <section className={`${s.stats} ${s['local-stats']}`} aria-label="Trabajo pendiente">
        <p><strong>{pending.length}</strong>solicitudes pendientes</p>
        <p><strong>{missingConsent}</strong>autorizaciones por confirmar</p>
        <p><strong>{active}</strong>alumnos activos</p>
      </section>
      <section className={s.card}>
        <div className={s['card-head']}>
          <div>
            <h2 className={s['card-title']}>Solicitudes por revisar</h2>
            <p className={s['card-sub']}>Abre una solicitud, comprueba sus datos y decide.</p>
          </div>
          <Link to="/gestion/solicitudes" className={s['card-link']}>Ver todas</Link>
        </div>
        {pending.length
          ? <LocalRequests requests={pending.slice(0, 5)} onReview={onReview} />
          : <p className={s.empty}>Todo al día. No hay solicitudes pendientes.</p>}
      </section>
      <section className={s.card} style={{ marginTop: 20 }}>
        <div className={s['card-head']}><div><h2 className={s['card-title']}>Publicaciones por revisar</h2><p className={s['card-sub']}>{pendingPosts ? `${pendingPosts} pendientes. Revisa el contenido antes de compartirlo con su grupo.` : 'Todo al día. No hay publicaciones pendientes.'}</p></div><Link to="/gestion/publicaciones" className={s['card-link']}>Revisar publicaciones</Link></div>
      </section>
    </>
  )
}
