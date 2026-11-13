import { useState } from 'react'
import { Link } from 'react-router'
import s from '../features/admin/admin.module.css'
import { Donut, KpiCard, Legend, LineChart } from '../features/admin/components/charts'
import { RequestReview } from '../features/admin/components/RequestReview'
import { RequestDialog } from '../features/admin/components/RequestDialog'
import { Avatar, Icon, TypeTag } from '../features/admin/components/ui'
import { connectedMetrics } from '../features/admin/connectedMetrics'
import { buildDirectory, countByStatus, formatDate, requestStatuses, useAdmin } from '../features/admin/state'

export function AdminPage() {
  const { state, dispatch, connection } = useAdmin()
  const metrics=connectedMetrics(connection?.requests??[],connection?.students??[],connection?.posts??[])
  const activitySeries=[{label:'Publicaciones enviadas',color:'#1f56d6',values:metrics.submitted},{label:'Aprobadas vigentes',color:'#29a9e2',values:metrics.approved}]
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const counts = countByStatus(state.requests, requestStatuses)
  const pendingRequests = state.requests.filter((r) => r.status === 'pendiente')
  const decided = counts.aprobada + counts.rechazada
  const reviewedShare = state.requests.length?Math.round((decided / state.requests.length) * 100):0
  const pendingPosts = state.posts.filter((p) => p.status === 'pendiente')
  const activeStudents = buildDirectory(state).filter((st) => st.status === 'activo').length

  return (
    <>
      <div className={s['page-head']}>
        <div>
          <p className={s.eyebrow}>Panel de coordinación</p>
          <h1 className={s['page-title']}>Hola, {connection?.user?.name??'Coordinación'}</h1>
          <p className={s['page-lead']}>
            Esto es lo que necesita tu atención hoy. Indicadores del servidor local; utiliza datos ficticios durante las pruebas.
          </p>
        </div>
        <div className={s['head-actions']}>
          {!!connection?.commentCounts.pendiente&&<Link to="/admin/publicaciones?bandeja=comentarios" className={`${s.btn} ${s['btn--ghost']}`}>Revisar comentarios ({connection.commentCounts.pendiente})</Link>}
          <button type="button" className={`${s.btn} ${s['btn--ghost']}`} onClick={() => {
            dispatch({ type: 'reset' })
          }}>
            <Icon name="refresh" size={16} />Actualizar datos
          </button>
          <Link to="/admin/solicitudes" className={`${s.btn} ${s['btn--primary']}`}>
            Revisar solicitudes<Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>

      <section className={s.kpis} aria-label="Indicadores principales">
        <KpiCard accent icon="inbox" label="Solicitudes pendientes" value={counts.pendiente} detail="por revisar" series={metrics.pending} />
        <KpiCard icon="file" label="Publicaciones en revisión" value={pendingPosts.length} detail="en cola" series={metrics.submitted} />
        <KpiCard icon="users" label="Alumnos activos" value={activeStudents} detail="estado activo" series={metrics.students} />
        <KpiCard icon="trend" label="Solicitudes aprobadas" value={counts.aprobada} detail="total actual" series={metrics.requests} />
      </section>

      <div className={s['grid-main']}>
        <section className={`${s.card} ${s['chart-card']}`} aria-labelledby="activity-title">
          <div className={s['card-head']}>
            <div>
              <h2 id="activity-title" className={s['card-title']}>Actividad de la comunidad</h2>
              <p className={s['card-sub']}>Publicaciones por semana · últimas 8 semanas</p>
            </div>
            <Legend items={activitySeries} />
          </div>
          <LineChart title="Publicaciones enviadas y aprobadas vigentes por semana" labels={metrics.labels} series={activitySeries} max={metrics.max} />
        </section>

        <section className={s.card} aria-labelledby="status-title">
          <div className={s['card-head']}>
            <div>
              <h2 id="status-title" className={s['card-title']}>Estado de solicitudes</h2>
              <p className={s['card-sub']}>Estado actual</p>
            </div>
          </div>
          <Donut
            center={{ value: state.requests.length, label: 'solicitudes' }}
            segments={[
              { label: 'Pendientes', value: counts.pendiente, color: '#f2b705' },
              { label: 'Aprobadas', value: counts.aprobada, color: '#1f56d6' },
              { label: 'Rechazadas', value: counts.rechazada, color: '#e0663b' },
            ]}
            footer={
              <p className={s['donut-note']}>
                <Icon name="check" />
                <span>
                  <strong>{counts.pendiente === 0 ? '¡Bandeja al día!' : `${reviewedShare}% revisado`}</strong>
                  <span>{counts.pendiente === 0 ? 'No quedan solicitudes por revisar.' : `Quedan ${counts.pendiente} por revisar.`}</span>
                </span>
              </p>
            }
          />
        </section>
      </div>

      <div className={s['grid-bottom']}>
        <section className={s.card} aria-labelledby="queue-title">
          <div className={s['card-head']}>
            <div>
              <h2 id="queue-title" className={s['card-title']}>Pendientes de revisar</h2>
              <p className={s['card-sub']}>Solicitudes de ingreso más recientes</p>
            </div>
            <Link to="/admin/solicitudes" className={s['card-link']}>Ver todas<Icon name="arrow" size={16} /></Link>
          </div>
          {pendingRequests.length === 0 ? (
            <p className={s.empty}>No hay solicitudes pendientes.</p>
          ) : (
            <ul className={s.queue}>
              {pendingRequests.slice(0, 4).map((request) => (
                <li key={request.id}>
                  <div className={s['queue-person']}>
                    <Avatar name={request.name} />
                    <div>
                      <strong>{request.name}</strong>
                      <span>{request.program} · {formatDate(request.submittedAt)}</span>
                    </div>
                  </div>
                  {request.ageGroup === 'menor' && <span className={`${s.tag} ${s['tag--minor']}`}>Menor de edad</span>}
                  <div className={s['queue-actions']}>
                    <RequestReview request={request} local={Boolean(connection)} onReview={() => setSelectedId(request.id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={s.card} aria-labelledby="posts-queue-title">
          <div className={s['card-head']}>
            <div>
              <h2 id="posts-queue-title" className={s['card-title']}>Publicaciones en cola</h2>
              <p className={s['card-sub']}>Esperando moderación</p>
            </div>
            <Link to="/admin/publicaciones" className={s['card-link']}>Moderar<Icon name="arrow" size={16} /></Link>
          </div>
          {pendingPosts.length === 0 ? (
            <p className={s.empty}>No hay publicaciones por revisar.</p>
          ) : (
            <ul className={s.queue}>
              {pendingPosts.slice(0, 4).map((post) => (
                <li key={post.id} className={s['queue-post']}>
                  <div>
                    <TypeTag type={post.type} />
                    {post.checks && <span className={s['queue-flag']}><Icon name="alert" size={14} />Verificar</span>}
                  </div>
                  <strong>{post.title}</strong>
                  <span>{post.author} · {formatDate(post.submittedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <RequestDialog request={state.requests.find((r) => r.id === selectedId) ?? null} onClose={() => setSelectedId(null)} />
    </>
  )
}
