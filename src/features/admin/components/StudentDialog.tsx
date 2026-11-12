import { useEffect, useRef } from 'react'
import { cx } from '../../landing/utils'
import s from '../admin.module.css'
import { formatDate, useAdmin, type DirectoryStudent } from '../state'
import { Avatar, Icon, StatusBadge } from './ui'

export function StudentDialog({ student, onClose }: { student: DirectoryStudent | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { state, dispatch, announce, connection } = useAdmin()
  const account=connection?.students.find(s=>s.id===student?.id)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (student && !dialog.open) dialog.showModal()
    if (!student && dialog.open) dialog.close()
  }, [student])

  const forcedPrivate = student?.ageGroup === 'menor' && state.settings.minorsPrivateByDefault

  return (
    <dialog
      ref={ref}
      className={s.dialog}
      aria-labelledby="student-dialog-title"
      onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      {student && (
        <>
          <div className={s['dialog-head']}>
            <Avatar name={student.name} />
            <div>
              <h2 id="student-dialog-title">{student.name}</h2>
              <p>{student.id} · Alumno desde {formatDate(student.joinedAt)}</p>
            </div>
            <button type="button" className={s['icon-btn']} onClick={onClose} aria-label="Cerrar ficha">
              <Icon name="close" />
            </button>
          </div>
          <div className={s['dialog-body']}>
            <dl className={s.details}>
              <dt>Estado</dt><dd><StatusBadge status={student.status} /></dd>
              <dt>Programa</dt><dd>{student.program}</dd>
              <dt>Grupo</dt><dd>{student.group}</dd>
              <dt>Grupo de edad</dt><dd>{student.ageGroup === 'menor' ? 'Menor de edad' : 'Adulto'}</dd>
              {student.ageGroup === 'menor' && (
                <><dt>Autorización del tutor</dt><dd>{student.guardianConsent === 'recibida' ? 'Recibida' : 'Pendiente'}</dd></>
              )}
              <dt>Publicaciones</dt><dd>{student.posts}</dd>
              <dt>Perfil</dt><dd>{connection?'Visible solo para su grupo':forcedPrivate || student.visibility === 'privado' ? 'Privado' : 'Visible para la comunidad'}</dd>
              {account && <><dt>Acceso de cuenta</dt><dd>{account.accountStatus==='activada'?'Cuenta activada':'Cuenta por activar'}</dd></>}
            </dl>
            {forcedPrivate && (
              <p className={cx(s.alert, s['alert--ok'])}>
                Perfil privado. Solo coordinación consulta el expediente; su grupo solo recibe el nombre visible autorizado.
              </p>
            )}
            {student.status === 'suspendido' && (
              <p className={s.alert}>Cuenta suspendida: no puede acceder a su espacio ni publicar.</p>
            )}
          </div>
          {connection?.error && <p role="alert" className={s.alert}>{connection.error}</p>}
          <div className={s['dialog-foot']}>
            {account?.status==='activo'&&account.accountStatus==='pendiente'&&<button type="button" className={`${s.btn} ${s['btn--primary']}`} disabled={connection?.busy} onClick={()=>{void connection?.invite(account.id);onClose()}}>Preparar acceso</button>}
            {student.status === 'activo' ? (
              <button type="button" disabled={connection?.busy} className={cx(s.btn, s['btn--reject'])} onClick={() => {
                if(connection){void connection.mutate({type:'suspend',id:student.id}).then(ok=>{if(ok)onClose()});return}
                dispatch({ type: 'suspend', id: student.id })
                announce(`${student.name} suspendido.`)
              }}>
                <Icon name="lock" size={16} />Suspender acceso
              </button>
            ) : (
              <button type="button" disabled={connection?.busy} className={cx(s.btn, s['btn--approve'])} onClick={() => {
                if(connection){void connection.mutate({type:'reactivate',id:student.id}).then(ok=>{if(ok)onClose()});return}
                dispatch({ type: 'reactivate', id: student.id })
                announce(`${student.name} reactivado.`)
              }}>
                <Icon name="check" size={16} />Reactivar acceso
              </button>
            )}
          </div>
        </>
      )}
    </dialog>
  )
}
