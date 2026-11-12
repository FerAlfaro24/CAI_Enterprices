import { useState } from 'react'
import { publicationCategories } from '../../../server/contracts'
import type { ReviewPost } from '../local-access/api'
import { PublicationStatusLabel } from './PublicationCard'
import s from '../admin/admin.module.css'
import p from './publications.module.css'

export function LocalPublications({ posts, onReview }: { posts: ReviewPost[]; onReview: (post: ReviewPost) => void }) {
  const [filter, setFilter] = useState('pendiente')
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLocaleLowerCase('es')
  const visible = posts.filter((post) => (filter === 'todas' || post.status === filter) && `${post.title} ${post.studentName} ${post.group}`.toLocaleLowerCase('es').includes(normalized))
  return <>
    <p className={s['card-sub']}>Abre una publicación, revisa el contenido y decide. El alumno verá el estado y el motivo si la rechazas.</p>
    <div className={s.toolbar}>
      <div className={s.tabs} role="group" aria-label="Estado de publicaciones">{[['pendiente', 'Pendientes'], ['publicada', 'Publicadas'], ['rechazada', 'Rechazadas'], ['retirada', 'Retiradas'], ['todas', 'Todas']].map(([value, label]) => <button type="button" key={value} className={s.tab} aria-pressed={filter === value} onClick={() => setFilter(value!)}>{label}</button>)}</div>
      <div className={s.search}><label htmlFor="publication-search" className={s['sr-only']}>Buscar publicación</label><input id="publication-search" type="search" placeholder="Buscar título, alumno o grupo" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    </div>
    <section className={s['post-grid']} aria-label="Publicaciones guardadas">
      {visible.map((post) => <article key={post.id} className={`${s.card} ${p.post}`} aria-label={post.title}>
        <div className={p.meta}><PublicationStatusLabel status={post.status} /><span>{publicationCategories[post.category]}</span></div>
        <h2 className={s['post-title']}>{post.title}</h2>
        <p className={p.body}>{post.body.length > 180 ? `${post.body.slice(0, 180)}…` : post.body}</p>
        <p className={s['card-sub']}>{post.studentName} · {post.program} · {post.group}</p>
        {!post.authorActive && <p className={s['request-hint']}>Autor sin acceso activo a este grupo.</p>}
        <button type="button" className={`${s.btn} ${s['btn--primary']}`} onClick={() => onReview(post)}>Revisar publicación<span className={s['sr-only']}>: {post.title}</span></button>
      </article>)}
    </section>
    {!visible.length && <p className={s.empty}>{query ? 'No encontramos coincidencias.' : 'No hay publicaciones en este estado.'}</p>}
  </>
}
