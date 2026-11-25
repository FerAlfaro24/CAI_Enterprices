import { useCallback, useEffect, useRef, useState } from 'react'
import { accountEmailApi, ApiError, type LocalStudent } from '../../local-access/api'
import type { AccountEmailStatus } from '../../../../server/contracts'
import s from '../admin.module.css'

const states = { pending:'Pendiente de envío', sending:'Enviando…', accepted:'Aceptado por el servicio de correo', failed:'No se pudo enviar', cancelled:'Envío cancelado' } as const
export function StudentAccessEmail({ student, busy, onManual, onReload, onError }: {
  student:LocalStudent; busy:boolean; onManual:()=>Promise<unknown>; onReload:()=>Promise<unknown>; onError:(error:unknown)=>void
}) {
  const [enabled,setEnabled]=useState(false),[delivery,setDelivery]=useState<AccountEmailStatus|null>(null),[loading,setLoading]=useState(true),[sending,setSending]=useState(false),[error,setError]=useState('')
  const generation=useRef(0),writing=useRef(false),previous=useRef<string|null>(null)
  const load=useCallback(async()=>{
    const current=++generation.current
    try {
      const result=await accountEmailApi.status(student.id)
      if(current!==generation.current)return
      setEnabled(result.enabled);setDelivery(result.delivery);setError('')
      const state=result.delivery?.state??null
      if((previous.current==='pending'||previous.current==='sending')&&state==='accepted')void onReload()
      previous.current=state
    } catch(error){if(current===generation.current){setError(error instanceof Error?error.message:'No pudimos consultar el envío.');if(error instanceof ApiError&&error.status===401)onError(error)}}
    finally{if(current===generation.current)setLoading(false)}
  },[student.id,onError,onReload])
  useEffect(()=>{const sequence=generation;void Promise.resolve().then(load);return()=>{sequence.current++}},[load])
  useEffect(()=>{if(delivery?.state!=='pending'&&delivery?.state!=='sending')return;const timer=window.setInterval(()=>{void load()},2000);return()=>window.clearInterval(timer)},[delivery?.state,load])
  const resend=async()=>{
    if(writing.current)return
    writing.current=true;setSending(true);setError('')
    try{const result=await accountEmailApi.resend(student);setDelivery(result.delivery);await onReload()}
    catch(error){setError(error instanceof Error?error.message:'No pudimos preparar el envío.');if(error instanceof ApiError&&error.status===401)onError(error)}
    finally{writing.current=false;setSending(false)}
  }
  const pending=student.accountStatus==='pendiente',queued=delivery?.state==='pending'||delivery?.state==='sending'
  return <section className={s.accessNext} aria-label="Correo de acceso">
    <h3>{pending?'Siguiente paso: activar su cuenta':'Correo de acceso'}</h3>
    {loading?<p role="status">Comprobando el envío…</p>:enabled?<>
      <p>Los enlaces llegan al correo del registro. Cada enlace es privado y de un solo uso.</p>
      <p role="status"><strong>{delivery?states[delivery.state]:'Todavía no hay un envío para esta cuenta.'}</strong></p>
      {delivery?.state==='accepted'&&<p>Revisar también Spam. La aceptación del servicio no confirma que el alumno ya lo recibió o abrió.</p>}
      {delivery?.state==='failed'&&<p>La cuenta sigue aprobada. Puedes reintentar o preparar el enlace manualmente.</p>}
      <div className={s['head-actions']}>
        <button type="button" className={`${s.btn} ${s['btn--primary']}`} disabled={busy||sending||queued||student.status!=='activo'} onClick={()=>{void resend()}}>{sending?'Preparando envío…':pending?'Enviar enlace de activación':delivery?.kind==='google-approved'?'Reenviar aviso de aprobación':'Enviar recuperación de acceso'}</button>
        <button type="button" className={s.btn} disabled={busy||sending} onClick={()=>{void onReload().then(load)}}>Actualizar estado</button>
      </div>
    </>:<p>El envío de correos todavía no está configurado. Prepara un enlace y entrégalo al alumno por un canal privado.</p>}
    {pending&&student.status==='activo'&&<button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy||sending||queued} onClick={()=>{void onManual()}}>{enabled?'Preparar enlace manual':'Preparar acceso'}</button>}
    {error&&<p role="alert" className={s.alert}>{error}</p>}
  </section>
}
