import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useCommunity } from '../context'
import { categoryLabels, photoLibrary } from '../data/fixtures'
import type { Category } from '../types'
import { publicationLimits, validatePublication } from '../publicationValidation'
import s from '../community.module.css'
import { CommunityIcon } from './ui'

export function Composer({ onClose, initialCategory = 'experience', badgeShare }: { onClose: () => void; initialCategory?: Category; badgeShare?: { badgeId: string; title: string } }) {
  const { state, dispatch, connection } = useCommunity()
  const dialog = useRef<HTMLDialogElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const attempt = useRef({ fingerprint: '', key: crypto.randomUUID() })
  const sending = useRef(false)
  const [title, setTitle] = useState(badgeShare ? `¡Conseguí ${badgeShare.title}!` : '')
  const [body, setBody] = useState(badgeShare ? `Hoy quiero celebrar este pequeño paso: ${badgeShare.title}. Esta es una historia ficticia para compartir con la comunidad.` : '')
  const [category, setCategory] = useState<Category>(badgeShare ? 'achievement' : initialCategory)
  const [photoIds, setPhotoIds] = useState<string[]>([])
  const [validationStarted, setValidationStarted] = useState(false)
  const draft = { title, body, category, photoIds }
  const errors = validationStarted ? validatePublication(draft) : {}
  const id = useId()
  const categories = Object.entries(categoryLabels).filter(([value]) => connection ? ['achievement', 'experience'].includes(value) : badgeShare ? value === 'achievement' : state.mode === 'moderator' || value !== 'announcement') as [Category, string][]

  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element?.showModal()
    element?.querySelector<HTMLElement>('[name="post-title"]')?.focus()
    return () => {
      element?.close()
      document.body.style.overflow = previousOverflow
      if (previousFocus instanceof HTMLElement) previousFocus.focus({ preventScroll: true })
    }
  }, [])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next = validatePublication(draft)
    setValidationStarted(true)
    if (next.title || next.body || next.photos) {
      dialog.current?.querySelector<HTMLElement>(next.title ? '[name="post-title"]' : next.body ? '[name="post-body"]' : 'input[type="checkbox"]')?.focus()
      return
    }
    if (connection) {
      if (sending.current || (category !== 'achievement' && category !== 'experience')) return
      sending.current = true; setSubmitting(true); setSubmitError('')
      const fingerprint = JSON.stringify({ title, body, category })
      if (attempt.current.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() }
      try {
        if (await connection.submit({ title, body, category }, attempt.current.key)) onClose()
        else setSubmitError('No se pudo enviar. Revisa el aviso e inténtalo otra vez; tu texto sigue aquí.')
      } finally { sending.current = false; setSubmitting(false) }
      return
    }
    dispatch({ type: 'create', id: crypto.randomUUID(), title, body, category, photoIds, ...(badgeShare ? { badgeId: badgeShare.badgeId } : {}) })
    onClose()
  }

  return (
    <dialog ref={dialog} className={s.composerDialog} aria-labelledby={`${id}-heading`} aria-describedby={`${id}-description`} onCancel={(event) => { event.preventDefault(); if (!sending.current) onClose() }} onKeyDown={(event) => {
      if (event.key !== 'Tab') return
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex="0"]')]
        .filter((element) => !element.hasAttribute('disabled') && element.tabIndex >= 0 && element.getClientRects().length > 0)
      const first = controls[0]
      const last = controls.at(-1)
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    }} onClick={(event) => {
      if (event.target !== event.currentTarget) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) { if (!sending.current) onClose() }
    }}>
      <div className={s.dialogHeading}><div><span className={s.eyebrow}>TU VOZ TAMBIÉN CUENTA</span><h2 id={`${id}-heading`}>Comparte un pequeño paso</h2></div><button type="button" className={s.iconButton} disabled={submitting} onClick={onClose} aria-label="Cerrar formulario de publicación"><CommunityIcon name="close" /></button></div>
      <p id={`${id}-description`} className={s.dialogIntro}>{connection ? <>Publicas como <b>{connection.user.displayName}</b>. CAI revisará tu historia antes de compartirla con tu grupo. Evita datos personales.</> : <>Publicas como <b>{state.mode === 'moderator' ? 'Equipo CAI' : 'Alex Demo'}</b>. Usa solo texto ficticio. Tu publicación pasará a revisión; no se envía ni guarda en un servidor.</>}</p>
      {badgeShare && <p className={s.dialogIntro}>Compartir es voluntario. El mensaje es editable y no incluye tu declaración privada de solicitud. Puedes cancelar.</p>}
      <form onSubmit={(event) => { void submit(event) }} noValidate className={s.composerForm} aria-label={connection ? "Nueva publicación" : "Nueva publicación ficticia"}>
        <div className={s.formField}><label htmlFor={`${id}-title`}>Título</label><input id={`${id}-title`} name="post-title" disabled={submitting} value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={publicationLimits.titleMax} placeholder="Por fin me animé a…" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? `${id}-title-error` : undefined} />{errors.title && <span className={s.fieldError} id={`${id}-title-error`}>{errors.title}</span>}</div>
        <div className={s.formField}><label htmlFor={`${id}-category`}>Categoría</label><select id={`${id}-category`} disabled={submitting} value={category} onChange={(event) => setCategory(event.target.value as Category)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className={s.formField}><label htmlFor={`${id}-body`}>{connection ? 'Tu historia' : 'Tu historia de muestra'}</label><textarea id={`${id}-body`} name="post-body" disabled={submitting} value={body} onChange={(event) => setBody(event.target.value)} required rows={4} maxLength={publicationLimits.bodyMax} placeholder="Un intento, una palabra nueva o algo que te gustaría celebrar…" aria-invalid={Boolean(errors.body)} aria-describedby={`${id}-body-help${errors.body ? ` ${id}-body-error` : ''}`} /><small id={`${id}-body-help`}>{body.length}/{publicationLimits.bodyMax} caracteres · No incluyas datos personales</small>{errors.body && <span className={s.fieldError} id={`${id}-body-error`}>{errors.body}</span>}</div>
        {!connection && <fieldset className={s.photoChoices} aria-invalid={Boolean(errors.photos)} aria-describedby={`${id}-photos-help${errors.photos ? ` ${id}-photos-error` : ''}`}><legend>Imágenes ilustrativas</legend><p id={`${id}-photos-help`}>Opcionales, salvo en Galería. No se suben archivos.</p><div>{photoLibrary.map((photo) => <label key={photo.id}><input type="checkbox" checked={photoIds.includes(photo.id)} onChange={(event) => setPhotoIds((current) => event.target.checked ? [...current, photo.id] : current.filter((value) => value !== photo.id))} /><img src={photo.src} alt="" width="140" height="90" loading="lazy" /><span>{photo.id === 'books' ? 'Biblioteca' : photo.id === 'desk' ? 'Mesa de práctica' : 'En compañía'}</span></label>)}</div>{errors.photos && <p className={s.fieldError} id={`${id}-photos-error`}>{errors.photos}</p>}</fieldset>}
        {submitError && <p className={s.fieldError} role="alert">{connection?.error || submitError}</p>}
        <div className={s.dialogFooter}><span><CommunityIcon name="shield" size={16} /> {connection ? 'Revisión antes de aparecer en tu grupo' : 'Revisión simulada antes de aparecer en el feed'}</span><button type="submit" disabled={submitting || connection?.busy} className={s.primaryButton}>{submitting ? 'Enviando…' : 'Enviar a revisión'} <CommunityIcon name="arrow" size={17} /></button></div>
      </form>
    </dialog>
  )
}
