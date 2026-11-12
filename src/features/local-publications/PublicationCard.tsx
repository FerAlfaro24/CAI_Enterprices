import { publicationCategories } from '../../../server/contracts'
import type { PublicationStatus, PublishedPost } from '../../../server/contracts'
import s from '../admin/admin.module.css'
import p from './publications.module.css'

const statusLabels: Record<PublicationStatus, string> = { pendiente: 'Pendiente de revisión', publicada: 'Publicada', rechazada: 'Rechazada', retirada: 'Retirada por el alumno' }

export function PublicationStatusLabel({ status }: { status: PublicationStatus }) {
  return <span className={p.pill}>{statusLabels[status]}</span>
}

export function PublicationCard({ post }: { post: PublishedPost }) {
  return <article className={`${s.card} ${p.post}`} aria-label={post.title}>
    <div className={p.author}>
      <span className={s.avatar} style={{ background: post.author.avatarColor }} aria-hidden="true">{post.author.displayName[0]}</span>
      <div><strong>{post.author.displayName}</strong><small>{publicationCategories[post.category]} · <time dateTime={post.publishedAt ?? post.createdAt}>{new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium' }).format(new Date(post.publishedAt ?? post.createdAt))}</time></small></div>
    </div>
    <h3 className={s['post-title']}>{post.title}</h3>
    <p className={p.body}>{post.body}</p>
  </article>
}
