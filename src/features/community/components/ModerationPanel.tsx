import { useState } from 'react'
import { useCommunity } from '../context'
import { categoryLabels } from '../data/fixtures'
import { getMember } from '../data/members'
import s from '../community.module.css'
import { Avatar, CommunityIcon } from './ui'

export function ModerationPanel() {
  const { state, dispatch, connection } = useCommunity()
  if (connection || state.mode !== 'moderator') return null
  const pending = state.posts.filter((post) => post.status === 'pending')
  return (
    <section className={s.moderationPanel} aria-label="Revisión de publicaciones demo">
      <div className={s.moderationHeading}><span className={s.moderationIcon}><CommunityIcon name="shield" /></span><div><h2>Una pausa antes de compartir</h2><p>{pending.length} {pending.length === 1 ? 'publicación pendiente' : 'publicaciones pendientes'} · Moderación demo</p></div></div>
      <p className={s.moderationNote}>Puedes aprobar o rechazar estos ejemplos. Abre un aviso de CAI para fijarlo o desfijarlo. Esta vista no tiene permisos ni protección real.</p>
      {pending.length ? pending.map((post) => <article key={post.id} className={s.reviewItem} aria-label={`Revisar ${post.title}`}>
        <div className={s.reviewAuthor}><Avatar member={getMember(post.authorId)} small /><span>{getMember(post.authorId).alias}</span><small>{categoryLabels[post.category]}</small></div><h3>{post.title}</h3><p>{post.body}</p>{post.photos.length > 0 && <><small>{post.photos.length} {post.photos.length === 1 ? 'imagen ilustrativa seleccionada' : 'imágenes ilustrativas seleccionadas'}</small><div className={s.reviewPhotos} role="group" aria-label="Imágenes ilustrativas del borrador">{post.photos.map((photo) => <img key={photo.id} src={photo.src} alt={photo.alt} width="100" height="70" loading="lazy" />)}</div></>}
        <div className={s.reviewActions}><button type="button" className={s.smallPrimary} onClick={() => dispatch({ type: 'moderate', postId: post.id, decision: 'approved' })}><CommunityIcon name="check" size={16} /> Aprobar</button><button type="button" className={s.secondaryButton} onClick={() => dispatch({ type: 'moderate', postId: post.id, decision: 'rejected' })}>Rechazar</button></div>
      </article>) : <div className={s.reviewEmpty}><CommunityIcon name="check" /><p>Todo revisado por ahora. Crea una publicación de muestra para probar de nuevo el flujo.</p></div>}
    </section>
  )
}

export function MySubmissions() {
  const { state, connection } = useCommunity()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const posts = state.posts.filter((post) => post.authorId === 'alex')
  if (connection) return <section className={s.submissions} aria-label="Mis publicaciones"><h2>Mis publicaciones</h2>{!connection.mine.length && <p>Aquí podrás consultar tus envíos y su revisión.</p>}{connection.mine.map(post => <div key={post.id} data-publication-id={post.id}><span><strong>{post.title}</strong><small>{({ pendiente: 'Pendiente de revisión', publicada: 'Publicada', rechazada: 'Rechazada', retirada: 'Retirada' })[post.status]}</small>{post.reason && <small>Motivo: {post.reason}</small>}</span>{post.status !== 'retirada' && <span>{confirmId === post.id ? <><small>¿Retirar esta publicación? Dejará de ser visible.</small><button type="button" disabled={connection.busy} className={s.secondaryButton} onClick={() => setConfirmId(null)}>Cancelar</button><button type="button" disabled={connection.busy} className={s.secondaryButton} onClick={() => { void connection.withdraw(post).then(ok => { if (ok) setConfirmId(null) }) }}>Confirmar retiro</button></> : <button type="button" className={s.secondaryButton} aria-label={`Retirar ${post.title}`} disabled={connection.busy} onClick={() => setConfirmId(post.id)}>Retirar</button>}</span>}</div>)}</section>
  if (!posts.length) return null
  const labels = { pending: 'Pendiente de revisión', approved: 'Aprobada · Visible en el feed', rejected: 'Rechazada · No aparece en el feed' }
  return (
    <section className={s.submissions} aria-label="Estado de tus publicaciones demo">
      <h2>Tus publicaciones de muestra</h2>
      {posts.map((post) => <div key={post.id}><span><strong>{post.title}</strong><small>{labels[post.status]}</small></span><span className={[s.statusPill, s[post.status]].join(' ')}>{post.status === 'pending' ? 'Pendiente' : post.status === 'approved' ? 'Aprobada' : 'Rechazada'}</span></div>)}
    </section>
  )
}
