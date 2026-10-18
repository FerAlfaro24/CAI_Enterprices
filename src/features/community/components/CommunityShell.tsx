import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import emblem from '../../../assets/cai/logo-cai-emblema.svg'
import { PrototypeNotice } from '../../../components/PrototypeNotice'
import { useCommunity } from '../context'
import { demoMember } from '../data/members'
import s from '../community.module.css'
import { CommunityAside } from './RecognitionPanels'
import { CommunitySidebar } from './CommunitySidebar'
import { Avatar, CommunityIcon } from './ui'

export function CommunityShell({ children }: { children: ReactNode }) {
  const { state, dispatch } = useCommunity()
  useEffect(() => {
    document.title = 'CAI Community · Comunidad de alumnos · Demo'
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])
  return (
    <div className={s.community}>
      <a className={s.skipLink} href="#community-content">Saltar al contenido de comunidad</a>
      <div className={s.prototypeNotice}><PrototypeNotice /></div>
      <header className={s.topbar}>
        <div className={s.topbarInner}>
          <Link to="/community" className={s.communityBrand} aria-label="CAI Community, inicio" onClick={() => dispatch({ type: 'section', section: 'home' })}><img src={emblem} alt="" width="48" height="45" /><span>Community<small>EL INGLÉS NOS CONECTA</small></span></Link>
          <nav className={s.areaNav} aria-label="Áreas del prototipo"><Link to="/">Institucional</Link><Link to="/community" aria-current="page">Comunidad</Link><Link to="/admin">Administración</Link></nav>
          <div className={s.currentMember}><Avatar member={demoMember} small /><span>Alex Demo<small>Perfil ficticio</small></span></div>
        </div>
      </header>
      <div className={s.demoToolbar}>
        <div><span className={s.demoDate}><span aria-hidden="true">✦</span> Escenario ficticio · Octubre 2026</span><div className={s.demoTools}><label htmlFor="community-demo-mode">Vista demo</label><select id="community-demo-mode" value={state.mode} onChange={(event) => dispatch({ type: 'mode', mode: event.target.value === 'moderator' ? 'moderator' : 'student' })}><option value="student">Alumno</option><option value="moderator">Moderador</option></select><button type="button" onClick={() => dispatch({ type: 'reset' })}><CommunityIcon name="reset" size={15} /> Reiniciar demo</button></div></div>
        <p className={s.demoStatus} role="status" aria-live="polite" aria-atomic="true">{state.notice || 'Todo es ficticio. Los cambios solo duran durante esta visita a la comunidad.'}</p>
      </div>
      <div className={s.workspace}>
        <CommunitySidebar />
        <main id="community-content" tabIndex={-1} className={s.mainColumn}>{children}</main>
        <CommunityAside />
      </div>
      <footer className={s.communityFooter}><span>CAI Community · Un prototipo para imaginar lo que podemos construir juntos.</span><span>Sin cuentas reales ni datos de alumnos. <Link to="/">Sitio institucional ↗</Link></span></footer>
    </div>
  )
}
