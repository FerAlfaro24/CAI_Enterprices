import { useCallback, useId, useRef, useState } from 'react'
import { useCommunity } from '../context'
import { useCommunityDialog } from '../useCommunityDialog'
import { CommunityIcon } from './ui'
import { StudentNotices } from './StudentNotices'
import s from '../community.module.css'

export function NotificationsDialog({onClose}:{onClose:()=>void}) {
  const {connection}=useCommunity(),dialog=useCommunityDialog(),id=useId()
  const viewed=useRef(new Set<number>()),closing=useRef(false),[saving,setSaving]=useState(false)
  const register=useCallback((ids:number[])=>{for(const id of ids)viewed.current.add(id)},[])
  const close=async()=>{
    if(closing.current||connection?.busy)return
    closing.current=true;setSaving(true)
    try {
      const ids=[...viewed.current]
      if(ids.length&&connection&&!await connection.archiveViewedNotices(ids))return
      onClose()
    } finally {closing.current=false;setSaving(false)}
  }
  return <dialog ref={dialog} className={`${s.profileDialog} ${s.noticeDialog}`} aria-labelledby={`${id}-title`} onCancel={event=>{event.preventDefault();event.stopPropagation();void close()}}>
    <div className={s.dialogHeading}><div><span className={s.eyebrow}>TU BANDEJA PERSONAL</span><h2 id={`${id}-title`}>Mis notificaciones</h2></div><button type="button" className={s.iconButton} disabled={saving||connection?.busy} onClick={()=>{void close()}} aria-label="Cerrar notificaciones"><CommunityIcon name="close"/></button></div>
    <div className={s.profileBody}><StudentNotices onViewed={register}/>{saving&&<p role="status">Guardando las notificaciones que viste…</p>}</div>
  </dialog>
}
