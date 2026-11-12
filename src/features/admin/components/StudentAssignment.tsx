import { useId, useState, type FormEvent } from 'react'
import { useAdmin } from '../state'
import type { LocalStudent } from '../../local-access/api'
import s from '../admin.module.css'

export function StudentAssignment({ student, onSaved }: { student: LocalStudent; onSaved: () => void }) {
  const { connection } = useAdmin()
  const id = useId()
  const [program, setProgram] = useState(student.program), [group, setGroup] = useState(student.group)
  const [confirmed, setConfirmed] = useState(false), [error, setError] = useState('')
  if (!connection?.configuration) return null
  const catalog = connection.configuration.groups.filter(item => item.active)
  const programs = [...new Set([student.program, ...catalog.map(item => item.program)])]
  const groups = [...new Set(['Por asignar', ...(program === student.program ? [student.group] : []), ...catalog.filter(item => item.program === program).map(item => item.name)])]
  const changed = program !== student.program || group !== student.group
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError('')
    if (!confirmed) { setError('Confirma los efectos del cambio antes de guardar.'); return }
    if (await connection.assign(student.id, program, group, confirmed)) onSaved()
    else setError('No se pudo guardar. Revisa el aviso y actualiza la ficha si cambió en otra ventana.')
  }
  return <form className={s['assignment-form']} aria-label="Asignar programa y grupo" onSubmit={event => { void submit(event) }}>
    <h3>Programa y grupo del alumno</h3>
    <div><label htmlFor={`${id}-program`}>Programa</label><select id={`${id}-program`} value={program} disabled={connection.busy} onChange={event => { setProgram(event.target.value); setGroup('Por asignar'); setConfirmed(false) }}>{programs.map(program => <option key={program}>{program}</option>)}</select></div>
    <div><label htmlFor={`${id}-group`}>Grupo u horario</label><select id={`${id}-group`} value={group} disabled={connection.busy} onChange={event => { setGroup(event.target.value); setConfirmed(false) }}>{groups.map(group => <option key={group}>{group}</option>)}</select></div>
    {changed && <><p className={s['card-sub']}>El alumno deberá volver a entrar. Sus historias conservan el grupo de origen y las publicadas volverán a revisión. Sus datos personales y su cuenta se conservan.</p><label className={s.confirm}><input type="checkbox" checked={confirmed} disabled={connection.busy} onChange={event => setConfirmed(event.target.checked)} />Confirmo el cambio de programa o grupo y sus efectos</label></>}
    {error && <p role="alert" className={s['field-error']}>{connection.error || error}</p>}
    <button className={`${s.btn} ${s['btn--primary']}`} type="submit" disabled={!changed || !confirmed || connection.busy}>Guardar asignación</button>
  </form>
}
