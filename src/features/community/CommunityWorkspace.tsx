import { useEffect, useState } from 'react'
import { useCommunity } from './context'
import { members } from './data/members'
import { selectFeed } from './model'
import type { FeedFilter, Section } from './types'
import s from './community.module.css'
import { Composer } from './components/Composer'
import { DailyChallenge } from './components/DailyChallenge'
import { MemberDirectory } from './components/MemberDirectory'
import { ModerationPanel, MySubmissions } from './components/ModerationPanel'
import { PostCard } from './components/PostCard'
import { Avatar, CommunityIcon } from './components/ui'
import { demoMember } from './data/members'

const headings: Record<Section, { eyebrow: string; title: string; description: string }> = {
  home: { eyebrow: 'UN ESPACIO PARA CRECER JUNTOS', title: 'Cada pequeño paso cuenta.', description: 'Comparte lo que aprendes, celebra a alguien más y encuentra esa pequeña chispa para seguir.' },
  achievements: { eyebrow: 'AVANCES A TU PROPIO RITMO', title: 'Celebramos el paso, no la perfección.', description: 'Una palabra que por fin sale, una conversación que empieza. Aquí todos los avances tienen un lugar.' },
  gallery: { eyebrow: 'MOMENTOS QUE NOS ACERCAN', title: 'Una comunidad, muchas historias.', description: 'Un álbum de inspiración con fotografías de stock. Ninguna imagen representa a alumnos o instalaciones de CAI.' },
  challenges: { eyebrow: 'LA MISMA PREGUNTA PARA TODOS', title: 'Un reto. Un nuevo pequeño paso.', description: 'Prueba, descubre y vuelve por curiosidad. Sin niveles separados, tiempo límite ni penalizaciones.' },
  members: { eyebrow: 'BIENVENIDOS A CAI', title: 'Voces distintas, ganas compartidas.', description: 'Conoce a los personajes de esta demostración. Todos los alias, biografías e insignias son ficticios.' },
}

const filters: { id: FeedFilter; label: string }[] = [
  { id: 'recent', label: 'Recientes' }, { id: 'achievements', label: 'Logros' },
  { id: 'experiences', label: 'Experiencias' }, { id: 'celebrated', label: 'Más celebradas' },
]

export function CommunityWorkspace() {
  const { state, dispatch } = useCommunity()
  const [composerOpen, setComposerOpen] = useState(false)
  const heading = headings[state.section]
  const posts = selectFeed(state)
  const feedVisible = ['home', 'achievements', 'gallery'].includes(state.section)

  useEffect(() => {
    if (!state.focusRequest) return
    const frame = requestAnimationFrame(() => {
      const target = document.getElementById(state.focusedPostId ? `post-${state.focusedPostId}` : 'community-title')
      target?.focus({ preventScroll: true })
      target?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [state.focusedPostId, state.focusRequest])

  return (
    <>
      <header className={s.welcomeHeader}>
        <div><span className={s.eyebrow}>{heading.eyebrow}</span><h1 id="community-title" tabIndex={-1}>{heading.title}</h1><p>{heading.description}</p><div className={s.communityNumbers}><span><i aria-hidden="true" />{members.filter((member) => !member.institution).length} alumnos ficticios</span><span>{state.posts.filter((post) => post.status === 'approved').length} historias compartidas</span></div></div>
        {state.section === 'home' && <button className={s.challengeTeaser} type="button" onClick={() => dispatch({ type: 'section', section: 'challenges' })}><span aria-hidden="true">✦</span><small>EL RETO DE HOY</small><strong>¿Te animas a intentarlo?</strong><span>Un pequeño paso juntos <CommunityIcon name="arrow" size={16} /></span></button>}
      </header>
      <ModerationPanel />
      <MySubmissions />
      {feedVisible && <>
        <button type="button" className={s.composerTrigger} onClick={() => setComposerOpen(true)}><Avatar member={demoMember} /><span>¿Qué pequeño paso quieres compartir?<small>Crear una publicación ficticia</small></span><span className={s.composePlus}><CommunityIcon name="plus" /></span></button>
        <div className={s.feedToolbar}>
          {state.section === 'home' ? <div className={s.filters} role="group" aria-label="Filtrar publicaciones">{filters.map(({ id, label }) => <button key={id} type="button" aria-pressed={state.filter === id} onClick={() => dispatch({ type: 'filter', filter: id })}>{label}</button>)}</div> : <h2>{state.section === 'achievements' ? 'Nuestros pequeños grandes logros' : 'El álbum de la comunidad'}</h2>}
          <p>{posts.length} publicaciones · {state.filter === 'celebrated' ? 'Celebraciones, con avisos fijados primero' : 'Avisos fijados primero, después lo más reciente'}</p>
        </div>
        <section className={s.feed} aria-label="Feed de publicaciones ficticias">
          {posts.length ? posts.map((post) => <PostCard key={`${post.id}-${state.resetKey}`} post={post} />) : <div className={s.emptyState}><CommunityIcon name="book" size={32} /><h2>El próximo pequeño paso puede ser tuyo</h2><p>No hay publicaciones de este tipo en la demostración.</p></div>}
        </section>
        <div className={s.feedEnd}><CommunityIcon name="spark" /><p>Ya conoces todas las historias de esta demo.<br /><span>Gracias por celebrar el camino, no solo la meta.</span></p></div>
      </>}
      {state.section === 'challenges' && <><DailyChallenge expanded /><div className={s.challengeReflection}><CommunityIcon name="award" size={32} /><div><h2>La constancia también se celebra</h2><p>Participa en tres días simulados para descubrir una insignia. Cada día suma una sola vez; elegir una respuesta incorrecta también da puntos por participar.</p></div></div></>}
      {state.section === 'members' && <MemberDirectory />}
      {composerOpen && <Composer onClose={() => setComposerOpen(false)} />}
    </>
  )
}
