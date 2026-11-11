import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { ThemeSelector } from '../../components/ThemeSelector'
import { studentApi } from './api'
import s from '../login/login.module.css'

export function ActivateAccountPage() {
  const { hash } = useLocation()
  const token = new URLSearchParams(hash.slice(1)).get('token') ?? ''
  // Un enlace nuevo en la misma pestaña reinicia el formulario y descarta el token anterior.
  return <ActivationForm key={hash} token={token} />
}

function ActivationForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (done) heading.current?.focus() }, [done])
  useEffect(() => {
    document.title = 'Activa tu acceso · CAI · Prueba local'
    // No conservar el enlace privado en la barra ni en el historial de esta página.
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  }, [])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    const form = event.currentTarget
    const values = new FormData(form)
    const password = String(values.get('password'))
    const confirm = String(values.get('confirm'))
    if ([...password].length < 15 || password.trim().length < 15) { setError('Elige una contraseña de al menos 15 caracteres. Puedes usar una frase.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    setBusy(true); setError('')
    try { await studentApi.activate(token, password, confirm); form.reset(); setDone(true) }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo activar la cuenta.') }
    finally { setBusy(false) }
  }
  return (
    <main className={s.main} style={{ minHeight: '100dvh' }}>
      <div className={s.card}>
        <div className={s.topline}><Link to="/">Volver al sitio</Link><ThemeSelector /></div>
        <span className={s.kicker}>TU ESPACIO CAI</span>
        <h1 ref={heading} tabIndex={-1}>{done ? 'Tu acceso está listo' : 'Activa tu acceso'}</h1>
        <p className={s.notice}>Prueba local con datos ficticios. Usa una contraseña de prueba que no utilices en otros sitios.</p>
        {done ? <>
          <p role="status">Tu cuenta quedó activada. Ya puedes entrar con el correo de tu solicitud y la contraseña que elegiste.</p>
          <Link className={s.primary} to="/alumnos">Entrar a mi espacio</Link>
        </> : !/^[a-f0-9]{64}$/.test(token) ? <>
          <p role="alert">Necesitas un enlace de activación válido. Pídeselo a coordinación de CAI.</p>
          <Link to="/alumnos">Volver al acceso de alumnos</Link>
        </> : <form aria-label="Activar cuenta de alumno" onSubmit={(event) => { void submit(event) }} aria-busy={busy}>
          <p className={s.lead}>Elige una contraseña de 15 a 128 caracteres. Puede ser una frase fácil de recordar.</p>
          <label htmlFor="activation-password">Nueva contraseña</label>
          <input id="activation-password" name="password" type="password" autoComplete="new-password" minLength={15} maxLength={128} required />
          <label htmlFor="activation-confirm">Confirma tu contraseña</label>
          <input id="activation-confirm" name="confirm" type="password" autoComplete="new-password" minLength={15} maxLength={128} required />
          {error && <p role="alert">{error}</p>}
          <button className={s.primary} type="submit" disabled={busy}>{busy ? 'Activando…' : 'Activar mi cuenta'}</button>
        </form>}
      </div>
    </main>
  )
}
