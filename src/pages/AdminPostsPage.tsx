import { normalizeSearch } from '../features/admin/search'
import { OfficialPublisher } from '../features/admin/components/OfficialPublisher'
import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { AdminCommentsPanel } from '../features/admin/components/AdminCommentsPanel'
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
  const [params,setParams]=useSearchParams()
  const official=params.get('bandeja')==='cai'
  const [query,setQuery]=useState('')
  const comments=Boolean(connection&&params.get('bandeja')==='comentarios')
  const [status, setStatus] = useState<PostStatus>('pendiente')
  const [type, setType] = useState<PostType | 'todas'>('todas')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const counts = countByStatus(state.posts, postStatuses)
  const visible = state.posts.filter((p) => p.status === status && (type === 'todas' || p.type === type) && normalizeSearch(`${p.title} ${p.author} ${p.program} ${p.id} ${p.body}`).includes(normalizeSearch(query)))
  const flagged = state.posts.filter((p) => p.status === 'pendiente' && (connection || p.checks)).length

  return (
    <>
      <div className={s['page-head']}>
        <div>
          <p className={s.eyebrow}>Moderación</p>
          <h1 className={s['page-title']}>Publicaciones</h1>
          <p className={s['page-lead']}>
            Revisa historias y comentarios de alumnos, o publica avisos y álbumes como Equipo CAI. Cada contenido conserva sus destinatarios autorizados.
          </p>
        </div>
        {connection&&!comments && <button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={connection.busy} onClick={() => { void connection.refresh() }}><Icon name="refresh" size={16} />Actualizar publicaciones</button>}
      </div>


      {connection&&<div className={s.tabs} role="group" aria-label="Tipo de moderación"><button type="button" className={s.tab} aria-pressed={!comments&&!official} onClick={()=>setParams({})}>Historias de alumnos</button><button type="button" className={s.tab} aria-pressed={comments} onClick={()=>setParams({bandeja:'comentarios'})}>Comentarios ({connection.commentCounts.pendiente} en revisión)</button><button type="button" className={s.tab} aria-pressed={official} onClick={()=>setParams({bandeja:'cai'})}>Equipo CAI · Publicar</button></div>}
      {connection?.configuration&&<div hidden={!official}><OfficialPublisher groups={connection.configuration.groups} onAccessLost={()=>{void connection.refresh()}}/></div>}
      {official?null:comments?<AdminCommentsPanel/>:<><section className={s.stats} aria-label="Resumen de moderación">
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

      <label className={s.listSearch}>Buscar publicación<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Título, alumno, programa o texto" /></label>
      <p className={s.resultCount} role="status">{visible.length} publicaciones con estos filtros</p>
      {visible.length === 0 ? (
        <p className={`${s.card} ${s.empty}`}>No hay publicaciones con estos filtros.</p>
      ) : (
        <div className={s['post-grid']}>
          {visible.map((post) => <PostCard key={post.id} post={post} onReview={() => setSelectedId(post.id)} />)}
        </div>
      )}
      <p className={s.footnote}>
        {connection ? 'Las decisiones se guardan. Retirar es definitivo; devolver a revisión oculta la historia del feed hasta una nueva aprobación.' : 'Publicaciones e imágenes ficticias. Las decisiones solo existen en esta pestaña y no publican nada.'}
      </p>

      <PostDialog post={state.posts.find((p) => p.id === selectedId) ?? null} onClose={() => setSelectedId(null)} />
      </>}
    </>
  )
}
