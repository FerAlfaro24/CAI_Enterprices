import { useSearchParams } from 'react-router'
import { normalizeSearch } from '../features/admin/search'
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
  const [params,setParams]=useSearchParams()
  const filter=(['activo','suspendido','todos'].includes(params.get('estado')??'')?params.get('estado'):'activo') as Filter
  const program=params.get('programa')??'todos', group=params.get('grupo')??'todos', access=params.get('acceso')??'todos', query=params.get('q')??''
  const update=(key:string,value:string)=>setParams(current=>{const next=new URLSearchParams(current);if(value&&value!=='todos')next.set(key,value);else next.delete(key);return next},{replace:true})
  const setFilter=(value:Filter)=>setParams(current=>{const next=new URLSearchParams(current);next.set('estado',value);return next},{replace:true})
  const setProgram=(value:string)=>setParams(current=>{const next=new URLSearchParams(current);next.delete('grupo');if(value==='todos')next.delete('programa');else next.set('programa',value);return next},{replace:true})
  const setQuery=(value:string)=>update('q',value)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const directory = buildDirectory(state)
  const programs = [...new Set([...(program==='todos'?[]:[program]),...directory.map((st) => st.program)])].sort()
  const normalized = normalizeSearch(query)
  const groupNames=[...new Set([...(group==='todos'?[]:[group]),...directory.filter(st=>program==='todos'||st.program===program).map(st=>st.group)])].sort()
  const visible = directory.filter((st) =>
    (filter === 'todos' || st.status === filter) &&
    (program === 'todos' || st.program === program) &&
    (group==='todos'||st.group===group) &&
    (access==='todos'||connection?.students.find(item=>item.id===st.id)?.accountStatus===access) &&
    (!normalized || normalizeSearch(`${st.name} ${st.id} ${st.group} ${st.program} ${connection?.requests.find(item=>item.id===st.id)?.applicant.email??''}`).includes(normalized)),
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
          <label className={s['sr-only']} htmlFor="group-filter">Grupo</label><select id="group-filter" className={s.select} value={group} onChange={e=>update('grupo',e.target.value)}><option value="todos">Todos los grupos</option>{groupNames.map(name=><option key={name}>{name}</option>)}</select>
          <label className={s['sr-only']} htmlFor="account-filter">Activación de cuenta</label><select id="account-filter" className={s.select} value={access} onChange={e=>update('acceso',e.target.value)}><option value="todos">Cualquier activación</option><option value="pendiente">Por activar</option><option value="activada">Activadas</option></select>
          <div className={s.search}>
            <Icon name="search" size={18} />
            <label htmlFor="student-search" className={s['sr-only']}>Buscar alumno</label>
            <input id="student-search" type="search" placeholder="Nombre, correo, folio o grupo" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
        </div>
      </div>

      <p className={s.resultCount} role="status">{visible.length} alumnos con estos filtros {params.size>0&&<button type="button" className={s['card-link']} onClick={()=>setParams({})}>Quitar filtros</button>}</p>
      <section className={`${s.card} ${s['table-card']}`} aria-labelledby="students-caption">
        <table className={s.table}>
          <caption id="students-caption" className={s['sr-only']}>Alumnos: {visible.length} resultados</caption>
          <thead>
            <tr>
              <th scope="col">Alumno</th>
              <th scope="col">Programa y grupo</th>
              <th scope="col">Publicaciones</th>
              <th scope="col">Acceso</th>
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
                  <td data-label="Acceso" className={s['cell-muted']}>
                    <span className={s['cell-icon']}><Icon name={connection||isPrivate ? 'lock' : 'globe'} size={15} />{connection?(connection.students.find(item=>item.id===student.id)?.accountStatus==='activada'?'Cuenta activada':'Por activar'):isPrivate ? 'Privado' : 'Comunidad'}</span>
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
      <p className={s.footnote}>Abre una ficha para preparar el acceso, cambiar de grupo o corregir el expediente privado.</p>

      <StudentDialog student={directory.find((st) => st.id === selectedId) ?? null} onClose={() => setSelectedId(null)} />
    </>
  )
}
