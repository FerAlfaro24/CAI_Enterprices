import { useState } from 'react'
import s from '../features/admin/admin.module.css'
import { RequestReview } from '../features/admin/components/RequestReview'
import { RequestDialog } from '../features/admin/components/RequestDialog'
import { Avatar, Icon, StatusBadge } from '../features/admin/components/ui'
import type { RequestStatus } from '../features/admin/data/mockData'
import { countByStatus, formatDate, requestStatuses, useAdmin } from '../features/admin/state'

type Filter = RequestStatus | 'todas'

const filters: { value: Filter; label: string }[] = [
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'aprobada', label: 'Aprobadas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'todas', label: 'Todas' },
]

export function AdminRequestsPage() {
  const { state } = useAdmin()
  const [filter, setFilter] = useState<Filter>('pendiente')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const counts = countByStatus(state.requests, requestStatuses)
  const normalized = query.trim().toLocaleLowerCase('es')

  const visible = state.requests.filter((r) =>
    (filter === 'todas' || r.status === filter) &&
    (!normalized || `${r.name} ${r.program} ${r.id}`.toLocaleLowerCase('es').includes(normalized)),
  )

  return (
    <>
      <div className={s['page-head']}>
        <div>
          <p className={s.eyebrow}>Gestión de acceso</p>
          <h1 className={s['page-title']}>Solicitudes de ingreso</h1>
          <p className={s['page-lead']}>
            Abre una solicitud, comprueba sus datos y decide. Si falta información, puedes cerrarla y continuar después sin cambiar su estado.
          </p>
        </div>
      </div>

      <div className={s.toolbar}>
        <div className={s.tabs} role="group" aria-label="Filtrar por estado">
          {filters.map(({ value, label }) => (
            <button key={value} type="button" className={s.tab} aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {label}<span>{value === 'todas' ? state.requests.length : counts[value]}</span>
            </button>
          ))}
        </div>
        <div className={s.search}>
          <Icon name="search" size={18} />
          <label htmlFor="request-search" className={s['sr-only']}>Buscar solicitud</label>
          <input id="request-search" type="search" placeholder="Buscar por nombre, programa o folio" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      </div>

      <section className={`${s.card} ${s['table-card']}`} aria-labelledby="requests-caption">
        <table className={s.table}>
          <caption id="requests-caption" className={s['sr-only']}>
            Solicitudes {filters.find((f) => f.value === filter)?.label.toLowerCase()}: {visible.length} resultados
          </caption>
          <thead>
            <tr>
              <th scope="col">Solicitante</th>
              <th scope="col">Programa</th>
              <th scope="col">Fecha</th>
              <th scope="col">Estado</th>
              <th scope="col"><span className={s['sr-only']}>Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((request) => (
              <tr key={request.id}>
                <td>
                  <div className={s['cell-person']}>
                    <Avatar name={request.name} small />
                    <div>
                      <strong>{request.name}</strong>
                      <span>{request.id} · {request.source}</span>
                    </div>
                  </div>
                </td>
                <td data-label="Programa">
                  <span>
                    {request.program}
                    {request.ageGroup === 'menor' && <> <span className={`${s.tag} ${s['tag--minor']}`}>Menor</span></>}
                  </span>
                </td>
                <td data-label="Fecha" className={s['cell-muted']}>{formatDate(request.submittedAt)}</td>
                <td data-label="Estado"><StatusBadge status={request.status} /></td>
                <td>
                  <div className={s['row-actions']}>
                    <RequestReview request={request} onReview={() => setSelectedId(request.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className={s.empty}>{normalized ? 'Ninguna solicitud coincide con la búsqueda.' : 'No hay solicitudes en este estado.'}</p>
        )}
      </section>
      <p className={s.footnote}>
        Datos ficticios. Las decisiones se guardan solo en esta pestaña y se pierden al recargar; no otorgan acceso real.
      </p>

      <RequestDialog request={state.requests.find((r) => r.id === selectedId) ?? null} onClose={() => setSelectedId(null)} />
    </>
  )
}
