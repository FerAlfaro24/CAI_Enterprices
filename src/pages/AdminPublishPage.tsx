import { useCallback,useEffect,useRef } from 'react'
import { useAdmin } from '../features/admin/state'
import { OfficialPublisher } from '../features/admin/components/OfficialPublisher'
import s from '../features/admin/admin.module.css'

export function AdminPublishPage() {
  const {connection}=useAdmin(),requireLogin=useRef(connection?.requireLogin)
  useEffect(()=>{requireLogin.current=connection?.requireLogin},[connection?.requireLogin])
  const lost=useCallback(()=>requireLogin.current?.('Tu sesión terminó. Vuelve a entrar para publicar.'),[])
  return <><header className={s['page-head']}><div><p className={s.eyebrow}>EQUIPO CAI</p><h1 className={s['page-title']}>Crear publicación</h1><p className={s['page-lead']}>Una experiencia para compartir o un aviso importante. Elige el tipo y añade imágenes si quieres.</p></div></header><OfficialPublisher onAccessLost={lost} onPublished={connection?.refresh}/></>
}
