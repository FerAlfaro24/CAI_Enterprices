import { useState } from 'react'
import { useAdmin } from '../features/admin/state'
import { ContactInbox } from '../features/admin/components/ContactInbox'
import { LocalNotices } from '../features/local-access/LocalNotices'
import s from '../features/admin/admin.module.css'

export function AdminInboxPage() {
  const { connection } = useAdmin()
  const [tab,setTab]=useState<'contacts'|'notices'>('contacts')
  return <>
    <div className={s['page-head']}><div><p className={s.eyebrow}>Comunicación y seguimiento</p><h1 className={s['page-title']}>Mensajes y avisos</h1><p className={s['page-lead']}>Atiende las consultas y revisa los avisos de acceso desde el mismo panel.</p></div></div>
    <div className={s.toolbar}><div className={s.tabs} role="group" aria-label="Bandejas de mensajes"><button type="button" className={s.tab} aria-pressed={tab==='contacts'} onClick={()=>setTab('contacts')}>Consultas de contacto</button><button type="button" className={s.tab} aria-pressed={tab==='notices'} onClick={()=>setTab('notices')}>Avisos de acceso</button></div></div>
    <section className={s.card} aria-label={tab==='contacts'?'Consultas de contacto':'Avisos de acceso'}>{tab==='contacts'?<ContactInbox/>:<LocalNotices onAccessLost={connection?.refresh}/>}</section>
  </>
}
