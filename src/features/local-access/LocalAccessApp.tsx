import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router'
import { ThemeSelector } from '../../components/ThemeSelector'
import { Icon } from '../admin/components/ui'
import { LocalLogin } from './LocalLogin'
import { LocalRequestDialog } from './LocalRequestDialog'
import { LocalInvitationDialog } from './LocalInvitationDialog'
import { LocalNotices } from './LocalNotices'
import { LocalOverview, LocalRequests, LocalStudents } from './LocalAccessViews'
import { LocalPublications } from '../local-publications/LocalPublications'
import { PublicationReviewDialog } from '../local-publications/PublicationReviewDialog'
import { ApiError, localApi, type ActivationInvitation, type LocalRequest, type LocalStudent, type LocalUser, type PublicationDecision, type RequestDecision, type ReviewPost } from './api'
import s from '../admin/admin.module.css'

export function LocalAccessApp() {
  const [user, setUser] = useState<LocalUser | null>(null)
  const [checking, setChecking] = useState(true)
  const [requests, setRequests] = useState<LocalRequest[]>([])
  const [students, setStudents] = useState<LocalStudent[]>([])
  const [posts, setPosts] = useState<ReviewPost[]>([])
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<(ActivationInvitation & { name: string }) | null>(null)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('pendiente')
  const heading = useRef<HTMLHeadingElement>(null)
  const { pathname } = useLocation()
  const section = pathname === '/gestion/solicitudes' ? 'requests' : pathname === '/gestion/alumnos' ? 'students' : pathname === '/gestion/publicaciones' ? 'posts' : pathname === '/gestion/avisos' ? 'notices' : 'home'
  const title = section === 'requests' ? 'Solicitudes de ingreso' : section === 'students' ? 'Alumnos' : section === 'posts' ? 'Publicaciones' : section === 'notices' ? 'Avisos locales' : 'Tu trabajo pendiente'
  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      setUser(null); setLoaded(false); setSelectedId(null); setSelectedPostId(null); setPosts([]); setInvitation(null)
      setNotice('Tu sesión terminó. Vuelve a entrar para continuar.')
      return ''
    }
    return error instanceof Error ? error.message : 'No se pudo completar la operación.'
  }, [])
  const checkSession = useCallback(async () => {
    setChecking(true); setError('')
    try { setUser((await localApi.session()).user) }
    catch (error) { setError(handleError(error)) }
    finally { setChecking(false) }
  }, [handleError])
  useEffect(() => {
    let active = true
    void localApi.session().then(({ user }) => { if (active) setUser(user) })
      .catch((error: unknown) => { if (active) setError(handleError(error)) })
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [handleError])
  const refresh = useCallback(async () => {
    const [r, st, publications] = await Promise.all([localApi.requests(), localApi.students(), localApi.posts()])
    setRequests(r.requests); setStudents(st.students); setPosts(publications.posts); setLoaded(true); setError('')
  }, [])
  useEffect(() => {
    if (!user) return
    let active = true
    void Promise.all([localApi.requests(), localApi.students(), localApi.posts()]).then(([r, st, publications]) => {
      if (active) { setRequests(r.requests); setStudents(st.students); setPosts(publications.posts); setLoaded(true); setError('') }
    }).catch((error: unknown) => { if (active) setError(handleError(error)) })
    return () => { active = false }
  }, [user, handleError])
  useEffect(() => {
    document.title = `${title} · Administración local · CAI`
    heading.current?.focus()
  }, [title, user])
  const reload = async () => { try { await refresh() } catch (error) { setError(handleError(error)) } }
  const decide = async (decision: RequestDecision, reference?: string) => {
    const request = requests.find((r) => r.id === selectedId)
    if (!request || busy) return
    setBusy(true); setActionError(''); setNotice('')
    try {
      await localApi.decide(request, decision, reference)
      // Una escritura confirmada no se presenta como fallida si falla la posterior lectura.
      if (decision !== 'consent') setSelectedId(null)
      setNotice(decision === 'consent' ? 'Autorización registrada.' : decision === 'approve' ? 'Solicitud aprobada. El alumno ya forma parte del directorio local.' : decision === 'reject' ? 'Solicitud rechazada.' : 'Solicitud devuelta a pendientes.')
      try { await refresh() } catch (error) { setError(handleError(error)); setSelectedId(null) }
    } catch (error) {
      setActionError(handleError(error))
      if (error instanceof ApiError && error.status === 409) { setSelectedId(null); await reload() }
    } finally { setBusy(false) }
  }
  const studentStatus = async (student: LocalStudent) => {
    if (busy) return
    setBusy(true); setActionError(''); setNotice('')
    try {
      await localApi.studentStatus(student, student.status === 'activo' ? 'suspendido' : 'activo')
      setNotice(student.status === 'activo' ? 'Acceso del alumno suspendido. Sus sesiones y enlaces pendientes dejaron de funcionar.' : 'Alumno reactivado. Puede volver a iniciar sesión; si aún no activó su cuenta, prepara un nuevo enlace.')
      try { await refresh() } catch (error) { setError(handleError(error)) }
    } catch (error) {
      setActionError(handleError(error))
      if (error instanceof ApiError && error.status === 409) await reload()
    } finally { setBusy(false) }
  }
  const moderate = async (decision: PublicationDecision, reason?: string, confirmed?: boolean) => {
    const post = posts.find((post) => post.id === selectedPostId)
    if (!post || busy) return
    setBusy(true); setActionError(''); setNotice('')
    try {
      await localApi.moderate(post, decision, reason, confirmed)
      setSelectedPostId(null)
      setNotice(decision === 'approve' ? 'Publicación compartida con su programa y grupo.' : decision === 'reject' ? 'Publicación rechazada. El alumno puede consultar el motivo.' : 'Publicación devuelta a revisión y oculta del grupo.')
      try { await refresh() } catch (error) { setError(handleError(error)) }
    } catch (error) {
      setActionError(handleError(error))
      if (error instanceof ApiError && error.status === 409) { setSelectedPostId(null); await reload() }
    } finally { setBusy(false) }
  }
  const invite = async (student: LocalStudent) => {
    if (busy) return
    setBusy(true); setActionError(''); setNotice('')
    try {
      const invitation = await localApi.invite(student)
      setInvitation({ ...invitation, name: student.name })
      try { await refresh() } catch (error) { setError(handleError(error)) }
    } catch (error) {
      setActionError(handleError(error))
      if (error instanceof ApiError && error.status === 409) await reload()
    } finally { setBusy(false) }
  }
  const logout = async () => {
    setBusy(true)
    try { await localApi.logout(); setUser(null); setLoaded(false); setRequests([]); setStudents([]); setPosts([]); setSelectedPostId(null); setNotice(''); setActionError(''); setInvitation(null) }
    catch (error) { setError(handleError(error)) }
    finally { setBusy(false) }
  }
  if (checking) return <main className={s.admin}><p role="status" className={s.content}>Comprobando el acceso local…</p></main>
  if (!user) return error ? <main className={s.admin}><div className={s.content}><h1>El servicio local no está disponible</h1><p role="alert">{error}</p><button type="button" className={`${s.btn} ${s['btn--primary']}`} onClick={() => { void checkSession() }}>Volver a intentar</button></div></main> : <LocalLogin message={notice} onLogin={(user) => { setLoaded(false); setUser(user); setNotice(''); setError(''); setActionError('') }} />
  const matching = query.trim().toLocaleLowerCase('es')
  const visibleRequests = requests.filter((r) => (filter === 'todas' || r.status === filter) && `${r.name} ${r.id} ${r.program}`.toLocaleLowerCase('es').includes(matching))
  const visibleStudents = students.filter((st) => `${st.name} ${st.id} ${st.group}`.toLocaleLowerCase('es').includes(matching))
  const selected = requests.find((r) => r.id === selectedId)
  const selectedPost = posts.find((post) => post.id === selectedPostId)
  const open = (request: LocalRequest) => { setActionError(''); setSelectedId(request.id) }
  return (
    <div className={s.admin}>
      <a className={s['skip-link']} href="#local-content">Saltar al contenido</a>
      <aside className={s['local-notice']}>Pruebas locales · Usa datos ficticios. Solicitudes, alumnos y publicaciones de texto se guardan en este equipo. Community conserva su demostración visual.</aside>
      <header className={s.topbar}>
        <Link to="/gestion" className={s['card-link']}>CAI · Administración</Link>
        <div className={s['topbar-end']}><ThemeSelector /><button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={() => { void logout() }}>Cerrar sesión</button></div>
      </header>
      <nav className={s['local-nav']} aria-label="Administración local">
        {[['/gestion', 'Inicio'], ['/gestion/solicitudes', 'Solicitudes'], ['/gestion/alumnos', 'Alumnos'], ['/gestion/publicaciones', 'Publicaciones'], ['/gestion/avisos', 'Avisos']].map(([to, label]) => <NavLink key={to} end to={to!} className={({ isActive }) => `${s['nav-item']} ${isActive ? s['nav-item--active'] : ''}`} onClick={() => { setQuery(''); setActionError('') }}>{label}</NavLink>)}
      </nav>
      <main className={s.content} id="local-content" tabIndex={-1}>
        <div className={s['page-head']}><div><p className={s.eyebrow}>Hola, {user.name}</p><h1 ref={heading} tabIndex={-1} className={s['page-title']}>{title}</h1></div>{section !== 'notices' && <button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={() => { void reload() }}><Icon name="refresh" size={16} />Actualizar</button>}</div>
        {notice && <p role="status" className={`${s.alert} ${s['alert--ok']}`}>{notice}</p>}
        {error && <div role="alert" className={s.alert}><p>{error}</p><button type="button" className={`${s.btn} ${s['btn--ghost']}`} onClick={() => { void reload() }}>Volver a cargar los datos</button></div>}
        {actionError && !selected && !selectedPost && <p role="alert" className={s.alert}>{actionError}</p>}
        {!loaded && !error && <p role="status">Cargando solicitudes y alumnos…</p>}
        {loaded && !error && <>
          {section === 'notices' ? <LocalNotices /> : section === 'home' ? <LocalOverview requests={requests} students={students} pendingPosts={posts.filter((post) => post.status === 'pendiente').length} onReview={open} /> : section === 'posts' ? <LocalPublications posts={posts} onReview={(post) => { setActionError(''); setSelectedPostId(post.id) }} /> : <>
            <div className={s.toolbar}>
              {section === 'requests' && <div className={s.tabs} role="group" aria-label="Estado de solicitudes">{[['pendiente', 'Pendientes'], ['aprobada', 'Aprobadas'], ['rechazada', 'Rechazadas'], ['todas', 'Todas']].map(([value, label]) => <button type="button" key={value} className={s.tab} aria-pressed={filter === value} onClick={() => setFilter(value!)}>{label}</button>)}</div>}
              <div className={s.search}><Icon name="search" size={16} /><label htmlFor="local-search" className={s['sr-only']}>Buscar {section === 'requests' ? 'solicitud' : 'alumno'}</label><input id="local-search" type="search" placeholder="Buscar por nombre o folio" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
            </div>
            <section className={s.card} aria-label={section === 'requests' ? 'Solicitudes guardadas' : 'Alumnos guardados'}>
              {section === 'requests'
                ? <LocalRequests requests={visibleRequests} onReview={open} />
                : <LocalStudents students={visibleStudents} busy={busy} onStatus={(student) => { void studentStatus(student) }} onInvite={(student) => { void invite(student) }} />}
              {(section === 'requests' ? visibleRequests : visibleStudents).length === 0 && <p className={s.empty}>{query ? 'No encontramos coincidencias.' : section === 'requests' ? 'No hay solicitudes en este estado.' : 'Los alumnos aparecerán aquí cuando apruebes sus solicitudes.'}</p>}
            </section>
          </>}
        </>}
        <p className={s.footnote}><Link to="/registro-local">Probar solicitud de acceso</Link> · <Link to="/alumnos">Acceso de alumnos</Link> · <Link to="/admin">Abrir panel de demostración</Link></p>
      </main>
      {selected && <LocalRequestDialog key={selected.id} request={selected} busy={busy} error={actionError} onClose={() => setSelectedId(null)} onDecide={(decision, reference) => { void decide(decision, reference) }} />}
      {invitation && <LocalInvitationDialog invitation={invitation} name={invitation.name} onClose={() => setInvitation(null)} />}
      {selectedPost && <PublicationReviewDialog key={`${selectedPost.id}-${selectedPost.revision}`} post={selectedPost} busy={busy} error={actionError} onClose={() => setSelectedPostId(null)} onDecide={(decision, reason, confirmed) => { void moderate(decision, reason, confirmed) }} />}
    </div>
  )
}
