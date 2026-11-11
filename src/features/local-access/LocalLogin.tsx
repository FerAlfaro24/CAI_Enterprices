import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ThemeSelector } from '../../components/ThemeSelector'
import { localApi, type LocalUser } from './api'
import s from '../login/login.module.css'

export function LocalLogin({ onLogin, message = '' }: { onLogin: (user: LocalUser) => void; message?: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const data = new FormData(form)
    setBusy(true); setError('')
    try {
      const result = await localApi.login(String(data.get('email')), String(data.get('password')))
      form.reset()
      onLogin(result.user)
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.') }
    finally { setBusy(false) }
  }
  return (
    <main className={s.main} style={{ minHeight: '100dvh' }}>
      <div className={s.card}>
        <div className={s.topline}><Link to="/">Volver al sitio</Link><ThemeSelector /></div>
        <span className={s.kicker}>ADMINISTRACIÓN LOCAL</span>
        <h1>Tu panel de CAI</h1>
        <p className={s.lead}>Entra para revisar solicitudes y administrar alumnos.</p>
        <p className={s.notice}>Pruebas con datos ficticios. Las decisiones se guardan en este equipo. Esta etapa todavía no crea cuentas para alumnos.</p>
        {message && <p role="status">{message}</p>}
        <form aria-label="Acceso a la administración local" onSubmit={(event) => { void submit(event) }} aria-busy={busy}>
          <label htmlFor="local-email">Correo electrónico</label>
          <input id="local-email" name="email" type="email" autoComplete="username" required maxLength={160} />
          <label htmlFor="local-password">Contraseña</label>
          <input id="local-password" name="password" type="password" autoComplete="current-password" required maxLength={128} />
          {error && <p role="alert">{error}</p>}
          <button className={s.primary} disabled={busy} type="submit">{busy ? 'Entrando…' : 'Entrar al panel'}</button>
        </form>
        <p className={s.footnote}><Link to="/registro-local">Probar una nueva solicitud de acceso</Link></p>
      </div>
    </main>
  )
}
