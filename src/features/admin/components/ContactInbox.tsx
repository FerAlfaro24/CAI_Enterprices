import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { ApiError, contactApi, type ContactInquiry, type ContactStatus } from '../../local-access/api'
import { contactPrograms } from '../../landing/data/content'
import { useAdmin } from '../state'
import s from '../admin.module.css'

const statuses: Record<ContactStatus, string> = { nueva: 'Nueva', seguimiento: 'En seguimiento', atendida: 'Atendida' }

export function ContactInbox() {
  const { connection } = useAdmin()
  const [items, setItems] = useState<ContactInquiry[]>([]), [error, setError] = useState(''), [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null), [filter, setFilter] = useState<ContactStatus | 'todas'>('nueva')
  const [busy, setBusy] = useState(false)
  const generation = useRef(0), writing = useRef(false)
  const onAccessLost = connection?.refresh
  const failure = useCallback((error: unknown) => {
    if(error instanceof ApiError && error.status===401){setItems([]);setSelected(null);void onAccessLost?.()}
    setError(error instanceof Error ? error.message : 'No pudimos cargar las consultas.')
  },[onAccessLost])
  const refresh=useCallback(()=>{
    const current=++generation.current
    return contactApi.list().then(({contacts})=>{if(current===generation.current){setItems(contacts);setError('')}})
      .catch((error:unknown)=>{if(current===generation.current)failure(error)}).finally(()=>{if(current===generation.current)setLoading(false)})
  },[failure])
  useEffect(()=>{const sequence=generation;void refresh();return()=>{sequence.current++}},[refresh])
  const save=async(item:ContactInquiry,status:ContactStatus,note:string)=>{
    if(writing.current)return false
    writing.current=true;setBusy(true);setError('')
    try{await contactApi.update(item,status,note);await refresh();setSelected(null);return true}
    catch(error){failure(error);if(error instanceof ApiError&&error.status===409){await refresh();setError(error.message)}return false}
    finally{writing.current=false;setBusy(false)}
  }
  return <>
    <p className={s.alert}>Consultas guardadas localmente. El seguimiento y las notas son internos; no envían respuestas por correo ni reservan clases.</p>
    <div className={s.toolbar}><div className={s.tabs} role="group" aria-label="Filtrar consultas">{(['nueva','seguimiento','atendida','todas'] as const).map(status=><button type="button" key={status} className={s.tab} aria-pressed={filter===status} onClick={()=>setFilter(status)}>{status==='todas'?'Todas':statuses[status]}<span>{items.filter(item=>status==='todas'||item.status===status).length}</span></button>)}</div><button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={()=>{void refresh()}}>Actualizar consultas</button></div>
    {error&&<p role="alert" className={s.alert}>{error}</p>}
    {loading?<p role="status">Cargando consultas…</p>:<ul className={`${s.queue} ${s['inbox-records']}`} aria-label="Consultas de contacto">{items.filter(item=>filter==='todas'||item.status===filter).map(item=><li key={item.id}><div><strong>{item.name}</strong><span>{item.id} · {statuses[item.status]}</span><span>{item.contact}</span><span>{contactPrograms.find(program=>program.id===item.program)?.title??item.program}</span><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('es-MX')}</time></div><button type="button" className={`${s.btn} ${s['btn--ghost']}`} onClick={()=>setSelected(item.id)}>Atender<span className={s['sr-only']}> consulta {item.id}</span></button></li>)}</ul>}
    {!loading&&!error&&!items.some(item=>filter==='todas'||item.status===filter)&&<p className={s.empty}>No hay consultas con este filtro.</p>}
    {selected&&items.find(item=>item.id===selected)&&<ContactDialog key={`${selected}-${items.find(item=>item.id===selected)!.revision}`} item={items.find(item=>item.id===selected)!} error={error} busy={busy} onSave={save} onClose={()=>{if(!busy)setSelected(null)}}/>}
  </>
}

function ContactDialog({item,error,busy,onSave,onClose}:{item:ContactInquiry;error:string;busy:boolean;onSave:(item:ContactInquiry,status:ContactStatus,note:string)=>Promise<boolean>;onClose:()=>void}){
  const ref=useRef<HTMLDialogElement>(null),id=useId()
  const [status,setStatus]=useState(item.status),[note,setNote]=useState(item.note)
  useEffect(()=>{ref.current?.showModal()},[])
  const submit=(event:FormEvent)=>{event.preventDefault();void onSave(item,status,note)}
  return <dialog ref={ref} className={s.dialog} aria-labelledby={`${id}-title`} onCancel={event=>{event.preventDefault();onClose()}} onClose={onClose}>
    <div className={s['dialog-head']}><div><h2 id={`${id}-title`}>Atender consulta {item.id}</h2><p>{item.name} · {item.contact}</p></div><button type="button" className={s['icon-btn']} disabled={busy} aria-label="Cerrar consulta" onClick={onClose}>×</button></div>
    <form className={`${s['dialog-body']} ${s['contact-followup']}`} onSubmit={submit} aria-label="Seguimiento de consulta">
      <p>Programa: {contactPrograms.find(program=>program.id===item.program)?.title??item.program}</p><p className={s['card-sub']}>Aceptó el uso de sus datos para atender esta consulta. Estas notas solo son visibles para coordinación.</p>
      <label htmlFor={`${id}-status`}>Estado</label><select id={`${id}-status`} value={status} disabled={busy} onChange={event=>setStatus(event.target.value as ContactStatus)}>{Object.entries(statuses).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select>
      <label htmlFor={`${id}-note`}>Nota interna</label><textarea id={`${id}-note`} value={note} maxLength={500} rows={4} disabled={busy} onChange={event=>setNote(event.target.value)} placeholder="Anota el siguiente paso o la atención realizada"/>
      {error&&<p role="alert" className={s.alert}>{error}</p>}<button type="submit" className={`${s.btn} ${s['btn--primary']}`} disabled={busy}>{busy?'Guardando…':'Guardar seguimiento'}</button>
    </form>
  </dialog>
}
