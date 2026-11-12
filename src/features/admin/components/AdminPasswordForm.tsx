import { useId, useRef, useState, type FormEvent } from 'react'
import { ApiError, localApi } from '../../local-access/api'
import { useAdmin } from '../state'
import s from '../admin.module.css'

export function AdminPasswordForm() {
  const { connection } = useAdmin()
  const id = useId(), form = useRef<HTMLFormElement>(null), current = useRef<HTMLInputElement>(null), writing = useRef(false)
  const [busy, setBusy] = useState(false), [show, setShow] = useState(false), [error, setError] = useState('')
  if (!connection) return null

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (writing.current) return
    const values = new FormData(event.currentTarget)
    const previous = String(values.get('currentPassword')), password = String(values.get('password')), confirm = String(values.get('confirm'))
    if ([...password].length < 15 || password.trim().length < 15 || password.length > 128) { setError('Elige una contraseña de 15 a 128 caracteres. Puedes usar una frase.'); form.current?.querySelector<HTMLInputElement>('[name=password]')?.focus(); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); form.current?.querySelector<HTMLInputElement>('[name=confirm]')?.focus(); return }
    if (previous === password) { setError('Elige una contraseña diferente de la actual.'); return }
    writing.current = true; setBusy(true); setError('')
    try {
      await localApi.changePassword(previous, password, confirm)
      form.current?.reset()
      connection.requireLogin('Contraseña actualizada. Cerramos todas las sesiones de esta cuenta. Vuelve a entrar con la nueva contraseña.')
    } catch (error) {
      if (error instanceof ApiError && [0, 401, 409].includes(error.status)) {
        form.current?.reset()
        connection.requireLogin(error.status === 0
          ? 'No pudimos confirmar el resultado. Vuelve a entrar: si el cambio se guardó, utiliza la nueva contraseña; si no, la anterior. No se reintentó automáticamente.'
          : error.status === 409 ? 'La cuenta cambió durante el proceso. Vuelve a entrar con la contraseña vigente.' : 'Tu sesión terminó. Vuelve a entrar antes de intentar cambiar la contraseña.')
      } else {
        setError(error instanceof Error ? error.message : 'No pudimos cambiar la contraseña.')
        if (current.current) { current.current.value = ''; current.current.focus() }
      }
    } finally { writing.current = false; setBusy(false) }
  }

  return <section className={s.card} aria-labelledby={`${id}-title`}>
    <div className={s['card-head']}><div><h2 id={`${id}-title`} className={s['card-title']}>Seguridad de mi cuenta</h2><p id={`${id}-help`} className={s['card-sub']}>Cambia solo tu contraseña. Se cerrarán todas las sesiones de esta cuenta, incluida esta. Usa una frase de 15 a 128 caracteres.</p></div></div>
    <form ref={form} onSubmit={event => { void submit(event) }} aria-label="Cambiar mi contraseña administrativa" aria-describedby={`${id}-help`} aria-busy={busy}>
      <fieldset className={s['password-fields']} disabled={busy || connection.busy}>
        <label htmlFor={`${id}-current`}>Contraseña actual</label><input ref={current} id={`${id}-current`} name="currentPassword" type={show ? 'text' : 'password'} autoComplete="current-password" maxLength={128} required />
        <label htmlFor={`${id}-password`}>Nueva contraseña administrativa</label><input id={`${id}-password`} name="password" type={show ? 'text' : 'password'} autoComplete="new-password" minLength={15} maxLength={128} required />
        <label htmlFor={`${id}-confirm`}>Confirma la nueva contraseña</label><input id={`${id}-confirm`} name="confirm" type={show ? 'text' : 'password'} autoComplete="new-password" minLength={15} maxLength={128} required />
        <label className={s.confirm}><input type="checkbox" checked={show} onChange={event => setShow(event.target.checked)} aria-controls={`${id}-current ${id}-password ${id}-confirm`} />Mostrar contraseñas</label>
        <button className={`${s.btn} ${s['btn--primary']}`} type="submit">{busy ? 'Guardando…' : 'Guardar contraseña y cerrar mis sesiones'}</button>
      </fieldset>
      {error && <p className={s.alert} role="alert">{error}</p>}
    </form>
  </section>
}
