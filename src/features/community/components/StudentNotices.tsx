import { useCommunity } from '../context'
import s from '../community.module.css'

export function StudentNotices() {
  const { connection } = useCommunity()
  if (!connection) return null
  return <section className={s.profileActivity} aria-label="Mis avisos">
    <h3>Mis avisos</h3><p>Mensajes de tu cuenta guardados en CAI. Durante estas pruebas no se envían por correo.</p>
    <ul className={s.personalNotices}>{connection.notices.map(item=><li key={item.id} data-notice-id={item.id}><strong>{item.subject}</strong><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString('es-MX')} · {item.read?'Leído':'Nuevo'}</small>{!item.read&&<button className={s.secondaryButton} type="button" disabled={connection.busy} onClick={()=>{void connection.seen(item.id)}}>Marcar leído<span className={s.noticeHidden}>: {item.subject}</span></button>}</li>)}</ul>
    {!connection.notices.length&&<p>Todavía no tienes avisos.</p>}
  </section>
}
