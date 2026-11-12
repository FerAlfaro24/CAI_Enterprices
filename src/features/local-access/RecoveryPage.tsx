import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { studentApi } from './api'
import s from '../login/login.module.css'

export function RecoveryPage() {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('')
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const email = String(new FormData(event.currentTarget).get('email'))
    setBusy(true); setError('')
    try { setMessage((await studentApi.requestRecovery(email)).message) }
    catch (error) { setError(error instanceof Error ? error.message : 'No pudimos preparar la recuperación.') }
    finally { setBusy(false) }
  }
  return <main className={s.main} style={{minHeight:'100dvh'}}><div className={s.card}>
    <Link to="/alumnos">Volver al acceso</Link><h1>Recupera tu acceso</h1>
    <p className={s.notice}>Prueba local: todavía no se envían correos. Usa datos ficticios y consulta el aviso con coordinación.</p>
    {message ? <p role="status">{message}</p> : <form onSubmit={(event) => { void submit(event) }} aria-busy={busy}>
      <label htmlFor="recovery-email">Correo de tu cuenta</label><input id="recovery-email" name="email" type="email" required maxLength={160} autoComplete="email" />
      {error && <p role="alert">{error}</p>}<button className={s.primary} disabled={busy} type="submit">{busy ? 'Preparando…' : 'Solicitar recuperación'}</button>
    </form>}
    <p>Si entras con Google, recupera tu cuenta desde Google. CAI no cambia tu contraseña de Google.</p>
  </div></main>
}
