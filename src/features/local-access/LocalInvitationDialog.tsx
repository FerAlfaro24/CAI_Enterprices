import { useEffect, useRef, useState } from 'react'
import { Icon } from '../admin/components/ui'
import type { ActivationInvitation } from './api'
import s from '../admin/admin.module.css'

export function LocalInvitationDialog({ invitation, name, onClose, recovery = false }: {
  invitation: ActivationInvitation; name: string; onClose: () => void; recovery?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [message, setMessage] = useState('')
  const url = new URL(invitation.path, window.location.origin).href
  const expires = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(invitation.expiresAt))
  useEffect(() => { ref.current?.showModal() }, [])
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setMessage('Enlace copiado.') }
    catch { setMessage('No pudimos copiarlo automáticamente. Selecciona el enlace y cópialo.') }
  }
  return (
    <dialog ref={ref} className={`${s.dialog} ${s['local-dialog']}`} aria-labelledby="invitation-title" onClose={onClose}>
      <div className={s['dialog-head']}>
        <div><h2 id="invitation-title">{recovery ? 'Enlace de recuperación de prueba' : `Acceso preparado para ${name}`}</h2><p>Válido hasta {expires}.</p></div>
        <button type="button" className={s['icon-btn']} onClick={onClose} aria-label={recovery ? "Cerrar enlace de recuperación" : "Cerrar enlace de activación"}><Icon name="close" /></button>
      </div>
      <div className={s['dialog-body']}>
        <p>{recovery ? `Enlace de prueba para ${name}. No comprueba la identidad del destinatario ni demuestra entrega por correo. Usa solo cuentas ficticias para comprobar este recorrido.` : 'Entrega este enlace al alumno o a su tutor después de verificar su identidad. Le permitirá elegir su contraseña una sola vez.'}</p>
        <div className={s['local-link-field']}>
          <label htmlFor="activation-link">{recovery ? 'Enlace de recuperación' : 'Enlace de activación'}</label>
          <textarea id="activation-link" readOnly value={url} rows={4} onFocus={(event) => event.currentTarget.select()} />
        </div>
        <p className={s.alert}>Es un enlace privado de prueba: funciona únicamente en este equipo. No se envió ningún correo. Si generas otro, el anterior dejará de funcionar.</p>
        {message && <p role="status">{message}</p>}
      </div>
      <div className={s['dialog-foot']}>
        <button type="button" className={`${s.btn} ${s['btn--primary']}`} onClick={() => { void copy() }}>Copiar enlace</button>
        <a className={`${s.btn} ${s['btn--ghost']}`} href={url} target="_blank" rel="noopener noreferrer">{recovery ? 'Probar recuperación' : 'Abrir prueba de activación'}</a>
      </div>
    </dialog>
  )
}
