import { useId, useState, type FormEvent } from 'react'
import { contactPrograms } from '../data/content'
import s from '../landing.module.css'
import { cx } from '../utils'

type FieldName = 'nombre' | 'contacto' | 'programa' | 'email'
type Errors = Partial<Record<FieldName, string>>
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isPhone = (value: string) => /^[+\d\s().-]+$/.test(value) && /^\d{10,15}$/.test(value.replace(/\D/g, ''))

export function DemoForm({ variant }: { variant: 'contact' | 'waitlist' }) {
  const id = useId()
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState('')
  const contact = variant === 'contact'
  const describedBy = (name: FieldName) => `${id}-help${errors[name] ? ` ${id}-${name}-error` : ''}`
  const error = (name: FieldName) => errors[name] && <span className={s['field-error']} id={`${id}-${name}-error`}>{errors[name]}</span>

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const next: Errors = {}
    if (contact) {
      if (String(data.get('nombre') ?? '').trim().length < 2) next.nombre = 'Escribe un nombre de muestra de al menos 2 caracteres.'
      const value = String(data.get('contacto') ?? '').trim()
      if (!isEmail(value) && !isPhone(value)) next.contacto = 'Escribe un correo con formato válido o un teléfono de 10 a 15 dígitos. Usa datos ficticios.'
      if (!contactPrograms.some(({ id: programId }) => programId === data.get('programa'))) next.programa = 'Selecciona un programa de muestra.'
    } else if (!isEmail(String(data.get('email') ?? '').trim())) next.email = 'Escribe un correo con formato válido, por ejemplo demo@example.test.'
    setErrors(next)
    setStatus('')
    const firstError = Object.keys(next)[0]
    if (firstError) {
      const field = form.elements.namedItem(firstError)
      if (field instanceof HTMLElement) field.focus()
      return
    }
    form.reset()
    setStatus(contact
      ? 'Demostración completada. No se enviaron ni guardaron datos y no se reservó ninguna clase.'
      : 'Demostración completada. No se guardó el correo ni se enviarán avisos. La plataforma es una propuesta futura.')
  }

  return (
    <form className={contact ? s.contact__form : s.waitlist} noValidate onSubmit={submit} onInput={() => setStatus('')} aria-label={contact ? 'Formulario de contacto de demostración' : 'Lista de interés de demostración'}>
      {contact ? <>
        <p className={s['content-note']} id={`${id}-help`}>Formulario de demostración. Usa datos ficticios; no se envía ni se guarda información.</p>
        <div className={s.field}>
          <label htmlFor={`${id}-nombre`}>Nombre de muestra</label>
          <input id={`${id}-nombre`} name="nombre" type="text" autoComplete="off" placeholder="Persona Demo" required maxLength={80} aria-invalid={Boolean(errors.nombre)} aria-describedby={describedBy('nombre')} />
          {error('nombre')}
        </div>
        <div className={s.field}>
          <label htmlFor={`${id}-contacto`}>Correo o teléfono de muestra</label>
          <input id={`${id}-contacto`} name="contacto" type="text" autoComplete="off" placeholder="demo@example.test" required maxLength={120} aria-invalid={Boolean(errors.contacto)} aria-describedby={describedBy('contacto')} />
          {error('contacto')}
        </div>
        <div className={s.field}>
          <label htmlFor={`${id}-programa`}>Programa de interés</label>
          <select id={`${id}-programa`} name="programa" required defaultValue="" aria-invalid={Boolean(errors.programa)} aria-describedby={describedBy('programa')}>
            <option value="" disabled>Selecciona un programa</option>
            {contactPrograms.map(({ id: programId, title }) => <option key={programId} value={programId}>{title}</option>)}
          </select>
          {error('programa')}
        </div>
      </> : <>
        <div className={s.field}>
          <label className={s['sr-only']} htmlFor={`${id}-email`}>Correo de muestra</label>
          <input id={`${id}-email`} name="email" type="email" inputMode="email" autoComplete="off" placeholder="demo@example.test" required maxLength={120} aria-invalid={Boolean(errors.email)} aria-describedby={describedBy('email')} />
          {error('email')}
        </div>
      </>}
      <button className={cx(s.btn, s['btn--primary'], contact && s['btn--lg'])} type="submit">{contact ? 'Probar solicitud de clase' : 'Probar lista de interés'}</button>
      {!contact && <p className={s['content-note']} id={`${id}-help`}>Solo demostración: no se crea una lista de espera ni se envían avisos.</p>}
      <p className={s['form-status']} role="status" aria-live="polite" aria-atomic="true">{status}</p>
    </form>
  )
}
