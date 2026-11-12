import { useId,useRef,useState,type FormEvent } from 'react'
import { adminTeamApi,type AdminAccount,type ActivationInvitation } from '../../local-access/api'
import { LocalInvitationDialog } from '../../local-access/LocalInvitationDialog'
import { useAdmin } from '../state'
import { Avatar } from './ui'
import s from '../admin.module.css'

type Task={kind:'create'}|{kind:'invite'|'status';account:AdminAccount}
export function AdminTeamSettings(){
  const {connection}=useAdmin(),id=useId(),sending=useRef(false),password=useRef<HTMLInputElement>(null)
  const [task,setTask]=useState<Task|null>(null),[error,setError]=useState('')
  const [invitation,setInvitation]=useState<(ActivationInvitation&{name:string})|null>(null)
  const attempt=useRef({fingerprint:'',key:crypto.randomUUID()})
  if(!connection)return null
  const changed=task&&task.kind!=='create'&&connection.team.find(a=>a.id===task.account.id)?.revision!==task.account.revision
  const choose=(value:Task)=>{setError('');setTask(value)}
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();if(!task||sending.current||connection.busy)return
    const values=new FormData(event.currentTarget),current=String(values.get('currentPassword'))
    if(changed){setError('La cuenta cambió. Actualiza el equipo y vuelve a elegir la acción.');return}
    if(values.get('confirmed')!=='on'){setError('Confirma que entiendes el alcance del acceso administrativo.');return}
    sending.current=true;setError('')
    try{
      let ok=false
      if(task.kind==='create'){
        const name=String(values.get('name')).trim(),email=String(values.get('email')).trim(),fingerprint=JSON.stringify({name,email})
        if(attempt.current.fingerprint!==fingerprint)attempt.current={fingerprint,key:crypto.randomUUID()}
        ok=await connection.manageTeam(()=>adminTeamApi.create(name,email,current,attempt.current.key),'Cuenta creada pendiente de activación. Prepara su invitación para continuar.')
      }else if(task.kind==='invite'){
        ok=await connection.manageTeam(async()=>{const result=await adminTeamApi.invite(task.account,current);setInvitation({...result,name:task.account.name})},'Invitación de prueba preparada. No se envió ningún correo.')
      }else{
        ok=await connection.manageTeam(()=>adminTeamApi.status(task.account,!task.account.active,current),task.account.active?'Cuenta desactivada. Sus sesiones y enlaces anteriores ya no funcionan.':'Cuenta reactivada. Debe volver a entrar; si sigue pendiente, prepara una nueva invitación.')
      }
      if(ok){setTask(null);attempt.current={fingerprint:'',key:crypto.randomUUID()}}
      else setError('Revisa el aviso. Si la información cambió, actualiza el equipo antes de repetir.')
    }finally{if(password.current)password.current.value='';sending.current=false}
  }
  return <section className={`${s.card} ${s['team-settings']}`} aria-labelledby={`${id}-title`}>
    <div className={s['card-head']}><div><h2 id={`${id}-title`} tabIndex={-1} className={s['card-title']}>Equipo administrador</h2><p className={s['card-sub']}>Cada cuenta tiene acceso completo al panel y a la gestión del equipo. Usa cuentas ficticias en estas pruebas.</p></div></div>
    <div className={s['team-actions']}><button type="button" className={`${s.btn} ${s['btn--primary']}`} disabled={connection.busy||!!task} onClick={()=>choose({kind:'create'})}>Agregar administrador</button><button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={connection.busy} onClick={()=>{setTask(null);setError('');void connection.refresh()}}>Actualizar equipo</button></div>
    <ul className={s.queue}>{connection.team.map(account=><li key={account.id} className={s['team-row']}>
      <div className={s['queue-person']}><Avatar name={account.name}/><div><strong>{account.name}{account.id===connection.user?.id?' · Tu cuenta':''}</strong><span>{account.email}</span><span>{!account.active?'Desactivada':account.activated?'Activa':'Pendiente de activación'}</span></div></div>
      <div className={s['team-actions']}>
        {account.active&&!account.activated&&<button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={connection.busy||!!task} onClick={()=>choose({kind:'invite',account})}>Preparar invitación<span className={s['sr-only']}> para {account.name}</span></button>}
        {account.id!==connection.user?.id&&<button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={connection.busy||!!task} onClick={()=>choose({kind:'status',account})}>{account.active?'Desactivar':'Reactivar'}<span className={s['sr-only']}> a {account.name}</span></button>}
      </div>
    </li>)}</ul>
    <p className={s.footnote}>No se borran cuentas. No puedes desactivar tu propia cuenta ni dejar el sistema sin una cuenta activa y activada. Las invitaciones pendientes no sustituyen a una cuenta activa.</p>
    {task&&<form key={task.kind==='create'?'create':`${task.kind}-${task.account.id}`} onSubmit={event=>{void submit(event)}} aria-label="Confirmar gestión del equipo" aria-busy={connection.busy}>
      <h3 className={s['card-title']}>{task.kind==='create'?'Nueva cuenta administrativa':task.kind==='invite'?`Invitar a ${task.account.name}`:`${task.account.active?'Desactivar':'Reactivar'} a ${task.account.name}`}</h3>
      {task.kind==='status'&&<p className={s.footnote}>{task.account.active?'Se cerrarán sus sesiones y se invalidarán sus enlaces de recuperación e invitación.':'Recuperará acceso completo al entrar de nuevo. Si no eligió contraseña, necesitará otra invitación.'}</p>}
      {task.kind==='invite'&&<p className={s.footnote}>Enlace privado de prueba de un uso y 24 horas. Preparar otro invalida el anterior. No se envía correo.</p>}
      <fieldset className={s['password-fields']} disabled={connection.busy}>
        {task.kind==='create'&&<><label htmlFor={`${id}-name`}>Nombre del administrador</label><input id={`${id}-name`} name="name" required minLength={2} maxLength={100} autoComplete="off"/><label htmlFor={`${id}-email`}>Correo del administrador</label><input id={`${id}-email`} name="email" type="email" required maxLength={160} autoComplete="off"/></>}
        <label htmlFor={`${id}-password`}>Tu contraseña actual</label><input ref={password} id={`${id}-password`} name="currentPassword" type="password" autoComplete="current-password" required maxLength={128}/>
        <label className={s.confirm}><input type="checkbox" name="confirmed" required/>Entiendo que esta cuenta tiene acceso completo a la administración.</label>
        <div className={s['team-actions']}><button className={`${s.btn} ${s['btn--primary']}`} disabled={!!changed} type="submit">{connection.busy?'Guardando…':task.kind==='create'?'Crear cuenta pendiente':task.kind==='invite'?'Preparar enlace de activación':task.account.active?'Confirmar desactivación':'Confirmar reactivación'}</button><button type="button" className={`${s.btn} ${s['btn--ghost']}`} onClick={()=>setTask(null)}>Cancelar</button></div>
      </fieldset>
      {(error||changed||connection.error)&&<p role="alert" className={s.alert}>{connection.error||error||'La cuenta cambió. Actualiza el equipo antes de continuar.'}</p>}
    </form>}
    {invitation&&<LocalInvitationDialog invitation={invitation} name={invitation.name} admin onClose={()=>{setInvitation(null);document.getElementById(`${id}-title`)?.focus()}}/>}
  </section>
}
