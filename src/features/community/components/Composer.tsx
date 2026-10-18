import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useCommunity } from '../context'
import { categoryLabels, photoLibrary } from '../data/fixtures'
import type { Category } from '../types'
import s from '../community.module.css'
import { CommunityIcon } from './ui'

export function Composer({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useCommunity()
  const dialog = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<Category>('experience')
  const [photoIds, setPhotoIds] = useState<string[]>([])
  const [errors, setErrors] = useState<{ title?: string; body?: string; photos?: string }>({})
  const id = useId()
  const categories = Object.entries(categoryLabels).filter(([value]) => state.mode === 'moderator' || value !== 'announcement') as [Category, string][]

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

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const next: typeof errors = {}
    if (title.trim().length < 4) next.title = 'Escribe un título ficticio de al menos 4 caracteres.'
    if (body.trim().length < 10) next.body = 'Cuenta una experiencia de muestra de al menos 10 caracteres.'
    if (category === 'gallery' && !photoIds.length) next.photos = 'Selecciona al menos una imagen ilustrativa para la galería.'
    setErrors(next)
    if (next.title || next.body || next.photos) {
      dialog.current?.querySelector<HTMLElement>(next.title ? '[name="post-title"]' : next.body ? '[name="post-body"]' : 'input[type="checkbox"]')?.focus()
      return
    }
    dispatch({ type: 'create', id: crypto.randomUUID(), title, body, category, photoIds })
    onClose()
  }

  return (
    <dialog ref={dialog} className={s.composerDialog} aria-labelledby={`${id}-heading`} aria-describedby={`${id}-description`} onCancel={(event) => { event.preventDefault(); onClose() }} onKeyDown={(event) => {
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
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
    }}>
      <div className={s.dialogHeading}><div><span className={s.eyebrow}>TU VOZ TAMBIÉN CUENTA</span><h2 id={`${id}-heading`}>Comparte un pequeño paso</h2></div><button type="button" className={s.iconButton} onClick={onClose} aria-label="Cerrar formulario de publicación"><CommunityIcon name="close" /></button></div>
      <p id={`${id}-description`} className={s.dialogIntro}>Publicas como <b>{state.mode === 'moderator' ? 'Equipo CAI' : 'Alex Demo'}</b>. Usa solo texto ficticio. Tu publicación pasará a revisión; no se envía ni guarda en un servidor.</p>
      <form onSubmit={submit} noValidate className={s.composerForm} aria-label="Nueva publicación ficticia">
        <div className={s.formField}><label htmlFor={`${id}-title`}>Título</label><input id={`${id}-title`} name="post-title" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={100} placeholder="Por fin me animé a…" aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? `${id}-title-error` : undefined} />{errors.title && <span className={s.fieldError} id={`${id}-title-error`}>{errors.title}</span>}</div>
        <div className={s.formField}><label htmlFor={`${id}-category`}>Categoría</label><select id={`${id}-category`} value={category} onChange={(event) => setCategory(event.target.value as Category)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className={s.formField}><label htmlFor={`${id}-body`}>Tu historia de muestra</label><textarea id={`${id}-body`} name="post-body" value={body} onChange={(event) => setBody(event.target.value)} required rows={4} maxLength={1200} placeholder="Un intento, una palabra nueva o algo que te gustaría celebrar…" aria-invalid={Boolean(errors.body)} aria-describedby={`${id}-body-help${errors.body ? ` ${id}-body-error` : ''}`} /><small id={`${id}-body-help`}>{body.length}/1200 caracteres · No incluyas datos personales</small>{errors.body && <span className={s.fieldError} id={`${id}-body-error`}>{errors.body}</span>}</div>
        <fieldset className={s.photoChoices} aria-describedby={`${id}-photos-help${errors.photos ? ` ${id}-photos-error` : ''}`}><legend>Imágenes ilustrativas</legend><p id={`${id}-photos-help`}>Opcionales, salvo en Galería. No se suben archivos.</p><div>{photoLibrary.map((photo) => <label key={photo.id}><input type="checkbox" checked={photoIds.includes(photo.id)} onChange={(event) => setPhotoIds((current) => event.target.checked ? [...current, photo.id] : current.filter((value) => value !== photo.id))} /><img src={photo.src} alt="" width="140" height="90" loading="lazy" /><span>{photo.id === 'books' ? 'Biblioteca' : photo.id === 'desk' ? 'Mesa de práctica' : 'En compañía'}</span></label>)}</div>{errors.photos && <p className={s.fieldError} id={`${id}-photos-error`}>{errors.photos}</p>}</fieldset>
        <div className={s.dialogFooter}><span><CommunityIcon name="shield" size={16} /> Revisión simulada antes de aparecer en el feed</span><button type="submit" className={s.primaryButton}>Enviar a revisión <CommunityIcon name="arrow" size={17} /></button></div>
      </form>
    </dialog>
  )
}
