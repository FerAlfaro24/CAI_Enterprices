import { useCommunity } from '../context'
import s from '../community.module.css'
import { MotionButton } from './CommunityMotion'

const items = [
  { id: 'home', label: 'Inicio' },
  { id: 'achievements', label: 'Logros' },
  { id: 'gallery', label: 'Galería' },
  { id: 'challenges', label: 'Retos' },
] as const

export function CommunityNavigation() {
  const { state, dispatch } = useCommunity()
  return (
    <nav className={s.sectionNav} aria-label="Secciones de comunidad">
      {items.map(({ id, label }) => (
        <MotionButton key={id} type="button" aria-current={state.section === id ? 'page' : undefined} onClick={() => dispatch({ type: 'section', section: id })}>
          {label}
        </MotionButton>
      ))}
    </nav>
  )
}
