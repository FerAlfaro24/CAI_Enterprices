import { useId, useRef, useState, type FormEvent } from 'react'
import type { StudentProfileDraft } from '../../local-access/api'
import { avatarColors } from '../../signup/profile-options'
import type { CommunityConnection } from '../connection'
import s from '../community.module.css'

export function OwnProfileForm({ connection }: { connection: CommunityConnection }) {
  const id = useId(), sending = useRef(false)
  const [draft, setDraft] = useState<StudentProfileDraft | null>(null)
  const [error, setError] = useState(''), [loading, setLoading] = useState(false)
  const profile = connection.profile
  const busy = loading || connection.busy
  const changed = draft !== null && draft.revision !== profile.revision
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!draft || busy || sending.current) return
    if (changed) { setError('Tu perfil cambió. Carga el perfil actual antes de guardar.'); return }
    if (!draft.displayName.trim() || draft.displayName.trim().length > 141 || /[\p{Cc}\p{Cf}]/u.test(draft.displayName)) { setError('Escribe un nombre visible de 1 a 141 caracteres, en una sola línea.'); return }
    sending.current = true; setError('')
    try {
      if (await connection.saveProfile(draft)) setDraft(null)
      else setError('No se pudo confirmar el cambio. Revisa el aviso y vuelve a intentar o carga el perfil actual.')
    } finally { sending.current = false }
  }
  if (!draft) return <section className={s.profileActivity} aria-label="Mi perfil visible">
    <h3>Mi perfil visible</h3>
    <p>Puedes cambiar el nombre que ve tu grupo y el color de tu avatar. Para corregir tu expediente, consulta con coordinación.</p>
    <button type="button" className={s.primaryButton} disabled={connection.busy} onClick={() => { setError(''); setDraft({ displayName: profile.displayName, avatarColor: profile.avatarColor, revision: profile.revision }) }}>Editar mi perfil</button>
  </section>
  return <form className={`${s.composerForm} ${s.profileEditor}`} aria-label="Editar mi perfil visible" onSubmit={event => { void submit(event) }} noValidate>
    <p id={`${id}-help`}>Este nombre se verá en tu grupo y en tus publicaciones anteriores. Evita teléfonos, correos y otros datos personales.</p>
    <fieldset disabled={busy}>
      <div className={s.formField}><label htmlFor={`${id}-name`}>Nombre visible</label>
        {profile.nameOptions ? <select id={`${id}-name`} value={draft.displayName} onChange={event => setDraft({ ...draft, displayName: event.target.value })} aria-describedby={`${id}-help ${id}-privacy`}>
          {profile.nameOptions.map(name => <option key={name} value={name}>{name}</option>)}
        </select> : <input id={`${id}-name`} value={draft.displayName} maxLength={141} required autoComplete="nickname" onChange={event => setDraft({ ...draft, displayName: event.target.value })} aria-describedby={`${id}-help`} />}
        {profile.nameOptions && <small id={`${id}-privacy`}>Para proteger tu privacidad, conserva un nombre abreviado.</small>}
      </div>
      <div className={s.formField}><label htmlFor={`${id}-color`}>Color del avatar</label><select id={`${id}-color`} value={draft.avatarColor} onChange={event => setDraft({ ...draft, avatarColor: event.target.value })}>
        {!avatarColors.some(color => color.value === draft.avatarColor) && <option value={draft.avatarColor}>Color actual</option>}
        {avatarColors.map(color => <option key={color.id} value={color.value}>{color.label}</option>)}
      </select></div>
      <div className={s.profilePreview} aria-label="Vista previa del avatar"><span aria-hidden="true" style={{ background: draft.avatarColor }}>{draft.displayName.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase()}</span><b>{draft.displayName || 'Tu nombre visible'}</b></div>
      {(error || changed || connection.error) && <p role="alert" className={s.fieldError}>{connection.error || error || 'Tu perfil cambió en otra ventana. Carga el perfil actual antes de guardar.'}</p>}
      <div className={s.profileActions}>
        <button type="submit" disabled={changed} className={s.primaryButton}>{connection.busy ? 'Guardando…' : 'Guardar mi perfil'}</button>
        <button type="button" className={s.iconButton} onClick={() => setDraft(null)}>Cancelar</button>
        <button type="button" className={s.iconButton} onClick={async () => { setLoading(true); try { await connection.refresh(); setDraft(null); setError('') } finally { setLoading(false) } }}>Cargar perfil actual y descartar borrador</button>
      </div>
    </fieldset>
  </form>
}
