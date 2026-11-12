import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AccessFrame } from '../login/AccessFrame'
import { adminRecoveryApi, studentApi } from './api'
import s from '../login/login.module.css'

export function RecoveryPage({admin=false}: {admin?:boolean}) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const sending=useRef(false)
  useEffect(() => { document.title = admin ? 'Recupera tu acceso administrativo · CAI' : 'Recupera tu acceso · CAI'; window.scrollTo({top:0,behavior:'instant'}); heading.current?.focus() }, [admin])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending.current) return
    const email = String(new FormData(event.currentTarget).get('email'))
    sending.current=true;setBusy(true); setError('')
    try { setMessage((await (admin ? adminRecoveryApi.request : studentApi.requestRecovery)(email)).message) }
    catch (error) { setError(error instanceof Error ? error.message : 'No pudimos preparar la recuperación.') }
    finally { sending.current=false;setBusy(false) }
  }
  return <AccessFrame>
    <span className={s.kicker}>{admin?'ADMINISTRACIÓN CAI':'TU ESPACIO CAI'}</span><h1 ref={heading} tabIndex={-1}>{admin?'Recupera tu acceso administrativo':'Recupera tu acceso'}</h1><p className={s.lead}>{admin?'Recupera el acceso al panel con el correo de tu cuenta.':'Te ayudamos a volver a tu comunidad.'}</p>
    <p className={s.notice}>Prueba local: todavía no se envían correos. Usa datos ficticios y consulta el aviso con coordinación.</p>
    {message ? <p role="status">{message}</p> : <form aria-label={admin?'Solicitar recuperación administrativa':'Solicitar recuperación de acceso'} onSubmit={(event) => { void submit(event) }} aria-busy={busy}>
      <label htmlFor="recovery-email">Correo de tu cuenta</label><input id="recovery-email" name="email" type="email" required maxLength={160} autoComplete="email" />
      {error && <p role="alert">{error}</p>}<button className={s.primary} disabled={busy} type="submit">{busy ? 'Preparando…' : 'Solicitar recuperación'}</button>
    </form>}
    {!admin&&<p className={s.signup}>Si entras con Google, recupera tu cuenta desde Google. CAI no cambia tu contraseña de Google.</p>}
    <p className={s.signup}><Link to={admin?'/admin':'/login'}>Volver al acceso</Link></p>
  </AccessFrame>
}
