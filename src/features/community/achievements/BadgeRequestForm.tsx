import { useId, useState, type FormEvent } from 'react'
import { useCommunity } from '../context'
import { CommunityIcon } from '../components/ui'
import { useCommunityDialog } from '../useCommunityDialog'
import { badgeRequestLimits, requestableBadges } from './catalog'
import { badgeRequestBlock, validateBadgeRequest } from './model'
import s from './achievements.module.css'

export function BadgeRequestForm({ badgeId, onBadgeChange, onSubmitted }: { badgeId: string; onBadgeChange: (id: string) => void; onSubmitted?: () => void }) {
  const { state, dispatch } = useCommunity()
  const id = useId()
  const [description, setDescription] = useState('')
  const [started, setStarted] = useState(false)
  const errors = started ? validateBadgeRequest(state, badgeId, description) : { badgeId: undefined, description: undefined }
  const blocked = badgeRequestBlock(state, badgeId)
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStarted(true)
    const next = validateBadgeRequest(state, badgeId, description)
    if (next.badgeId || next.description) { event.currentTarget.querySelector<HTMLElement>(next.badgeId ? 'select' : 'textarea')?.focus(); return }
    if (state.mode !== 'student') return
    dispatch({ type: 'requestBadge', id: crypto.randomUUID(), badgeId, description })
    setDescription('')
    setStarted(false)
    onSubmitted?.()
    requestAnimationFrame(() => {
      const history = document.getElementById('badge-request-history')
      history?.focus({ preventScroll: true })
      history?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    })
  }
  return <form className={s.requestForm} aria-label="Solicitud de insignia" noValidate onSubmit={submit}>
    <div className={s.formField}><label htmlFor={`${id}-badge`}>Insignia</label><select id={`${id}-badge`} value={badgeId} onChange={(event) => onBadgeChange(event.target.value)} disabled={state.mode !== 'student'} aria-invalid={Boolean(errors.badgeId)} aria-describedby={errors.badgeId ? `${id}-badge-error` : undefined}>{requestableBadges.map((badge) => <option key={badge.id} value={badge.id} disabled={Boolean(badgeRequestBlock(state, badge.id))}>{badge.title}{badgeRequestBlock(state, badge.id) ? ' · No disponible' : ''}</option>)}</select>{errors.badgeId && <p id={`${id}-badge-error`} className={s.error} role="alert">{errors.badgeId}</p>}</div>
    <div className={s.formField}><label htmlFor={`${id}-description`}>Cuéntanos tu aventura</label><textarea id={`${id}-description`} value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={badgeRequestLimits.max} disabled={state.mode !== 'student'} required placeholder="Usa una historia ficticia: vi una película en inglés y reconocí varias expresiones…" aria-invalid={Boolean(errors.description)} aria-describedby={`${id}-help${errors.description ? ` ${id}-description-error` : ''}`} /><small id={`${id}-help`}>{description.length}/{badgeRequestLimits.max} · Solo para revisión; no se copia a publicaciones. Declaración ficticia, sin prueba verificada.</small>{errors.description && <p id={`${id}-description-error`} className={s.error} role="alert">{errors.description}</p>}</div>
    <div className={s.requestActions}><button className={s.primaryButton} type="submit" disabled={state.mode !== 'student' || Boolean(blocked)}>Enviar a revisión <CommunityIcon name="arrow" size={16} /></button><p>{state.mode !== 'student' ? 'Vuelve a Vista alumno para enviar una solicitud.' : blocked ?? 'CAI revisará esta solicitud ficticia antes de conceder la insignia.'}</p></div>
  </form>
}

export function BadgeRequestDialog({ badgeId, onBadgeChange, onClose }: { badgeId: string; onBadgeChange: (id: string) => void; onClose: () => void }) {
  const dialog = useCommunityDialog()
  const id = useId()
  return <dialog ref={dialog} className={s.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-help`} onCancel={(event) => { event.preventDefault(); onClose() }}><header className={s.dialogHeading}><h2 id={`${id}-title`}>Solicitar una insignia</h2><button type="button" className={s.iconButton} aria-label="Cerrar solicitud" onClick={onClose}><CommunityIcon name="close" /></button></header><p id={`${id}-help`} className={s.dialogIntro}>Una aventura fuera de la plataforma también puede contar. Usa solo contenido ficticio; enviarla no concede la insignia.</p><BadgeRequestForm badgeId={badgeId} onBadgeChange={onBadgeChange} onSubmitted={onClose} /></dialog>
}
