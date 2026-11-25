import { StudentAccessEmail } from './StudentAccessEmail'
import { useState } from 'react'
import { cx } from '../../landing/utils'
import s from '../admin.module.css'
import { formatDate, useAdmin, type DirectoryStudent } from '../state'
import { useAdminModal } from '../useAdminModal'
import { StudentAssignment } from './StudentAssignment'
import { StudentRecordEditor } from './StudentRecordEditor'
import { Avatar, Icon, StatusBadge } from './ui'

function SuspendConfirmation({ name, busy, error, onCancel, onConfirm }: { name: string; busy: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  const ref = useAdminModal()
  return <dialog ref={ref} className={s.dialog} aria-label="Confirmar suspensión" onCancel={event => { event.preventDefault(); event.stopPropagation(); if (!busy) onCancel() }}>
    <div className={s['dialog-head']}><h2>¿Suspender el acceso de {name}?</h2></div><div className={s['dialog-body']}><p>No podrá entrar a la comunidad. Se cerrarán sus sesiones. Su expediente y contenido se conservan; puedes reactivar el acceso desde su ficha.</p>{error && <p role="alert" className={s.alert}>{error}</p>}</div><div className={s['dialog-foot']}><button type="button" className={s.btn} disabled={busy} onClick={onCancel}>Cancelar</button><button type="button" className={`${s.btn} ${s['btn--reject']}`} disabled={busy} onClick={onConfirm}>{busy ? 'Suspendiendo…' : 'Confirmar suspensión'}</button></div>
  </dialog>
}
function StudentDetail({ student, onClose }: { student: DirectoryStudent; onClose: () => void }) {
  const ref = useAdminModal(), { dispatch, announce, connection } = useAdmin()
  const [tab, setTab] = useState('resumen'), [confirm, setConfirm] = useState(false)
  const account = connection?.students.find(item => item.id === student.id)
  const close = () => { if (!connection?.busy) onClose() }
  const suspend = async () => {
    if (connection) { if (await connection.mutate({ type: 'suspend', id: student.id })) onClose() }
    else { dispatch({ type: 'suspend', id: student.id }); announce(`${student.name} suspendido.`); onClose() }
  }
  return <dialog ref={ref} className={s.dialog} aria-labelledby="student-dialog-title" onCancel={event => { event.preventDefault(); close() }}>
    <div className={s['dialog-head']}><Avatar name={student.name} /><div><h2 id="student-dialog-title">{student.name}</h2><p>{student.id} · Alumno desde {formatDate(student.joinedAt)}</p></div><button type="button" className={s['icon-btn']} disabled={connection?.busy} aria-label="Cerrar ficha" onClick={close}><Icon name="close" /></button></div>
    <div className={s['dialog-body']}>
      <div className={s.tabs} role="group" aria-label="Apartados de la ficha">{Object.entries({ resumen: 'Resumen y acceso', grupo: 'Programa y grupo', expediente: 'Expediente privado' }).map(([key, label]) => <button type="button" key={key} className={s.tab} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</div>
      <div hidden={tab !== 'resumen'}><dl className={s.details}><dt>Estado</dt><dd><StatusBadge status={student.status} /></dd><dt>Clase o inscripción anterior</dt><dd>{student.program}</dd>{student.group&&<><dt>Grupo anterior</dt><dd>{student.group}</dd></>}<dt>Grupo de edad</dt><dd>{student.ageGroup === 'menor' ? 'Menor de edad' : 'Adulto'}</dd>{student.ageGroup==='menor'&&<><dt>Autorización del tutor</dt><dd>{student.guardianConsent==='recibida'?'Recibida':'Pendiente'}</dd></>}<dt>Publicaciones</dt><dd>{student.posts}</dd>{account && <><dt>Acceso de cuenta</dt><dd>{account.accountStatus === 'activada' ? 'Cuenta activada' : 'Cuenta por activar'}</dd></>}</dl><p className={s['card-sub']}>El expediente y los motivos internos son privados. El contenido compartido conserva los destinatarios de cada publicación.</p>{student.status === 'suspendido' && <p className={s.alert}>Acceso suspendido. Puedes reactivarlo con el botón inferior.</p>}
        {account&&connection&&<StudentAccessEmail student={account} busy={connection.busy} onManual={async()=>{if(await connection.invite(account.id))onClose()}} onReload={connection.refresh} onError={connection.handleFailure}/>}
      </div>
      <div hidden={tab !== 'grupo'}>{account && <StudentAssignment key={`${account.id}-${account.revision}`} student={account} onSaved={onClose} />}</div>
      <div hidden={tab !== 'expediente'}>{account && <StudentRecordEditor key={account.id} studentId={account.id} />}</div>
      {connection?.error && !confirm && <p role="alert" className={s.alert}>{connection.error}</p>}
    </div>
    <div className={s['dialog-foot']}><button type="button" className={s.btn} disabled={connection?.busy} onClick={close}>Cerrar ficha</button>{student.status === 'activo' ? <button type="button" className={cx(s.btn, s['btn--reject'])} disabled={connection?.busy} onClick={() => setConfirm(true)}><Icon name="lock" size={16} />Suspender acceso</button> : <button type="button" className={cx(s.btn, s['btn--approve'])} disabled={connection?.busy} onClick={async () => { if (connection) { if (await connection.mutate({ type: 'reactivate', id: student.id })) onClose() } else { dispatch({ type: 'reactivate', id: student.id }); onClose() } }}>Reactivar acceso</button>}</div>
    {confirm && <SuspendConfirmation name={student.name} busy={connection?.busy ?? false} error={connection?.error ?? ''} onCancel={() => setConfirm(false)} onConfirm={() => { void suspend() }} />}
  </dialog>
}
export function StudentDialog({ student, onClose }: { student: DirectoryStudent | null; onClose: () => void }) {
  return student ? <StudentDetail key={student.id} student={student} onClose={onClose} /> : null
}
