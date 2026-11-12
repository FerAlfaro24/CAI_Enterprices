import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, noticeApi, type LocalNotice, type ActivationInvitation } from './api'
import { LocalInvitationDialog } from './LocalInvitationDialog'
import s from '../admin/admin.module.css'

export function LocalNotices({ onAccessLost }: { onAccessLost?: () => Promise<void> }) {
  const [items,setItems]=useState<LocalNotice[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true)
  const [all,setAll]=useState(false),[preview,setPreview]=useState<{invitation:ActivationInvitation;name:string}|null>(null)
  const generation=useRef(0),writing=useRef(false)
  const failure=useCallback((error:unknown)=>{
    if(error instanceof ApiError&&error.status===401){setItems([]);setPreview(null);void onAccessLost?.()}
    setError(error instanceof Error?error.message:'No pudimos cargar los avisos.')
  },[onAccessLost])
  const load=useCallback(()=>{
    const current=++generation.current
    return noticeApi.list().then(({notices})=>{if(current===generation.current){setItems(notices);setError('')}})
      .catch((error:unknown)=>{if(current===generation.current)failure(error)}).finally(()=>{if(current===generation.current)setLoading(false)})
  },[failure])
  useEffect(()=>{const sequence=generation;void load();return()=>{sequence.current++}},[load])
  const action=async(item:LocalNotice,open:boolean)=>{
    if(writing.current)return
    writing.current=true;setBusy(true);setError('')
    try{if(open)setPreview({invitation:await noticeApi.preview(item.id),name:item.recipient});else{await noticeApi.acknowledge(item.id);await load()}}
    catch(error){failure(error)}finally{writing.current=false;setBusy(false)}
  }
  const visible=items.filter(item=>all||!item.acknowledged)
  return <>
    <p className={s.alert}>Avisos de pruebas locales. No se enviaron por correo. Los enlaces de recuperación son para comprobar el recorrido con cuentas ficticias; no prueban la identidad del destinatario.</p>
    <div className={s.toolbar}><div className={s.tabs} role="group" aria-label="Filtrar avisos"><button type="button" className={s.tab} aria-pressed={!all} onClick={()=>setAll(false)}>Por revisar<span>{items.filter(item=>!item.acknowledged).length}</span></button><button type="button" className={s.tab} aria-pressed={all} onClick={()=>setAll(true)}>Todos los avisos<span>{items.length}</span></button></div><button className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} type="button" onClick={()=>{void load()}}>Actualizar avisos</button></div>
    {error&&<p className={s.alert} role="alert">{error}</p>}
    {loading?<p role="status">Cargando avisos…</p>:<ul className={`${s.queue} ${s['inbox-records']}`} aria-label="Avisos de administración">{visible.map(item=><li key={item.id} data-notice-id={item.id}><div><strong>{item.subject}</strong><span>{item.recipient}</span><span>{item.message}</span><span>{item.acknowledged?'Revisado':'Por revisar'} · Sin envío de correo</span></div><div className={s['head-actions']}>{item.kind==='recovery'&&<button type="button" className={`${s.btn} ${s['btn--primary']}`} disabled={busy} onClick={()=>{void action(item,true)}}>Preparar enlace de prueba<span className={s['sr-only']}> para {item.recipient}</span></button>}{!item.acknowledged&&<button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={()=>{void action(item,false)}}>Marcar revisado<span className={s['sr-only']}>: {item.subject}</span></button>}</div></li>)}</ul>}
    {!loading&&!error&&!visible.length&&<p className={s.empty}>No hay avisos con este filtro.</p>}
    {preview&&<LocalInvitationDialog recovery invitation={preview.invitation} name={preview.name} onClose={()=>setPreview(null)}/>}
  </>
}
