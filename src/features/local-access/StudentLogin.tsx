import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ThemeSelector } from '../../components/ThemeSelector'
import { studentApi, type StudentUser } from './api'
import { GoogleSignInButton } from './GoogleSignInButton'
import s from '../login/login.module.css'

export function StudentLogin({ onLogin, message }: { onLogin: (user: StudentUser) => void; message: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const data = new FormData(form)
    setBusy(true); setError('')
    try {
      const { user } = await studentApi.login(String(data.get('email')), String(data.get('password')))
      form.reset(); onLogin(user)
    } catch (error) { setError(error instanceof Error ? error.message : 'No pudimos iniciar sesión.') }
    finally { setBusy(false) }
  }
  return (
    <main className={s.main} style={{ minHeight: '100dvh' }}>
      <div className={s.card}>
        <div className={s.topline}><Link to="/">Volver al sitio</Link><ThemeSelector /></div>
        <span className={s.kicker}>ALUMNOS CAI</span>
        <h1>Entra a tu espacio</h1>
        <p className={s.lead}>Usa el correo de tu solicitud y la contraseña que elegiste al activar tu cuenta.</p>
        <p className={s.notice}>Prueba local con datos ficticios. La comunidad de publicaciones todavía está en demostración.</p>
        {message && <p role="status">{message}</p>}
        <GoogleSignInButton />
        <form aria-label="Acceso de alumnos" onSubmit={(event) => { void submit(event) }} aria-busy={busy}>
          <label htmlFor="student-email">Correo electrónico</label>
          <input id="student-email" name="email" type="email" autoComplete="username" required maxLength={160} />
          <label htmlFor="student-password">Contraseña</label>
          <input id="student-password" name="password" type="password" autoComplete="current-password" required maxLength={128} />
          {error && <p role="alert">{error}</p>}
          <button type="submit" className={s.primary} disabled={busy}>{busy ? 'Entrando…' : 'Entrar a mi espacio'}</button>
        </form>
        <p className={s.footnote}><Link to="/recuperar-acceso">Olvidé mi contraseña</Link></p>
        <p className={s.footnote}>¿Es tu primera vez? Abre el enlace que te entregó CAI. Si no puedes entrar, consulta con coordinación.</p>
        <p className={s.footnote}><Link to="/registro-local">Solicitar acceso</Link></p>
      </div>
    </main>
  )
}
