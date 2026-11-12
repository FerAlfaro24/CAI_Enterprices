import { useState } from 'react'
import s from '../features/admin/admin.module.css'
import { StudentDialog } from '../features/admin/components/StudentDialog'
import { Avatar, Icon, StatusBadge } from '../features/admin/components/ui'
import { buildDirectory, formatDate, useAdmin } from '../features/admin/state'

type Filter = 'activo' | 'suspendido' | 'todos'

const filters: { value: Filter; label: string }[] = [
  { value: 'activo', label: 'Activos' },
  { value: 'suspendido', label: 'Suspendidos' },
  { value: 'todos', label: 'Todos' },
]

export function AdminStudentsPage() {
  const { state,connection } = useAdmin()
  const [filter, setFilter] = useState<Filter>('activo')
  const [program, setProgram] = useState('todos')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const directory = buildDirectory(state)
  const programs = [...new Set(directory.map((st) => st.program))].sort()
  const normalized = query.trim().toLocaleLowerCase('es')
  const visible = directory.filter((st) =>
    (filter === 'todos' || st.status === filter) &&
    (program === 'todos' || st.program === program) &&
    (!normalized || `${st.name} ${st.id} ${st.group}`.toLocaleLowerCase('es').includes(normalized)),
  )
  const count = (value: Filter) => (value === 'todos' ? directory.length : directory.filter((st) => st.status === value).length)
  const minors = directory.filter((st) => st.ageGroup === 'menor').length
  const newcomers = directory.filter((st) => st.isNew).length

  return (
    <>
      <div className={s['page-head']}>
        <div>
          <p className={s.eyebrow}>Comunidad</p>
          <h1 className={s['page-title']}>Alumnos</h1>
          <p className={s['page-lead']}>
            Directorio de miembros de la comunidad. Las solicitudes que apruebes aparecen aquí como «Nuevo».
          </p>
        </div>
      </div>

      <section className={s.stats} aria-label="Resumen del directorio">
        <p><strong>{count('activo')}</strong>activos</p>
        <p><strong>{minors}</strong>menores de edad</p>
        <p><strong>{newcomers}</strong>nuevos este mes</p>
        <p><strong>{count('suspendido')}</strong>suspendidos</p>
      </section>

      <div className={s.toolbar}>
        <div className={s.tabs} role="group" aria-label="Filtrar por estado">
          {filters.map(({ value, label }) => (
            <button key={value} type="button" className={s.tab} aria-pressed={filter === value} onClick={() => setFilter(value)}>
              {label}<span>{count(value)}</span>
            </button>
          ))}
        </div>
        <div className={s['toolbar-group']}>
          <label htmlFor="program-filter" className={s['sr-only']}>Programa</label>
          <select id="program-filter" className={s.select} value={program} onChange={(event) => setProgram(event.target.value)}>
            <option value="todos">Todos los programas</option>
            {programs.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <div className={s.search}>
            <Icon name="search" size={18} />
            <label htmlFor="student-search" className={s['sr-only']}>Buscar alumno</label>
            <input id="student-search" type="search" placeholder="Buscar por nombre, folio o grupo" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>
      </div>

      <section className={`${s.card} ${s['table-card']}`} aria-labelledby="students-caption">
        <table className={s.table}>
          <caption id="students-caption" className={s['sr-only']}>Alumnos: {visible.length} resultados</caption>
          <thead>
            <tr>
              <th scope="col">Alumno</th>
              <th scope="col">Programa y grupo</th>
              <th scope="col">Publicaciones</th>
              <th scope="col">Perfil</th>
              <th scope="col">Estado</th>
              <th scope="col"><span className={s['sr-only']}>Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((student) => {
              const isPrivate = student.visibility === 'privado' || (student.ageGroup === 'menor' && state.settings.minorsPrivateByDefault)
              return (
                <tr key={student.id}>
                  <td>
                    <div className={s['cell-person']}>
                      <Avatar name={student.name} small />
                      <div>
                        <strong>
                          {student.name}
                          {student.isNew && <> <span className={`${s.tag} ${s['tag--new']}`}>Nuevo</span></>}
                          {student.ageGroup === 'menor' && <> <span className={`${s.tag} ${s['tag--minor']}`}>Menor</span></>}
                        </strong>
                        <span>{student.id} · desde {formatDate(student.joinedAt)}</span>
                      </div>
                    </div>
                  </td>
                  <td data-label="Programa">
                    <span className={s['cell-stack']}>{student.program}<span>{student.group}</span></span>
                  </td>
                  <td data-label="Publicaciones">{student.posts}</td>
                  <td data-label="Perfil" className={s['cell-muted']}>
                    <span className={s['cell-icon']}><Icon name={connection||isPrivate ? 'lock' : 'globe'} size={15} />{connection?'Solo su grupo':isPrivate ? 'Privado' : 'Comunidad'}</span>
                  </td>
                  <td data-label="Estado"><StatusBadge status={student.status} /></td>
                  <td>
                    <div className={s['row-actions']}>
                      <button type="button" className={`${s.btn} ${s['btn--ghost']} ${s['btn--sm']}`} onClick={() => setSelectedId(student.id)}>
                        <Icon name="eye" size={16} />Ficha<span className={s['sr-only']}> de {student.name}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {visible.length === 0 && <p className={s.empty}>Ningún alumno coincide con los filtros.</p>}
      </section>
      <p className={s.footnote}>Prueba local: directorio conectado al servidor. Utiliza únicamente datos ficticios.</p>

      <StudentDialog student={directory.find((st) => st.id === selectedId) ?? null} onClose={() => setSelectedId(null)} />
    </>
  )
}
