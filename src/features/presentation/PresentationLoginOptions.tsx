import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { googleApi } from '../local-access/api'
import { useCommunityDialog } from '../community/useCommunityDialog'
import { presentationCredentials } from './credentials'
import logo from './google-g.png'
import styles from './presentation.module.css'

function GooglePreview({ onClose }: { onClose: () => void }) {
  const dialog = useCommunityDialog(), id = useId(), navigate = useNavigate()
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const enter = async () => {
    if (busy) return
    setBusy(true); setError('')
    try {
      const { destination } = await googleApi.signIn('presentation-only')
      onClose(); navigate(destination)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudo abrir la muestra.')
    } finally { setBusy(false) }
  }
  return <dialog ref={dialog} className={styles.googleDialog} aria-labelledby={id} aria-describedby={id + '-description'} onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <header><span>CAI · SIMULACIÓN</span><button type="button" aria-label="Cerrar muestra de Google" disabled={busy} onClick={onClose}>✕</button></header>
    <h2 id={id}>Así se continúa con Google</h2>
    <p id={id + '-description'}>Vista de demostración de CAI. Esta pantalla no pertenece a Google y no consulta tus cuentas. En la versión conectada, Google verifica tu identidad antes de entrar.</p>
    <button type="button" className={styles.googleAccount} disabled={busy} onClick={() => { void enter() }}><b aria-hidden="true">AP</b><span><strong>Alumno de muestra</strong><small>{presentationCredentials.student.email}</small></span><span aria-hidden="true">→</span></button>
    <p className={styles.googleHint}>Mostramos un alumno ya aprobado. Si es tu primera vez, completas tus datos y coordinación revisa la solicitud.</p>
    {error && <p role="alert">{error}</p>}
  </dialog>
}

export function PresentationLoginOptions({ admin, onFill }: { admin: boolean; onFill: (email: string, password: string) => void }) {
  const [open, setOpen] = useState(false)
  const account = presentationCredentials[admin ? 'admin' : 'student']
  return <section className={styles.loginOptions} aria-label="Accesos de presentación">
    {!admin && <><button type="button" className={styles.googleButton} onClick={() => setOpen(true)}><img src={logo} width="20" height="20" alt="" aria-hidden="true"/>Continuar con Google</button><p className={styles.googleHint}>Recorrido de muestra. No inicia sesión real con Google.</p></>}
    <details><summary>Cuenta de muestra para presentar</summary><p>Correo: <strong>{account.email}</strong><br/>Contraseña: <strong>{account.password}</strong></p><button type="button" className={styles.fillAccount} onClick={() => onFill(account.email, account.password)}>Rellenar cuenta de muestra</button><p className={styles.googleHint}>Usa estas credenciales ficticias. Las contraseñas no se guardan ni se envían.</p></details>
    {open && <GooglePreview onClose={() => setOpen(false)} />}
  </section>
}
