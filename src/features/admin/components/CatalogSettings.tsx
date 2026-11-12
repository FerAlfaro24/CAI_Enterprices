import { useId, useState, type FormEvent } from 'react'
import { useAdmin } from '../state'
import s from '../admin.module.css'

export function CatalogSettings() {
  const { connection } = useAdmin()
  const id = useId()
  const [program, setProgram] = useState(''), [name, setName] = useState('')
  const [error, setError] = useState('')
  if (!connection?.configuration) return null
  const groups = connection.configuration.groups
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (program.trim().length < 2 || name.trim().length < 2) { setError('Escribe el programa y un grupo u horario de al menos dos caracteres.'); return }
    if (await connection.createGroup(program.trim(), name.trim())) { setName('') }
    else setError('No se pudo crear el grupo. Revisa el aviso y vuelve a intentarlo.')
  }
  return <section className={`${s.card} ${s['catalog-settings']}`} aria-labelledby={`${id}-heading`}>
    <div className={s['card-head']}><div><h2 id={`${id}-heading`} className={s['card-title']}>Programas y grupos</h2><p className={s['card-sub']}>Crea un grupo o archívalo para nuevas solicitudes y asignaciones. Archivar conserva los alumnos y sus historias; no cierra sus sesiones.</p></div></div>
    <form onSubmit={event => { void submit(event) }} className={s['catalog-form']} aria-label="Crear grupo" noValidate>
      <label htmlFor={`${id}-program`}>Programa<input id={`${id}-program`} list={`${id}-programs`} value={program} maxLength={100} required disabled={connection.busy} onChange={event => setProgram(event.target.value)} placeholder="Escribe o elige un programa" /></label>
      <datalist id={`${id}-programs`}>{[...new Set(groups.map(group => group.program))].map(program => <option key={program} value={program} />)}</datalist>
      <label htmlFor={`${id}-name`}>Grupo u horario<input id={`${id}-name`} value={name} maxLength={100} required disabled={connection.busy} onChange={event => setName(event.target.value)} placeholder="Por ejemplo: Sábados · 10:00" /></label>
      <button type="submit" className={`${s.btn} ${s['btn--primary']}`} disabled={connection.busy}>Crear grupo</button>
      {error && <p role="alert" className={s['field-error']}>{connection.error || error}</p>}
    </form>
    <ul className={`${s.queue} ${s['catalog-list']}`} aria-label="Catálogo de grupos">{groups.map(group => <li key={group.id} data-group-id={group.id}><div><strong>{group.program}</strong><span>{group.name} · {group.active ? 'Activo' : 'Archivado'}</span></div><button type="button" className={`${s.btn} ${s['btn--ghost']} ${s['btn--sm']}`} disabled={connection.busy} aria-label={`${group.active ? 'Archivar' : 'Reactivar'} grupo ${group.program}, ${group.name}`} onClick={() => { void connection.toggleGroup(group) }}>{group.active ? 'Archivar' : 'Reactivar'}</button></li>)}</ul>
    <p className={s.footnote}>Los nombres identifican la audiencia de las historias. Para otro programa u horario, crea un grupo y reasigna alumnos desde su ficha; aquí no se renombra ni se elimina el historial. El catálogo inicial es de prueba y CAI debe validar sus programas.</p>
  </section>
}
