import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAdminConnection } from '../features/admin/useAdminConnection'
import { LoginPage } from '../pages/LoginPage'
import { LocalInvitationDialog } from '../features/local-access/LocalInvitationDialog'
import emblem from '../assets/cai/logo-cai-emblema.svg'
import s from '../features/admin/admin.module.css'
import { Icon, type IconName } from '../features/admin/components/ui'
import { countByStatus, postStatuses, requestStatuses, type AdminContext } from '../features/admin/state'
import { cx } from '../features/landing/utils'

type Section = { to: string; label: string; icon: IconName; countKey?: 'requests' | 'posts' }

const sections: Section[] = [
  { to: '/admin', label: 'Resumen', icon: 'home' },
  { to: '/admin/solicitudes', label: 'Solicitudes de ingreso', icon: 'inbox', countKey: 'requests' },
  { to: '/admin/publicaciones', label: 'Publicaciones', icon: 'file', countKey: 'posts' },
  { to: '/admin/alumnos', label: 'Alumnos', icon: 'users' },
  { to: '/admin/galeria', label: 'Galería privada', icon: 'image' },
  { to: '/admin/mensajes', label: 'Mensajes y avisos', icon: 'chat' },
  { to: '/admin/configuracion', label: 'Configuración', icon: 'settings' },
]

const titles: Record<string, string> = Object.fromEntries(
  sections.map((section) => [section.to, section.label]),
)

export function AdminLayout() {
  const connection = useAdminConnection()
  const { state } = connection
  const [message, setMessage] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const pending = {
    requests: countByStatus(state.requests, requestStatuses).pendiente,
    posts: countByStatus(state.posts, postStatuses).pendiente,
  }
  const pageTitle = titles[pathname.replace(/\/$/, '')] ?? 'Administración'

  const announce = useCallback((text: string) => setMessage(text), [])
  const context = useMemo<AdminContext>(() => ({ state, dispatch: (action) => { void connection.mutate(action) }, announce, connection }), [state, announce, connection])

  useEffect(() => { document.title = `${pageTitle} · Administración · CAI · Prototipo` }, [pageTitle])
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }) }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  if (connection.checking) return <main className={s.admin}><p role="status" className={s.content}>Comprobando acceso…</p></main>
  if (!connection.user) return <LoginPage admin onAdminLogin={connection.onLogin} />
  return (
    <div className={s.admin}>
      <a className={s['skip-link']} href="#admin-content">Saltar al contenido</a>
      <div className={s.shell}>
        <aside id="admin-sidebar" className={cx(s.sidebar, menuOpen && s['sidebar--open'])} aria-label="Menú del panel">
          <Link to="/admin" className={s.brand} onClick={() => setMenuOpen(false)}>
            <img src={emblem} alt="" />
            <span><strong>CAI</strong><span>Panel administrativo</span></span>
          </Link>

          <nav aria-label="Secciones de administración">
            <p className={s['nav-label']}>Gestión</p>
            <ul className={s['nav-list']}>
              {sections.map(({ to, label, icon, countKey }) => (
                <li key={label}>
                  <NavLink
                    to={to}
                    end
                    className={({ isActive }) => cx(s['nav-item'], isActive && s['nav-item--active'])}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon name={icon} />{label}
                    {countKey && pending[countKey] > 0 && (
                      <span className={s['nav-count']}>{pending[countKey]}<span className={s['sr-only']}> pendientes</span></span>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className={s['sidebar-footer']}>
            <nav aria-label="Otras áreas del prototipo">
              <p className={s['nav-label']}>Prototipo</p>
              <div className={s.areas}>
                <Link to="/"><Icon name="globe" size={18} />Sitio institucional</Link>
                <Link to="/community"><Icon name="chat" size={18} />Comunidad</Link>
                <Link to="/login"><Icon name="users" size={18} />Acceso de alumnos</Link>
              </div>
            </nav>
            <div className={s['user-card']}>
              <span className={s.avatar} aria-hidden="true">CO</span>
              <div><strong>{connection.user.name}</strong><span>Administración · Sesión local</span></div>
            </div>
          </div>
        </aside>

        {menuOpen && (
          <button type="button" className={cx(s.backdrop, s['backdrop--open'])} aria-label="Cerrar menú" onClick={() => setMenuOpen(false)} />
        )}

        <div className={s.main}>
          <aside className={s['local-notice']}>Pruebas locales con datos ficticios. El acceso, las solicitudes y los alumnos se comprueban y guardan en este equipo.</aside>
          <header className={s.topbar}>
            <button
              type="button"
              className={cx(s['icon-btn'], s['menu-button'])}
              aria-expanded={menuOpen}
              aria-controls="admin-sidebar"
              aria-label="Abrir menú"
              onClick={() => setMenuOpen(true)}
            >
              <Icon name="menu" />
            </button>
            <p className={s['topbar-title']}>Administración / <strong>{pageTitle}</strong></p>
            <div className={s['topbar-end']}>
              <button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={connection.busy} onClick={()=>{void connection.logout()}}>Cerrar sesión</button>
              <span className={cx(s.avatar, s['avatar--sm'])} aria-hidden="true">CO</span>
            </div>
          </header>
          <main id="admin-content" tabIndex={-1} className={s.content}>
            <p className={s.footnote}>Pruebas locales con datos ficticios. Solicitudes, alumnos y moderación conectados al guardado.</p>
            {connection.notice && <p role="status" className={`${s.alert} ${s['alert--ok']}`}>{connection.notice}</p>}
            {connection.error && <p role="alert" className={s.alert}>{connection.error} <button type="button" className={s.btn} onClick={()=>{void connection.refresh()}}>Volver a cargar</button></p>}
            {!connection.loaded ? <p role="status">Cargando los datos…</p> : <Outlet context={context} />}
          </main>
        </div>
      </div>
      <p className={s['sr-only']} role="status" aria-live="polite">{message}</p>
      {connection.invitation && <LocalInvitationDialog invitation={connection.invitation} name={connection.invitation.name} onClose={()=>connection.setInvitation(null)} />}
    </div>
  )
}
