import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { GoogleState } from '../../../server/contracts'
import { SignupPage } from '../../pages/SignupPage'
import { googleApi } from './api'
import { GoogleSignInButton } from './GoogleSignInButton'
import s from '../login/login.module.css'
import g from './google.module.css'

export function GoogleOnboardingPage() {
  const [state, setState] = useState<GoogleState | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const refresh = () => googleApi.session().then((next) => { setState(next); setError('') }).catch((error: unknown) => setError(error instanceof Error ? error.message : 'No pudimos consultar tu solicitud.'))
  useEffect(() => { document.title = 'Tu solicitud · CAI'; void refresh() }, [])
  const enter = async () => {
    setBusy(true); setError('')
    try { const { destination } = await googleApi.enter(); window.location.assign(destination) }
    catch (error) { setError(error instanceof Error ? error.message : 'No pudimos abrir tu espacio.'); setBusy(false) }
  }
  const logout = async () => {
    setBusy(true); setError('')
    try { await googleApi.logout(); window.location.assign('/alumnos') }
    catch (error) { setError(error instanceof Error ? error.message : 'No pudimos cerrar la sesión.'); setBusy(false) }
  }
  if (state?.status === 'profile') return <SignupPage google={{ email: state.email, onSubmitted: () => { void refresh() } }} />
  const title = !state ? 'Consultando tu solicitud…' : state.status === 'anonymous' ? 'Continúa con tu cuenta' : state.status === 'pending' ? 'Tu solicitud está en revisión' : state.status === 'approved' ? '¡CAI aprobó tu solicitud!' : 'Consulta con coordinación'
  return (
    <main className={s.main} style={{ minHeight: '100dvh' }}>
      <div className={s.card}>
        <Link to="/">Volver al sitio</Link>
        <h1>{title}</h1>
        <p className={s.notice}>Prueba local. La comunidad de publicaciones continúa en demostración.</p>
        {state && 'requestId' in state && <p>Folio <strong>{state.requestId}</strong></p>}
        {state?.status === 'anonymous' && <><p>Usa la misma cuenta de Google con la que empezaste. Si aún no tienes solicitud, te pediremos tus datos.</p><GoogleSignInButton /><Link to="/alumnos">Entrar con contraseña</Link></>}
        {state?.status === 'pending' && <p>Ya recibimos tus datos. CAI comprobará tu inscripción y, si eres menor, la autorización de tu tutor. Podrás volver aquí con la misma cuenta de Google.</p>}
        {(state?.status === 'rejected' || state?.status === 'suspended') && <p>El acceso todavía no está disponible. Contacta con CAI e indica tu folio para revisar tu situación.</p>}
        {state?.status === 'approved' && <p>Tus datos ya fueron revisados. Puedes entrar con tu cuenta de Google sin crear otra contraseña.</p>}
        {error && <p role="alert">{error}</p>}
        <div className={g.actions}>
          {state?.status === 'approved' && <button type="button" className={s.primary} disabled={busy} onClick={() => { void enter() }}>Entrar a mi espacio</button>}
          <button type="button" className={s.primary} disabled={busy} onClick={() => { void refresh() }}>Consultar estado</button>
          {state && state.status !== 'anonymous' && <button type="button" className={s.primary} disabled={busy} onClick={() => { void logout() }}>Cerrar sesión de CAI</button>}
        </div>
      </div>
    </main>
  )
}
