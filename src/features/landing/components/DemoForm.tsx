import { useId, useRef, useState, type FormEvent } from 'react'
import { contactApi } from '../../local-access/api'
import { contactPrograms } from '../data/content'
import s from '../landing.module.css'
import { cx } from '../utils'

type FieldName = 'nombre' | 'contacto' | 'programa' | 'email' | 'consent'
type Errors = Partial<Record<FieldName, string>>
const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isPhone = (value: string) => /^[+\d\s().-]+$/.test(value) && /^\d{10,15}$/.test(value.replace(/\D/g, ''))

export function DemoForm({ variant }: { variant: 'contact' | 'waitlist' }) {
  const id = useId()
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false), [sendError, setSendError] = useState('')
  const sending = useRef(false), attempt = useRef({fingerprint:'',key:crypto.randomUUID()})
  const contact = variant === 'contact'
  const describedBy = (name: FieldName) => `${id}-help${errors[name] ? ` ${id}-${name}-error` : ''}`
  const error = (name: FieldName) => errors[name] && <span className={s['field-error']} id={`${id}-${name}-error`}>{errors[name]}</span>

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (sending.current) return
    const form = event.currentTarget
    const data = new FormData(form)
    const next: Errors = {}
    if (contact) {
      if (String(data.get('nombre') ?? '').trim().length < 2) next.nombre = 'Escribe un nombre de muestra de al menos 2 caracteres.'
      const value = String(data.get('contacto') ?? '').trim()
      if (!isEmail(value) && !isPhone(value)) next.contacto = 'Escribe un correo con formato válido o un teléfono de 10 a 15 dígitos. Usa datos ficticios.'
      if (data.get('consent') !== 'on') next.consent = 'Confirma que CAI puede usar estos datos para atender tu consulta.'
      if (!contactPrograms.some(({ id: programId }) => programId === data.get('programa'))) next.programa = 'Selecciona un programa de muestra.'
    } else if (!isEmail(String(data.get('email') ?? '').trim())) next.email = 'Escribe un correo con formato válido, por ejemplo demo@example.test.'
    setErrors(next)
    setStatus(''); setSendError('')
    const firstError = Object.keys(next)[0]
    if (firstError) {
      const field = form.elements.namedItem(firstError)
      if (field instanceof HTMLElement) field.focus()
      return
    }
    if (contact) {
      const draft = {name:String(data.get('nombre')).trim(),contact:String(data.get('contacto')).trim(),program:String(data.get('programa')),consent:true as const}
      const fingerprint = JSON.stringify(draft)
      if(attempt.current.fingerprint!==fingerprint)attempt.current={fingerprint,key:crypto.randomUUID()}
      sending.current=true;setBusy(true)
      try {
        const receipt=await contactApi.submit(draft,attempt.current.key)
        form.reset();attempt.current={fingerprint:'',key:crypto.randomUUID()}
        setStatus(`Consulta ${receipt.id} guardada en este equipo para coordinación. No se reservó una clase ni se envió correo.`)
      }catch(error){setSendError(error instanceof Error?error.message:'No pudimos guardar la consulta. Tu información sigue en el formulario.')}
      finally{sending.current=false;setBusy(false)}
      return
    }
    form.reset()
    setStatus(contact
      ? 'Demostración completada. No se enviaron ni guardaron datos y no se reservó ninguna clase.'
      : 'Demostración completada. No se guardó el correo ni se enviarán avisos. La plataforma es una propuesta futura.')
  }

  return (
    <form className={contact ? s.contact__form : s.waitlist} noValidate onSubmit={event=>{void submit(event)}} aria-busy={busy} onInput={() => setStatus('')} aria-label={contact ? 'Formulario de contacto CAI' : 'Lista de interés de demostración'}>
      {contact ? <>
        <p className={s['content-note']} id={`${id}-help`}>Prueba local con datos ficticios. La consulta se guarda para coordinación; no reserva una clase ni envía correo.</p>
        <div className={s.field}>
          <label htmlFor={`${id}-nombre`}>Nombre de muestra</label>
          <input id={`${id}-nombre`} name="nombre" disabled={busy} type="text" autoComplete="off" placeholder="Persona Demo" required maxLength={80} aria-invalid={Boolean(errors.nombre)} aria-describedby={describedBy('nombre')} />
          {error('nombre')}
        </div>
        <div className={s.field}>
          <label htmlFor={`${id}-contacto`}>Correo o teléfono de muestra</label>
          <input id={`${id}-contacto`} name="contacto" disabled={busy} type="text" autoComplete="off" placeholder="demo@example.test" required maxLength={120} aria-invalid={Boolean(errors.contacto)} aria-describedby={describedBy('contacto')} />
          {error('contacto')}
        </div>
        <div className={s.field}>
          <label htmlFor={`${id}-programa`}>Programa de interés</label>
          <select id={`${id}-programa`} name="programa" disabled={busy} required defaultValue="" aria-invalid={Boolean(errors.programa)} aria-describedby={describedBy('programa')}>
            <option value="" disabled>Selecciona un programa</option>
            {contactPrograms.map(({ id: programId, title }) => <option key={programId} value={programId}>{title}</option>)}
          </select>
          {error('programa')}
        </div>
        <div className={s.field}><label className={s['contact-consent']}><input name="consent" type="checkbox" disabled={busy} required aria-invalid={Boolean(errors.consent)} aria-describedby={describedBy('consent')} /><span>Acepto que CAI use estos datos para atender mi consulta.</span></label>{error('consent')}</div>
      </> : <>
        <div className={s.field}>
          <label className={s['sr-only']} htmlFor={`${id}-email`}>Correo de muestra</label>
          <input id={`${id}-email`} name="email" type="email" inputMode="email" autoComplete="off" placeholder="demo@example.test" required maxLength={120} aria-invalid={Boolean(errors.email)} aria-describedby={describedBy('email')} />
          {error('email')}
        </div>
      </>}
      <button className={cx(s.btn, s['btn--primary'], contact && s['btn--lg'])} type="submit" disabled={busy}>{contact ? busy ? 'Guardando…' : 'Enviar consulta' : 'Probar lista de interés'}</button>
      {!contact && <p className={s['content-note']} id={`${id}-help`}>Solo demostración: no se crea una lista de espera ni se envían avisos.</p>}
      {sendError && <p className={s['field-error']} role="alert">{sendError}</p>}
      <p className={s['form-status']} role="status" aria-live="polite" aria-atomic="true">{status}</p>
    </form>
  )
}
