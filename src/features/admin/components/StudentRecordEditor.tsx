import { useEffect,useId,useRef,useState,type FormEvent } from 'react'
import { ApiError,studentRecordApi,type StudentRecord,type StudentRecordDraft,type StudentRecordSnapshot } from '../../local-access/api'
import { ageFrom,visibleName } from '../../signup/options'
import { useAdmin } from '../state'
import s from '../admin.module.css'

const labels:Record<keyof StudentRecordSnapshot,string>={firstName:'Nombre',lastName:'Apellidos',birthDate:'Nacimiento',studentCode:'Matrícula',guardian:'Tutor',displayName:'Nombre visible',visibility:'Visibilidad',consentReference:'Referencia de autorización'}
const show=(value:StudentRecordSnapshot[keyof StudentRecordSnapshot])=>value&&typeof value==='object'?`${value.name} · ${value.relationship} · ${value.contact}`:value||'Sin registrar'
const emptyGuardian={name:'',relationship:'',contact:''}

export function StudentRecordEditor({studentId}:{studentId:string}){
  const {connection}=useAdmin(),id=useId(),generation=useRef(0),sending=useRef(false),password=useRef<HTMLInputElement>(null)
  const [record,setRecord]=useState<StudentRecord|null>(null),[draft,setDraft]=useState<StudentRecordDraft|null>(null)
  const [loading,setLoading]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('')
  const attempt=useRef({fingerprint:'',key:crypto.randomUUID()})
  useEffect(()=>{const sequence=generation;return()=>{sequence.current++}},[])
  if(!connection)return null
  const load=async(edit=true)=>{
    const version=++generation.current;setLoading(true);setError('');if(password.current)password.current.value=''
    try{
      const {record:current}=await studentRecordApi.get(studentId)
      if(version!==generation.current)return
      setRecord(current);setDraft(edit?{firstName:current.firstName,lastName:current.lastName,birthDate:current.birthDate,studentCode:current.studentCode,guardian:current.guardian,revision:current.revision,reason:'',consentReference:'',currentPassword:'',confirmed:false}:null)
      attempt.current={fingerprint:'',key:crypto.randomUUID()}
    }catch(error){if(version===generation.current){if(error instanceof ApiError&&error.status===401)connection.requireLogin('Tu sesión terminó. Vuelve a entrar para consultar el expediente.');else setError(error instanceof Error?error.message:'No pudimos cargar el expediente.')}}
    finally{if(version===generation.current)setLoading(false)}
  }
  const age=draft?ageFrom(draft.birthDate):null
  const minor=age!==null&&age<18
  const identityChanged=draft&&record&&['firstName','lastName','birthDate'].some(key=>draft[key as 'firstName'|'lastName'|'birthDate']!==record[key as 'firstName'|'lastName'|'birthDate'])
  const needsConsent=minor&&record&&(!record.consentReference||identityChanged||JSON.stringify(draft?.guardian??null)!==JSON.stringify(record.guardian))
  const preview=draft&&record?(minor?visibleName(draft.firstName,draft.lastName,record.displayName===visibleName(record.firstName,record.lastName,'initials')?'initials':'short'):record.displayName):''
  const busy=loading||connection.busy
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();if(!draft||sending.current||busy)return
    const values=new FormData(event.currentTarget)
    const data:StudentRecordDraft={...draft,guardian:minor?draft.guardian:null,currentPassword:String(values.get('currentPassword')),confirmed:values.get('confirmed')==='on'}
    const fingerprint=JSON.stringify({...data,currentPassword:undefined})
    if(attempt.current.fingerprint!==fingerprint)attempt.current={fingerprint,key:crypto.randomUUID()}
    sending.current=true;setError('');setMessage('')
    try{
      if(await connection.correctRecord(studentId,data,attempt.current.key)){setMessage('Expediente corregido. El alumno debe volver a entrar.');await load(false)}
      else setError('Revisa el aviso. Puedes reintentar el mismo envío o cargar el expediente actual antes de continuar.')
    }finally{if(password.current)password.current.value='';sending.current=false}
  }
  return <section className={s['record-editor']} aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>Expediente del alumno</h3>
    <p className={s['card-sub']}>Datos privados para coordinación. El correo de acceso, Google y el grupo se gestionan por separado.</p>
    {!draft&&!loading&&<button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={connection.busy} onClick={()=>{void load()}}>Corregir expediente</button>}
    {loading&&<p role="status">Cargando expediente…</p>}
    {message&&<p role="status" className={`${s.alert} ${s['alert--ok']}`}>{message}</p>}
    {record&&!draft&&<dl className={s.details}><dt>Nombre legal</dt><dd>{record.firstName} {record.lastName}</dd><dt>Nacimiento</dt><dd>{record.birthDate}</dd><dt>Matrícula</dt><dd>{record.studentCode||'Sin registrar'}</dd><dt>Correo de acceso</dt><dd>{record.email}</dd></dl>}
    {draft&&record&&<form aria-label="Corregir expediente del alumno" onSubmit={event=>{void submit(event)}}>
      <fieldset className={s['password-fields']} disabled={busy}>
        <label htmlFor={`${id}-first`}>Nombre del alumno</label><input id={`${id}-first`} value={draft.firstName} required minLength={2} maxLength={60} onChange={e=>setDraft({...draft,firstName:e.target.value})}/>
        <label htmlFor={`${id}-last`}>Apellidos del alumno</label><input id={`${id}-last`} value={draft.lastName} required minLength={2} maxLength={80} onChange={e=>setDraft({...draft,lastName:e.target.value})}/>
        <label htmlFor={`${id}-birth`}>Fecha de nacimiento</label><input id={`${id}-birth`} type="date" value={draft.birthDate} required onChange={e=>setDraft({...draft,birthDate:e.target.value})}/>
        <label htmlFor={`${id}-code`}>Matrícula</label><input id={`${id}-code`} value={draft.studentCode} maxLength={12} onChange={e=>setDraft({...draft,studentCode:e.target.value})}/>
        <p className={s['card-sub']}>Correo de acceso: {record.email}. Su corrección requiere verificar la identidad y el nuevo destinatario; aquí se conserva.</p>
        {minor&&<><h4>Madre, padre o tutor</h4>{([{key:'name',label:'Nombre del tutor',max:100,min:3},{key:'relationship',label:'Parentesco',max:60,min:2},{key:'contact',label:'Contacto del tutor',max:120,min:5}] as const).map(field=><div className={s['record-field']} key={field.key}><label htmlFor={`${id}-${field.key}`}>{field.label}</label><input id={`${id}-${field.key}`} value={draft.guardian?.[field.key]??''} required minLength={field.min} maxLength={field.max} onChange={e=>setDraft({...draft,guardian:{...(draft.guardian??emptyGuardian),[field.key]:e.target.value}})}/></div>)}
          <label htmlFor={`${id}-consent`}>Nueva referencia de autorización del tutor</label><input id={`${id}-consent`} value={draft.consentReference} required={!!needsConsent} minLength={8} maxLength={240} onChange={e=>setDraft({...draft,consentReference:e.target.value})}/>
          <p className={s['card-sub']}>{needsConsent?'Esta corrección requiere una nueva autorización comprobada y una referencia distinta de la anterior. Sus historias publicadas volverán a revisión.':'Solo completa la referencia si también renuevas la autorización.'} Referencia anterior: {record.consentReference||'Sin registrar'}.</p>
        </>}
        <p className={s.alert}>Nombre visible después de guardar: <strong>{preview||'Completa el nombre'}</strong>. {minor?'Se conservará privado y abreviado.':'La corrección legal no cambia automáticamente su alias.'} Se cerrarán las sesiones del alumno y se invalidarán sus enlaces anteriores. Un alumno suspendido seguirá suspendido.</p>
        <label htmlFor={`${id}-reason`}>Motivo de la corrección</label><input id={`${id}-reason`} value={draft.reason} required minLength={8} maxLength={240} onChange={e=>setDraft({...draft,reason:e.target.value})}/>
        <label htmlFor={`${id}-password`}>Tu contraseña actual</label><input ref={password} id={`${id}-password`} name="currentPassword" type="password" autoComplete="current-password" required maxLength={128}/>
        <label className={s.confirm}><input type="checkbox" name="confirmed" required/>Verifiqué los datos y, cuando corresponde, la autorización del tutor y los efectos de la corrección.</label>
        <div className={s['team-actions']}><button type="submit" className={`${s.btn} ${s['btn--primary']}`}>{connection.busy?'Guardando…':'Guardar corrección'}</button><button type="button" className={`${s.btn} ${s['btn--ghost']}`} onClick={()=>{setDraft(null);setError('');setMessage('')}}>Cancelar corrección</button><button type="button" className={`${s.btn} ${s['btn--ghost']}`} onClick={()=>{void load()}}>Cargar expediente y descartar borrador</button></div>
      </fieldset>
      {(error||connection.error)&&<p role="alert" className={s.alert}>{connection.error||error}</p>}
    </form>}
    {!draft&&error&&<p role="alert" className={s.alert}>{error}</p>}
    {record&&<details className={s['record-history']}><summary>Historial de correcciones ({record.history.length})</summary><p className={s['card-sub']}>Últimas 20 correcciones; el historial completo se conserva en la base privada.</p>{!record.history.length&&<p>Sin correcciones registradas.</p>}{record.history.map(item=><article key={item.id}><h4>{new Date(item.createdAt).toLocaleString('es-MX')} · {item.actor}</h4><p>{item.reason}</p><dl className={s.details}>{item.fields.map(field=><div key={field}><dt>{labels[field as keyof StudentRecordSnapshot]??field}</dt><dd>{show(item.before[field as keyof StudentRecordSnapshot])} → {show(item.after[field as keyof StudentRecordSnapshot])}</dd></div>)}</dl></article>)}</details>}
  </section>
}
