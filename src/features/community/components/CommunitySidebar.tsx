import { Link } from 'react-router'
import { useCommunity } from '../context'
import { demoMember } from '../data/members'
import s from '../community.module.css'
import { Avatar, CommunityIcon } from './ui'

const items = [
  { id: 'home', label: 'Inicio', icon: 'home' },
  { id: 'achievements', label: 'Logros', icon: 'award' },
  { id: 'gallery', label: 'Galería', icon: 'gallery' },
  { id: 'challenges', label: 'Retos', icon: 'spark' },
  { id: 'members', label: 'Alumnos', icon: 'users' },
] as const

export function CommunitySidebar() {
  const { state, dispatch } = useCommunity()
  const days = Object.keys(state.attempts).length
  return (
    <aside className={s.sidebar} aria-label="Tu espacio en la comunidad">
      <div className={s.sidebarInner}>
        <p className={s.sidebarLabel}>TU COMUNIDAD</p>
        <nav className={s.sectionNav} aria-label="Secciones de comunidad">
          {items.map(({ id, label, icon }) => <button key={id} type="button" aria-current={state.section === id ? 'page' : undefined} onClick={() => dispatch({ type: 'section', section: id })}><CommunityIcon name={icon} /><span>{label}</span>{id === 'challenges' && <span className={s.navDot} aria-hidden="true" />}</button>)}
        </nav>
        <div className={s.sidebarProfile}><Avatar member={demoMember} /><strong>{demoMember.alias}</strong><small>Tu perfil ficticio</small><span className={s.profileBadge}><CommunityIcon name="spark" size={14} />{days >= 3 ? 'Constancia que inspira' : demoMember.badge}</span><p>Los pequeños pasos también te llevan lejos.</p></div>
        <details className={s.communityAgreements}><summary><CommunityIcon name="shield" size={17} /> Un espacio que cuidamos</summary><p>Celebra sin comparar. Comenta con respeto y comparte solo contenido ficticio en esta demostración. Todos los perfiles son inventados.</p></details>
        <Link className={s.backToSite} to="/">← Volver al sitio CAI</Link>
      </div>
    </aside>
  )
}
