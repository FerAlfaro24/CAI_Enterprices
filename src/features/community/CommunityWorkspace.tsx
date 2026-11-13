import { useEffect } from 'react'
import { useCommunity } from './context'
import { members } from './data/members'
import type { Section } from './types'
import s from './community.module.css'
import { MemberDirectory } from './components/MemberDirectory'
import { ModerationPanel, MySubmissions } from './components/ModerationPanel'
import { CommunitySectionLayout } from './components/CommunitySectionLayout'
import { HomeView } from './home/HomeView'
import { ChallengesView } from './challenges/ChallengesView'
import { GalleryView } from './gallery/GalleryView'
import { AchievementsView } from './achievements/AchievementsView'

const headings: Record<Section, { eyebrow: string; title: string; description: string }> = {
  home: { eyebrow: '', title: '', description: '' },
  achievements: { eyebrow: 'AVANCES A TU PROPIO RITMO', title: 'Celebramos el paso, no la perfección.', description: 'Una palabra que por fin sale, una conversación que empieza. Aquí todos los avances tienen un lugar.' },
  gallery: { eyebrow: 'MOMENTOS QUE NOS ACERCAN', title: 'Una comunidad, muchas historias.', description: 'Un álbum de inspiración con fotografías de stock. Ninguna imagen representa a alumnos o instalaciones de CAI.' },
  challenges: { eyebrow: 'LA MISMA PREGUNTA PARA TODOS', title: 'Un reto. Un nuevo pequeño paso.', description: 'Prueba, descubre y vuelve por curiosidad. Sin niveles separados, tiempo límite ni penalizaciones.' },
  members: { eyebrow: 'BIENVENIDOS A CAI', title: 'Voces distintas, ganas compartidas.', description: 'Conoce a los personajes de esta demostración. Todos los alias, biografías e insignias son ficticios.' },
}

export function CommunityWorkspace() {
  const { state, connection } = useCommunity()
  const heading = headings[state.section]

  useEffect(() => {
    if (!state.focusRequest) return
    const frame = requestAnimationFrame(() => {
      if (state.section === 'home' && state.focusedPostId) return
      const target = document.getElementById('community-title')
      target?.focus({ preventScroll: true })
      target?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    })
    return () => cancelAnimationFrame(frame)
  }, [state.focusedPostId, state.focusRequest, state.section])

  if (state.section === 'home') return <HomeView key={state.resetKey} />
  if (state.section === 'challenges') return <ChallengesView />
  if (state.section === 'gallery') return <GalleryView key={state.resetKey} />
  if (state.section === 'achievements') return <AchievementsView key={state.resetKey} />

  return (
    <CommunitySectionLayout>
      <header className={s.welcomeHeader}>
        <div><span className={s.eyebrow}>{heading.eyebrow}</span><h1 id="community-title" tabIndex={-1}>{heading.title}</h1><p>{connection ? 'Alias de alumnos activos de tu programa y grupo.' : heading.description}</p><div className={s.communityNumbers}><span><i aria-hidden="true" />{(connection?.members ?? members).filter((member) => !member.institution).length} {connection ? 'alumnos de tu grupo' : 'alumnos ficticios'}</span><span>{state.posts.filter((post) => post.status === 'approved').length} historias compartidas</span></div></div>
      </header>
      <ModerationPanel />
      <MySubmissions />
      {state.section === 'members' && <MemberDirectory />}
    </CommunitySectionLayout>
  )
}
