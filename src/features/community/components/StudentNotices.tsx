import { useCommunity } from '../context'
import { useState } from 'react'
import { CommunityIcon } from './ui'
import s from '../community.module.css'

export function StudentNotices() {
  const { connection } = useCommunity()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [message, setMessage] = useState('')
  if (!connection) return null
  const unread = connection.notices.filter(item => !item.read).length
  const visible = connection.notices.filter(item => filter === 'all' || !item.read)
  return <section className={s.profileActivity} aria-label="Mis avisos">
    <p>Todo lo importante de tu cuenta, en un solo lugar. Solo tú puedes ver estos mensajes.</p>
    <div className={s.noticeFilters} role="group" aria-label="Filtrar mis notificaciones"><button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Todas ({connection.notices.length})</button><button type="button" aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>Sin leer ({unread})</button></div>
    <ul className={s.personalNotices}>{visible.map(item => <li key={item.id} data-notice-id={item.id} data-unread={!item.read}>
      <span className={s.noticeIcon}><CommunityIcon name={item.read ? 'check' : 'comment'} size={21} /></span>
      <div><span className={s.noticeState}>{item.read ? 'LEÍDO' : 'NUEVO PARA TI'}</span><strong>{item.subject}</strong><p>{item.message}</p><small><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('es-MX')}</time></small>{!item.read && <button className={s.secondaryButton} type="button" disabled={connection.busy} onClick={async () => { if (await connection.seen(item.id)) setMessage('Mensaje marcado como leído.') }}>Marcar leído<span className={s.noticeHidden}>: {item.subject}</span></button>}</div>
    </li>)}</ul>
    {!visible.length && <div className={s.noticesEmpty}><CommunityIcon name="check" size={34} /><h3>{filter === 'unread' ? '¡Estás al día!' : 'Tu bandeja está tranquila.'}</h3><p>{filter === 'unread' ? 'Ya leíste todos tus mensajes. Puedes consultar los anteriores en Todas.' : 'Cuando CAI tenga un mensaje para ti, aparecerá aquí.'}</p></div>}
    {message && <p role="status">{message}</p>}
    {connection.error && <p role="alert">{connection.error}</p>}
    <small>Durante estas pruebas los mensajes se guardan aquí; no se envían por correo.</small>
  </section>
}
