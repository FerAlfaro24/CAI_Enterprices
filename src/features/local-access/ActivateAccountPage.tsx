import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { AccessFrame } from '../login/AccessFrame'
import { adminRecoveryApi, adminTeamApi, ApiError, studentApi } from './api'
import s from '../login/login.module.css'

export function ActivateAccountPage({ recovery = false, admin = false, adminActivation=false }: { recovery?: boolean; admin?:boolean; adminActivation?:boolean }) {
  const { hash } = useLocation()
  const token = new URLSearchParams(hash.slice(1)).get('token') ?? ''
  // Un enlace nuevo en la misma pestaña reinicia el formulario y descarta el token anterior.
  return <ActivationForm key={hash} token={token} recovery={recovery} admin={admin||adminActivation} adminActivation={adminActivation} />
}

function ActivationForm({ token, recovery, admin, adminActivation }: { token: string; recovery: boolean; admin:boolean; adminActivation:boolean }) {
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [uncertain,setUncertain]=useState(false)
  const sending=useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (done) heading.current?.focus() }, [done])
  useEffect(() => {
    document.title = adminActivation ? 'Activar cuenta administrativa · CAI' : admin ? 'Recuperar contraseña administrativa · CAI' : recovery ? 'Cambiar contraseña · CAI' : 'Activa tu acceso · CAI · Prueba local'
    // No conservar el enlace privado en la barra ni en el historial de esta página.
    window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  }, [recovery,admin,adminActivation])
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending.current) return
    const form = event.currentTarget
    const values = new FormData(form)
    const password = String(values.get('password'))
    const confirm = String(values.get('confirm'))
    if ([...password].length < 15 || password.trim().length < 15) { setError('Elige una contraseña de al menos 15 caracteres. Puedes usar una frase.'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    sending.current=true;setBusy(true); setError('')
    try { await (adminActivation ? adminTeamApi.activate : admin ? adminRecoveryApi.reset : recovery ? studentApi.resetPassword : studentApi.activate)(token, password, confirm); form.reset(); setDone(true) }
    catch (error) {
      if (admin && error instanceof ApiError && (error.status===0 || error.status>=500 || (error.status>=200 && error.status<300))) {form.reset();setUncertain(true)}
      else setError(error instanceof Error ? error.message : 'No se pudo activar la cuenta.')
    }
    finally { sending.current=false;setBusy(false) }
  }
  return (
    <AccessFrame>
        <span className={s.kicker}>{admin?'ADMINISTRACIÓN CAI':'TU ESPACIO CAI'}</span>
        <h1 ref={heading} tabIndex={-1}>{done ? recovery ? 'Contraseña actualizada' : 'Tu acceso está listo' : recovery ? 'Elige tu nueva contraseña' : 'Activa tu acceso'}</h1>
        <p className={s.notice}>Prueba local con datos ficticios. Usa una contraseña de prueba que no utilices en otros sitios.</p>
        {uncertain ? <>
          <p role="status">No pudimos confirmar el resultado. Por seguridad retiramos el formulario. Prueba entrar con la nueva contraseña; si no funciona, solicita otro enlace. No se reintentó el cambio automáticamente.</p>
          <Link className={s.primary} to="/admin">Volver al acceso administrativo</Link>
          {adminActivation ? <p className={s.signup}>Si no puedes entrar, pide otra invitación al administrador.</p> : <p className={s.signup}><Link to="/recuperar-acceso-administrativo">Solicitar otro enlace</Link></p>}
        </> : done ? <>
          <p role="status">{adminActivation ? 'Tu cuenta administrativa quedó activada. Entra con el correo de la invitación y tu nueva contraseña.' : recovery ? 'Cerramos las sesiones anteriores. Vuelve a entrar con tu nueva contraseña.' : 'Tu cuenta quedó activada. Ya puedes entrar con el correo de tu solicitud y la contraseña que elegiste.'}</p>
          <Link className={s.primary} to={admin?'/admin':'/login'}>{admin?'Entrar al panel':'Entrar a mi espacio'}</Link>
        </> : !/^[a-f0-9]{64}$/.test(token) ? <>
          <p role="alert">Necesitas un enlace {recovery ? 'de recuperación' : 'de activación'} válido. Pídeselo a coordinación de CAI.</p>
          <Link to={adminActivation?'/admin':admin?'/recuperar-acceso-administrativo':'/login'}>{adminActivation?'Volver al acceso administrativo':admin?'Solicitar otro enlace':'Volver al acceso de alumnos'}</Link>
        </> : <form aria-label={adminActivation?'Activar cuenta administrativa':admin?'Recuperar contraseña administrativa':recovery ? "Cambiar contraseña de alumno" : "Activar cuenta de alumno"} onSubmit={(event) => { void submit(event) }} aria-busy={busy}>
          <p className={s.lead}>Elige una contraseña de 15 a 128 caracteres. Puede ser una frase fácil de recordar.</p>
          <label htmlFor="activation-password">Nueva contraseña</label>
          <input id="activation-password" name="password" type="password" disabled={busy} autoComplete="new-password" minLength={15} maxLength={128} required />
          <label htmlFor="activation-confirm">Confirma tu contraseña</label>
          <input id="activation-confirm" name="confirm" type="password" disabled={busy} autoComplete="new-password" minLength={15} maxLength={128} required />
          {error && <p role="alert">{error}</p>}
          <button className={s.primary} type="submit" disabled={busy}>{busy ? 'Guardando…' : recovery ? 'Guardar nueva contraseña' : 'Activar mi cuenta'}</button>
        </form>}
    </AccessFrame>
  )
}
