import { useEffect, useId, useState } from 'react'
import { useCommunity } from '../context'
import { useCommunityDialog } from '../useCommunityDialog'
import { CommunityIcon } from './ui'
import s from '../community.module.css'

function ClearHistoryConfirmation({count,busy,error,onCancel,onConfirm}:{count:number;busy:boolean;error:string;onCancel:()=>void;onConfirm:()=>void}) {
  const dialog=useCommunityDialog(),id=useId()
  return <dialog ref={dialog} className={`${s.profileDialog} ${s.clearNoticesDialog}`} aria-labelledby={id} onCancel={event=>{event.preventDefault();event.stopPropagation();if(!busy)onCancel()}}>
    <h2 id={id}>¿Vaciar el historial?</h2><p>Se quitarán {count} notificaciones que ya leíste de tu historial. No podrás recuperarlas desde esta pantalla. Las notificaciones sin leer se conservarán.</p>
    {error&&<p role="alert">{error}</p>}<div className={s.noticeConfirmActions}><button type="button" className={s.secondaryButton} disabled={busy} onClick={onCancel}>Cancelar</button><button type="button" className={s.primaryButton} disabled={busy} onClick={onConfirm}>{busy?'Vaciando…':'Sí, vaciar historial'}</button></div>
  </dialog>
}
export function StudentNotices({onViewed}:{onViewed:(ids:number[])=>void}) {
  const {connection}=useCommunity()
  const [filter,setFilter]=useState<'unread'|'history'>('unread'),[message,setMessage]=useState(''),[clearIds,setClearIds]=useState<number[]|null>(null)
  const ordinaryIds=connection?.notices.filter(item=>!item.read&&!item.important).map(item=>item.id)??[]
  const signature=ordinaryIds.join(',')
  useEffect(()=>{if(filter==='unread')onViewed(signature?signature.split(',').map(Number):[])},[filter,signature,onViewed])
  if(!connection)return null
  const unread=connection.notices.filter(item=>!item.read),history=connection.notices.filter(item=>item.read)
  const visible=filter==='unread'?unread:history
  const clear=async()=>{if(clearIds&&await connection.dismissNotices(clearIds)){setClearIds(null);setMessage('Se vació el historial seleccionado.')}}
  return <section className={s.profileActivity} aria-label="Mis avisos">
    <p>Las novedades normales pasarán al historial cuando cierres esta bandeja. Las importantes necesitan tu confirmación.</p>
    <div className={s.noticeFilters} role="group" aria-label="Filtrar mis notificaciones"><button type="button" aria-pressed={filter==='unread'} onClick={()=>setFilter('unread')}>Sin leer ({unread.length})</button><button type="button" aria-pressed={filter==='history'} onClick={()=>setFilter('history')}>Historial ({history.length})</button></div>
    {filter==='history'&&history.length>0&&<div className={s.noticeHistoryActions}><span>{history.length} notificaciones vistas</span><button type="button" className={s.secondaryButton} disabled={connection.busy} onClick={()=>setClearIds(history.map(item=>item.id))}>Vaciar historial</button></div>}
    <ul className={s.personalNotices}>{visible.map(item=><li key={item.id} data-notice-id={item.id} data-unread={!item.read} data-important={item.important}>
      <span className={s.noticeIcon}><CommunityIcon name={item.important&&!item.read?'bell':item.read?'check':'comment'} size={21}/></span>
      <div><span className={s.noticeState}>{!item.read?(item.important?'IMPORTANTE · REQUIERE TU CONFIRMACIÓN':'NUEVO PARA TI'):'EN TU HISTORIAL'}</span><strong>{item.subject}</strong><p>{item.message}</p><small><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('es-MX')}</time></small>
        {!item.read&&item.important&&<button className={s.secondaryButton} type="button" disabled={connection.busy} onClick={async()=>{if(await connection.seen(item.id))setMessage('Notificación importante marcada como leída.')}}>Marcar leído<span className={s.noticeHidden}>: {item.subject}</span></button>}
      </div>
      {item.read&&<button type="button" className={s.noticeDelete} aria-label={'Eliminar del historial: '+item.subject} title="Eliminar del historial" disabled={connection.busy} onClick={async()=>{if(await connection.dismissNotices([item.id]))setMessage('Notificación eliminada del historial.')}}><CommunityIcon name="close" size={18}/></button>}
    </li>)}</ul>
    {!visible.length&&<div className={s.noticesEmpty}><CommunityIcon name="check" size={34}/><h3>{filter==='unread'?'¡Estás al día!':'Tu historial está vacío.'}</h3><p>{filter==='unread'?'Cuando tengas novedades aparecerán aquí. Puedes consultar lo que ya viste en Historial.':'Aquí quedarán las notificaciones que ya viste al cerrar la bandeja.'}</p></div>}
    {message&&<p role="status">{message}</p>}{connection.error&&!clearIds&&<p role="alert">{connection.error}</p>}
    {clearIds&&<ClearHistoryConfirmation count={clearIds.length} busy={connection.busy} error={connection.error} onCancel={()=>setClearIds(null)} onConfirm={()=>{void clear()}}/>}
  </section>
}
