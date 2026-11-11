import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ThemeSelector } from '../../components/ThemeSelector'
import { StudentLogin } from './StudentLogin'
import { ApiError, studentApi, type GroupMember, type StudentUser } from './api'
import s from '../admin/admin.module.css'

export function StudentArea() {
  const [user, setUser] = useState<StudentUser | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const generation = useRef(0)
  const previouslySignedIn = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const refresh = useCallback(() => {
    const current = ++generation.current
    return studentApi.session().then(async ({ user }) => ({
      user, members: user ? (await studentApi.group()).members : [],
    })).then(({ user, members }) => {
      if (current !== generation.current) return
      if (!user && previouslySignedIn.current) setMessage('Tu sesión terminó o el acceso no está disponible. Vuelve a entrar o consulta con CAI.')
      if (user) { previouslySignedIn.current = true; setMessage('') }
      setUser(user); setMembers(members); setError('')
    }).catch((error: unknown) => {
      if (current !== generation.current) return
      if (error instanceof ApiError && error.status === 401) {
        setUser(null); setMembers([]); setError(''); setMessage(error.message)
      } else setError(error instanceof Error ? error.message : 'No se pudo comprobar el acceso.')
    }).finally(() => { if (current === generation.current) setChecking(false) })
  }, [])
  useEffect(() => {
    void refresh()
    const sequence = generation
    const checkVisible = () => { if (document.visibilityState === 'visible') void refresh() }
    const interval = window.setInterval(checkVisible, 15_000)
    document.addEventListener('visibilitychange', checkVisible)
    return () => { sequence.current++; window.clearInterval(interval); document.removeEventListener('visibilitychange', checkVisible) }
  }, [refresh])
  const signedInId = user?.id
  useEffect(() => {
    document.title = signedInId ? 'Mi espacio · Alumnos CAI · Prueba local' : 'Acceso de alumnos · CAI · Prueba local'
    if (signedInId) heading.current?.focus()
  }, [signedInId])
  const logout = async () => {
    setBusy(true)
    try {
      await studentApi.logout(); generation.current++
      setUser(null); setMembers([]); setError(''); setMessage('Sesión cerrada.'); previouslySignedIn.current = false
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo cerrar la sesión.') }
    finally { setBusy(false) }
  }
  if (checking) return <main className={s.admin}><p role="status" className={s.content}>Comprobando tu acceso…</p></main>
  if (error) return (
    <main className={s.admin}><div className={s.content}>
      <h1>No pudimos cargar tu espacio</h1><p role="alert">{error}</p>
      <button type="button" className={`${s.btn} ${s['btn--primary']}`} onClick={() => { void refresh() }}>Volver a intentar</button>
    </div></main>
  )
  if (!user) return <StudentLogin message={message} onLogin={() => { previouslySignedIn.current = true; void refresh() }} />
  return (
    <div className={s.admin}>
      <a href="#student-content" className={s['skip-link']}>Saltar a mi espacio</a>
      <aside className={s['local-notice']}>Prueba local · Tu acceso y tu grupo están conectados al servidor. Las publicaciones de Community siguen en demostración.</aside>
      <header className={s.topbar}>
        <Link to="/" className={s['card-link']}>CAI · Mi espacio</Link>
        <div className={s['topbar-end']}><ThemeSelector /><button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={() => { void logout() }}>Cerrar sesión</button></div>
      </header>
      <main className={s.content} id="student-content" tabIndex={-1}>
        <div className={s['page-head']}>
          <div><p className={s.eyebrow}>TU ESPACIO CAI</p><h1 ref={heading} tabIndex={-1} className={s['page-title']}>Hola, {user.displayName}</h1></div>
          <button type="button" className={`${s.btn} ${s['btn--ghost']}`} onClick={() => { void refresh() }}>Actualizar mi espacio</button>
        </div>
        <section className={s.card} aria-labelledby="student-profile-title">
          <h2 id="student-profile-title" className={s['card-title']}>Mi inscripción</h2>
          <dl className={s.details}>
            <dt>Nombre visible</dt><dd>{user.displayName}</dd>
            <dt>Programa</dt><dd>{user.program}</dd>
            <dt>Grupo</dt><dd>{user.group}</dd>
          </dl>
        </section>
        <section className={`${s.card} ${s['student-group']}`} aria-labelledby="student-group-title">
          <h2 id="student-group-title" className={s['card-title']}>Mi grupo</h2>
          <p className={s['card-sub']}>Aquí solo aparecen los nombres visibles de alumnos activos de tu programa y grupo.</p>
          {members.length ? <ul className={`${s.queue} ${s['local-records']}`}>
            {members.map((member, index) => <li key={`${member.displayName}-${index}`}><span className={s.avatar} style={{ background: member.avatarColor }} aria-hidden="true">{member.displayName[0]}</span><strong>{member.displayName}</strong></li>)}
          </ul> : <p className={s.empty}>Tu grupo aparecerá cuando CAI confirme su asignación.</p>}
        </section>
      </main>
    </div>
  )
}
