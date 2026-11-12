import { useState } from 'react'
import s from '../features/admin/admin.module.css'
import { Icon } from '../features/admin/components/ui'
import { PostCard, PostDialog } from '../features/admin/components/posts'
import { postTypes, type PostStatus, type PostType } from '../features/admin/data/mockData'
import { countByStatus, postStatuses, useAdmin } from '../features/admin/state'

const statusFilters: { value: PostStatus; label: string }[] = [
  { value: 'pendiente', label: 'En revisión' },
  { value: 'publicada', label: 'Publicadas' },
  { value: 'rechazada', label: 'Rechazadas' },
  { value: 'retirada', label: 'Retiradas' },
]

export function AdminPostsPage() {
  const { state, connection } = useAdmin()
  const [status, setStatus] = useState<PostStatus>('pendiente')
  const [type, setType] = useState<PostType | 'todas'>('todas')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const counts = countByStatus(state.posts, postStatuses)
  const visible = state.posts.filter((p) => p.status === status && (type === 'todas' || p.type === type))
  const flagged = state.posts.filter((p) => p.status === 'pendiente' && (connection || p.checks)).length

  return (
    <>
      <div className={s['page-head']}>
        <div>
          <p className={s.eyebrow}>Moderación</p>
          <h1 className={s['page-title']}>Publicaciones</h1>
          <p className={s['page-lead']}>
            Revisa el texto y la privacidad antes de publicar. Solo los alumnos del mismo programa y grupo podrán ver cada historia aprobada.
          </p>
        </div>
        {connection && <button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={connection.busy} onClick={() => { void connection.refresh() }}><Icon name="refresh" size={16} />Actualizar publicaciones</button>}
      </div>

      <section className={s.stats} aria-label="Resumen de moderación">
        <p><strong>{counts.pendiente}</strong>en revisión</p>
        <p><strong>{flagged}</strong>requieren verificación</p>
        <p><strong>{counts.publicada}</strong>publicadas</p>
        <p><strong>{counts.rechazada}</strong>rechazadas</p>
      </section>

      <div className={s.toolbar}>
        <div className={s.tabs} role="group" aria-label="Filtrar por estado">
          {statusFilters.map(({ value, label }) => (
            <button key={value} type="button" className={s.tab} aria-pressed={status === value} onClick={() => setStatus(value)}>
              {label}<span>{counts[value]}</span>
            </button>
          ))}
        </div>
        <div className={s.chips} role="group" aria-label="Filtrar por tipo">
          <button type="button" className={s.chip} aria-pressed={type === 'todas'} onClick={() => setType('todas')}>Todos los tipos</button>
          {(Object.keys(postTypes) as PostType[]).filter(key => !connection || ['logro', 'experiencia'].includes(key)).map((key) => (
            <button key={key} type="button" className={s.chip} aria-pressed={type === key} onClick={() => setType(key)}>
              {postTypes[key].label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className={`${s.card} ${s.empty}`}>No hay publicaciones con estos filtros.</p>
      ) : (
        <div className={s['post-grid']}>
          {visible.map((post) => <PostCard key={post.id} post={post} onReview={() => setSelectedId(post.id)} />)}
        </div>
      )}
      <p className={s.footnote}>
        {connection ? 'Revisión guardada en este equipo. Retirar es definitivo; devolver a revisión oculta la historia del feed hasta una nueva aprobación.' : 'Publicaciones e imágenes ficticias. Las decisiones solo existen en esta pestaña y no publican nada.'}
      </p>

      <PostDialog post={state.posts.find((p) => p.id === selectedId) ?? null} onClose={() => setSelectedId(null)} />
    </>
  )
}
