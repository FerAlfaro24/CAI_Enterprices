import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useCommunity } from '../context'
import { demoMember } from '../data/members'
import s from '../community.module.css'
import themeStyles from '../communityTheme.module.css'
import { useCommunityTheme } from '../useCommunityTheme'
import { CommunityNavigation } from './CommunityNavigation'
import { MemberProfileDialog } from './MemberProfileDialog'
import { PostDetailDialog } from './PostDetailDialog'
import { useCommunityDialogs } from '../dialogContext'
import { Avatar, CommunityIcon } from './ui'
import { ChallengeDemoSelector } from '../challenges/ChallengeDemoSelector'
import { CommunityMotion, MotionButton } from './CommunityMotion'

export function CommunityShell({ children }: { children: ReactNode }) {
  const { state, dispatch } = useCommunity()
  const { theme, setTheme } = useCommunityTheme()
  const { profileId, setProfileId, detail, setDetail } = useCommunityDialogs()
  useEffect(() => {
    const frame = requestAnimationFrame(() => { setProfileId(null); setDetail(null) })
    return () => cancelAnimationFrame(frame)
  }, [state.resetKey, setProfileId, setDetail])
  useEffect(() => {
    document.title = 'CAI Community · Comunidad de alumnos · Demo'
    window.scrollTo({ top: 0, behavior: 'instant' })
    return () => window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])
  return (
    <CommunityMotion><div className={`${themeStyles.theme} ${s.community}`}>
      <a className={s.skipLink} href="#community-content">Saltar al contenido de comunidad</a>
      <header className={s.topbar}>
        <div className={s.topbarInner}>
          <Link to="/community" className={s.communityBrand} aria-label="CAI Community, inicio" onClick={() => dispatch({ type: 'section', section: 'home' })}><span className={s.brandMark} aria-hidden="true">CAI</span><span className={s.brandName}>CAI Community<small>EL INGLÉS NOS CONECTA</small></span></Link>
          <CommunityNavigation />
          <div className={s.headerActions}>
            <div className={s.themeSelector} role="group" aria-label="Tema de la comunidad">
              <MotionButton type="button" aria-label="Modo claro" aria-pressed={theme === 'light'} onClick={() => setTheme('light')} title="Modo claro"><CommunityIcon name="sun" size={19} /></MotionButton>
              <MotionButton type="button" aria-label="Modo oscuro" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')} title="Modo oscuro"><CommunityIcon name="moon" size={18} /></MotionButton>
            </div>
            <MotionButton type="button" className={s.currentMember} aria-label="Abrir perfil ficticio de Alex Demo" aria-haspopup="dialog" onClick={() => setProfileId('alex')}><Avatar member={demoMember} /><span>Alex Demo<small>Mi espacio</small></span></MotionButton>
          </div>
        </div>
      </header>
      <div className={s.demoToolbar}>
        <div className={s.demoNoticeRow}>
        <aside className={s.prototypeNotice} aria-label="Aviso de prototipo"><CommunityIcon name="spark" size={16} /><p><strong>Prototipo CAI.</strong> Perfiles e interacciones ficticios. Sin autenticación ni envíos reales.</p></aside>
        <details className={s.demoControls} id="community-demo-controls">
          <summary>Opciones de demostración</summary>
          <div className={s.demoOptions}>
            <span className={s.demoDate}>Escenario ficticio · Octubre 2026</span>
            <div className={s.demoTools}><label htmlFor="community-demo-mode">Vista demo</label><select id="community-demo-mode" value={state.mode} onChange={(event) => dispatch({ type: 'mode', mode: event.target.value === 'moderator' ? 'moderator' : 'student' })}><option value="student">Alumno</option><option value="moderator">Moderador</option></select><button type="button" onClick={() => dispatch({ type: 'reset' })}><CommunityIcon name="reset" size={15} /> Reiniciar demo</button></div>
            {state.section === 'challenges' && <ChallengeDemoSelector />}
            <nav className={s.areaNav} aria-label="Áreas del prototipo"><Link to="/">Sitio institucional ↗</Link><Link to="/admin">Administración demo ↗</Link></nav>
            <p className={s.demoExplanation}>Los cambios de contenido duran durante esta visita. Solo se conserva la preferencia de tema. Celebra sin comparar y comenta con respeto; usa únicamente contenido ficticio.</p>
          </div>
        </details>
        </div>
        <p className={s.demoStatus} role="status" aria-live="polite" aria-atomic="true">{state.notice}</p>
      </div>
      <main id="community-content" tabIndex={-1} className={s.workspace}>{children}</main>
      <footer className={s.communityFooter}><span>CAI Community · Un prototipo para imaginar lo que podemos construir juntos.</span><span>Sin cuentas reales ni datos de alumnos. <Link to="/">Sitio institucional ↗</Link></span></footer>
      {detail && <PostDetailDialog key={`${detail.postId}-${state.resetKey}`} />}
      {profileId && <MemberProfileDialog key={profileId} memberId={profileId} onClose={() => setProfileId(null)} />}
    </div></CommunityMotion>
  )
}
