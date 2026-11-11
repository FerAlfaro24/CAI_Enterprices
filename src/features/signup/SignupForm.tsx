import { useEffect, useId, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent, type ReactNode, type Ref } from 'react'
import { Link } from 'react-router'
import { useDemoStore } from '../../app/demoStore'
import type { AccessRequest } from '../admin/data/mockData'
import { nextRequestId } from '../admin/state'
import { localApi } from '../local-access/api'
import { cx } from '../landing/utils'
import {
  ageFrom, avatarColors, communityRules, groupsFor, isEmail, isPhone, relationships,
  signupPrograms, todayIso, visibleName, type NameStyle,
} from './options'
import s from './signup.module.css'

type Values = {
  filledBy: '' | 'alumno' | 'tutor'
  firstName: string
  lastName: string
  birthDate: string
  email: string
  password: string
  confirm: string
  program: string
  group: string
  studentCode: string
  guardianName: string
  relationship: string
  guardianContact: string
  guardianConsent: boolean
  nameStyle: NameStyle
  avatarColor: string
  visibility: 'privado' | 'comunidad'
  message: string
  acceptRules: boolean
  acceptPrivacy: boolean
}
type FieldName = keyof Values
type Errors = Partial<Record<FieldName, string>>

const initialValues: Values = {
  filledBy: '', firstName: '', lastName: '', birthDate: '', email: '', password: '', confirm: '',
  program: '', group: '', studentCode: '', guardianName: '', relationship: '', guardianContact: '',
  guardianConsent: false, nameStyle: 'short', avatarColor: avatarColors[0]!.id, visibility: 'privado',
  message: '', acceptRules: false, acceptPrivacy: false,
}

const steps = [
  { title: 'Datos del alumno', short: 'Alumno' },
  { title: 'Autorización del tutor', short: 'Tutor' },
  { title: 'Perfil y privacidad', short: 'Perfil' },
  { title: 'Revisar y enviar', short: 'Enviar' },
] as const

const passwordRules = [
  { label: 'Al menos 8 caracteres', test: (value: string) => value.length >= 8 },
  { label: 'Una letra y un número', test: (value: string) => /[a-zA-Z]/.test(value) && /\d/.test(value) },
]

export function SignupForm({ local = false }: { local?: boolean }) {
  const id = useId()
  const { state, dispatch } = useDemoStore()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<Errors>({})
  const [step, setStep] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [submitted, setSubmitted] = useState<AccessRequest | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const submissionKey = useRef(crypto.randomUUID())
  const heading = useRef<HTMLHeadingElement>(null)
  const form = useRef<HTMLFormElement>(null)
  const focusKey = useRef('0-')

  const age = values.birthDate ? ageFrom(values.birthDate) : null
  const isMinor = age !== null && age < 18
  const byTutor = values.filledBy === 'tutor'
  const groups = groupsFor(values.program)
  const color = avatarColors.find(({ id: colorId }) => colorId === values.avatarColor) ?? avatarColors[0]!
  const shownName = visibleName(values.firstName, values.lastName, values.nameStyle) || 'Tu nombre'

  useEffect(() => {
    // Mueve el foco al título solo cuando cambia el paso (no en la carga inicial).
    const key = `${step}-${submitted?.id ?? ''}`
    if (focusKey.current === key) return
    focusKey.current = key
    heading.current?.focus()
  }, [step, submitted])

  const set = <K extends FieldName>(name: K, value: Values[K]) => {
    setValues((current) => ({ ...current, [name]: value }))
    setErrors((current) => (current[name] ? { ...current, [name]: undefined } : current))
  }
  const onText = (name: FieldName) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    set(name, event.target.value as never)

  const validate = (index: number): Errors => {
    const next: Errors = {}
    const v = values
    if (index === 0) {
      if (!v.filledBy) next.filledBy = 'Indica quién llena la solicitud.'
      if (v.firstName.trim().length < 2) next.firstName = 'Escribe el nombre (al menos 2 letras).'
      if (v.lastName.trim().length < 2) next.lastName = 'Escribe al menos un apellido.'
      if (age === null) next.birthDate = 'Indica la fecha de nacimiento.'
      else if (age < 5 || age > 99) next.birthDate = 'Revisa la fecha: la edad debe estar entre 5 y 99 años.'
      else if (v.filledBy === 'alumno' && age < 13) next.filledBy = 'Para menores de 13 años, la solicitud la llena su madre, padre o tutor.'
      else if (v.filledBy === 'tutor' && age >= 18) next.filledBy = 'Los alumnos mayores de edad llenan su propia solicitud.'
      if (!isEmail(v.email.trim())) next.email = 'Escribe un correo con formato válido, por ejemplo demo@example.test.'
      if (!local) {
        if (!passwordRules.every(({ test }) => test(v.password))) next.password = 'La contraseña debe tener al menos 8 caracteres, una letra y un número.'
        else if (v.confirm !== v.password) next.confirm = 'Las contraseñas no coinciden.'
      }
      if (!v.program) next.program = 'Selecciona el programa en el que está inscrito.'
      if (v.program && groups.length > 0 && !v.group) next.group = 'Selecciona su grupo u horario.'
      if (v.studentCode && !/^[A-Za-z0-9-]{4,12}$/.test(v.studentCode.trim())) next.studentCode = 'Usa de 4 a 12 letras, números o guiones.'
    }
    if (index === 1) {
      if (v.guardianName.trim().length < 3) next.guardianName = 'Escribe el nombre completo del tutor.'
      if (!v.relationship) next.relationship = 'Selecciona el parentesco.'
      const contact = v.guardianContact.trim()
      if (!isEmail(contact) && !isPhone(contact)) next.guardianContact = 'Escribe un correo válido o un teléfono de 10 a 15 dígitos.'
      if (!v.guardianConsent) next.guardianConsent = 'La autorización del tutor es necesaria para continuar.'
    }
    if (index === 3) {
      if (!v.acceptRules) next.acceptRules = 'Acepta las normas de la comunidad para enviar la solicitud.'
      if (!v.acceptPrivacy) next.acceptPrivacy = 'Acepta el aviso de privacidad para enviar la solicitud.'
    }
    return next
  }

  const focusFirstError = (next: Errors) => {
    const first = Object.keys(next)[0]
    if (!first) return
    requestAnimationFrame(() => {
      const field = form.current?.querySelector<HTMLElement>(`[name="${first}"]`)
      field?.focus()
    })
  }

  /** Avanza o retrocede saltando el paso del tutor cuando el alumno es adulto. */
  const goTo = (target: number) => {
    let index = target
    if (index === 1 && !isMinor) index = target > step ? 2 : 0
    setStep(index)
  }

  const next = () => {
    const found = validate(step)
    setErrors(found)
    if (Object.keys(found).length > 0) { focusFirstError(found); return }
    if (step === 0 && isMinor) setValues((current) => ({ ...current, visibility: 'privado', nameStyle: current.nameStyle === 'full' ? 'short' : current.nameStyle }))
    goTo(step + 1)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving) return
    if (step < steps.length - 1) { next(); return }
    const found = validate(3)
    setErrors(found)
    if (Object.keys(found).length > 0) { focusFirstError(found); return }
    const request: AccessRequest = {
      id: nextRequestId(state.requests),
      name: `${values.firstName.trim()} ${values.lastName.trim()}`,
      program: values.program,
      ageGroup: isMinor ? 'menor' : 'adulto',
      guardianConsent: isMinor ? 'pendiente' : undefined,
      source: 'Formulario web',
      submittedAt: todayIso(),
      message: values.message.trim() || 'Sin mensaje adicional.',
      status: 'pendiente',
      applicant: {
        filledBy: byTutor ? 'tutor' : 'alumno',
        email: values.email.trim(),
        age: age ?? 0,
        group: values.group || 'Por asignar',
        studentCode: values.studentCode.trim() || undefined,
        displayName: shownName,
        avatarColor: color.value,
        visibility: isMinor ? 'privado' : values.visibility,
        guardian: isMinor ? { name: values.guardianName.trim(), relationship: values.relationship, contact: values.guardianContact.trim() } : undefined,
      },
    }
    if (local) {
      setSaving(true); setSaveError('')
      try {
        const receipt = await localApi.submit({
          firstName: values.firstName.trim(), lastName: values.lastName.trim(), birthDate: values.birthDate,
          email: values.email.trim(), filledBy: byTutor ? 'tutor' : 'alumno', program: values.program,
          group: values.group || 'Por asignar', studentCode: values.studentCode.trim() || undefined,
          displayName: shownName, avatarColor: color.value, visibility: isMinor ? 'privado' : values.visibility,
          message: values.message.trim(), guardian: request.applicant?.guardian,
          guardianConsent: values.guardianConsent, acceptRules: values.acceptRules, acceptPrivacy: values.acceptPrivacy,
        }, submissionKey.current)
        setSubmitted({ ...request, ...receipt })
      } catch (error) { setSaveError(error instanceof Error ? error.message : 'No se pudo guardar la solicitud.') }
      finally { setSaving(false) }
    } else {
      dispatch({ type: 'submit', request })
      setSubmitted(request)
    }
  }

  const restart = () => {
    setValues(initialValues)
    setErrors({})
    setStep(0)
    setSubmitted(null)
    setSaveError('')
    submissionKey.current = crypto.randomUUID()
  }

  if (submitted) return <SignupSuccess ref={heading} request={submitted} onRestart={restart} local={local} />

  const err = (name: FieldName) => errors[name]
  const describe = (name: FieldName, hint?: boolean) =>
    [hint && `${id}-${name}-hint`, errors[name] && `${id}-${name}-error`].filter(Boolean).join(' ') || undefined
  const fieldProps = (name: FieldName, hint?: boolean) => ({
    id: `${id}-${name}`, name, 'aria-invalid': Boolean(errors[name]), 'aria-describedby': describe(name, hint),
  })

  return (
    <form ref={form} className={s.form} noValidate onSubmit={(event) => { void submit(event) }} aria-labelledby={`${id}-title`} aria-busy={saving}>
      <Stepper current={step} skipTutor={values.birthDate !== '' && !isMinor} onSelect={(index) => goTo(index)} />

      <div className={s['step-head']}>
        <p className={s['step-count']}>Paso {step + 1} de {steps.length}</p>
        <h2 id={`${id}-title`} ref={heading} tabIndex={-1}>{steps[step]!.title}</h2>
      </div>

      {Object.values(errors).some(Boolean) && (
        <p className={s['error-summary']} role="alert">Revisa los campos marcados para continuar.</p>
      )}

      {step === 0 && (
        <div className={s.fields}>
          <fieldset className={s.choice} aria-describedby={describe('filledBy')}>
            <legend>¿Quién llena esta solicitud?</legend>
            <div className={s['choice-grid']}>
              <RadioCard name="filledBy" value="alumno" checked={values.filledBy === 'alumno'} onChange={() => set('filledBy', 'alumno')} title="Soy el alumno" text="Tengo 13 años o más." />
              <RadioCard name="filledBy" value="tutor" checked={values.filledBy === 'tutor'} onChange={() => set('filledBy', 'tutor')} title="Soy madre, padre o tutor" text="Lleno la solicitud por un menor." />
            </div>
            <FieldError id={`${id}-filledBy-error`} message={err('filledBy')} />
          </fieldset>

          <div className={s.row}>
            <Field label={byTutor ? 'Nombre(s) del alumno' : 'Nombre(s)'} htmlFor={`${id}-firstName`} error={err('firstName')} errorId={`${id}-firstName-error`}>
              <input {...fieldProps('firstName')} type="text" autoComplete="off" maxLength={60} value={values.firstName} onChange={onText('firstName')} placeholder="Alumno" />
            </Field>
            <Field label={byTutor ? 'Apellidos del alumno' : 'Apellidos'} htmlFor={`${id}-lastName`} error={err('lastName')} errorId={`${id}-lastName-error`}>
              <input {...fieldProps('lastName')} type="text" autoComplete="off" maxLength={80} value={values.lastName} onChange={onText('lastName')} placeholder="Demo" />
            </Field>
          </div>

          <Field label="Fecha de nacimiento" htmlFor={`${id}-birthDate`} hint={age !== null && age >= 5 && age <= 99 ? (isMinor ? `${age} años · Se pedirá la autorización del tutor.` : `${age} años`) : 'Sirve para saber si se necesita autorización de un tutor.'} hintId={`${id}-birthDate-hint`} error={err('birthDate')} errorId={`${id}-birthDate-error`}>
            <input {...fieldProps('birthDate', true)} type="date" max={todayIso()} value={values.birthDate} onChange={onText('birthDate')} className={s.short} />
          </Field>

          <div className={s.row}>
            <Field label="Programa" htmlFor={`${id}-program`} error={err('program')} errorId={`${id}-program-error`}>
              <select {...fieldProps('program')} value={values.program} onChange={(event) => { set('program', event.target.value); set('group', '') }}>
                <option value="" disabled>Selecciona un programa</option>
                {signupPrograms.map((program) => <option key={program}>{program}</option>)}
              </select>
            </Field>
            <Field label="Grupo u horario" htmlFor={`${id}-group`} error={err('group')} errorId={`${id}-group-error`}>
              <select {...fieldProps('group')} value={values.group} onChange={onText('group')} disabled={!values.program || groups.length === 0}>
                <option value="">{!values.program ? 'Elige primero un programa' : groups.length === 0 ? 'CAI lo asignará' : 'Selecciona un grupo'}</option>
                {groups.map((group) => <option key={group}>{group}</option>)}
              </select>
            </Field>
          </div>

          <Field label={<>Matrícula CAI <span className={s.optional}>(opcional)</span></>} htmlFor={`${id}-studentCode`} hint="Viene en tu ficha de inscripción. Ayuda a confirmar más rápido que estás inscrito." hintId={`${id}-studentCode-hint`} error={err('studentCode')} errorId={`${id}-studentCode-error`}>
            <input {...fieldProps('studentCode', true)} type="text" autoComplete="off" maxLength={12} value={values.studentCode} onChange={onText('studentCode')} placeholder="DEMO-001" className={s.short} />
          </Field>

          <div className={s.divider}><span>{local ? 'Correo de contacto' : 'Datos de acceso'}</span></div>

          <Field label={byTutor ? 'Correo del tutor para entrar' : 'Correo electrónico'} htmlFor={`${id}-email`} hint="Usa un correo ficticio: en la demo no se envían mensajes." hintId={`${id}-email-hint`} error={err('email')} errorId={`${id}-email-error`}>
            <input {...fieldProps('email', true)} type="email" inputMode="email" autoComplete="off" maxLength={120} value={values.email} onChange={onText('email')} placeholder="demo@example.test" />
          </Field>

          {!local && <>
          <div className={s.row}>
            <Field label="Contraseña" htmlFor={`${id}-password`} error={err('password')} errorId={`${id}-password-error`}>
              <div className={s['password-wrap']}>
                <input {...fieldProps('password', true)} type={showPassword ? 'text' : 'password'} autoComplete="off" maxLength={64} value={values.password} onChange={onText('password')} />
                <button type="button" className={s.reveal} aria-pressed={showPassword} aria-controls={`${id}-password`} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </Field>
            <Field label="Confirmar contraseña" htmlFor={`${id}-confirm`} error={err('confirm')} errorId={`${id}-confirm-error`}>
              <input {...fieldProps('confirm')} type={showPassword ? 'text' : 'password'} autoComplete="off" maxLength={64} value={values.confirm} onChange={onText('confirm')} />
            </Field>
          </div>
          <ul className={s.rules} id={`${id}-password-hint`}>
            {passwordRules.map(({ label, test }) => {
              const ok = test(values.password)
              return <li key={label} className={cx(ok && s['rule--ok'])}><Check on={ok} />{label}<span className={s['sr-only']}>{ok ? ': cumplido' : ': pendiente'}</span></li>
            })}
            <li className={s['rule-note']}>No uses una contraseña real: la demo no la guarda.</li>
          </ul>
          </>}
          {local && <p className={s.hint}>Esta solicitud no crea una cuenta ni pide contraseña. Usa un correo ficticio durante las pruebas locales.</p>}
        </div>
      )}

      {step === 1 && (
        <div className={s.fields}>
          <p className={s.intro}>
            {byTutor
              ? `Como ${values.firstName.trim() || 'el alumno'} es menor de edad, necesitamos tus datos y tu autorización.`
              : `Como eres menor de edad, tu madre, padre o tutor debe autorizar tu participación. CAI confirmará la autorización con esa persona antes de activar tu cuenta.`}
          </p>
          <Field label={byTutor ? 'Tu nombre completo' : 'Nombre completo del tutor'} htmlFor={`${id}-guardianName`} error={err('guardianName')} errorId={`${id}-guardianName-error`}>
            <input {...fieldProps('guardianName')} type="text" autoComplete="off" maxLength={100} value={values.guardianName} onChange={onText('guardianName')} placeholder="Tutor Demo" />
          </Field>
          <div className={s.row}>
            <Field label="Parentesco" htmlFor={`${id}-relationship`} error={err('relationship')} errorId={`${id}-relationship-error`}>
              <select {...fieldProps('relationship')} value={values.relationship} onChange={onText('relationship')}>
                <option value="" disabled>Selecciona</option>
                {relationships.map((relationship) => <option key={relationship}>{relationship}</option>)}
              </select>
            </Field>
            <Field label="Correo o teléfono del tutor" htmlFor={`${id}-guardianContact`} error={err('guardianContact')} errorId={`${id}-guardianContact-error`}>
              <input {...fieldProps('guardianContact')} type="text" autoComplete="off" maxLength={120} value={values.guardianContact} onChange={onText('guardianContact')} placeholder="tutor@example.test" />
            </Field>
          </div>
          <div className={s['consent-box']}>
            <h3>Qué autoriza el tutor</h3>
            <ul>
              <li>Que el menor vea la comunidad de alumnos de CAI.</li>
              <li>Que comparta publicaciones que el equipo de CAI revisará antes de mostrarlas.</li>
              <li>Que su perfil sea privado: solo su grupo verá su nombre visible.</li>
            </ul>
            <Checkbox {...fieldProps('guardianConsent')} checked={values.guardianConsent} onChange={(checked) => set('guardianConsent', checked)}>
              {byTutor ? 'Autorizo' : 'Mi tutor autoriza'} la participación del menor en la comunidad. CAI confirmará esta autorización por separado.
            </Checkbox>
            <FieldError id={`${id}-guardianConsent-error`} message={err('guardianConsent')} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={s.fields}>
          <div className={s['profile-grid']}>
            <div className={s['profile-fields']}>
              <fieldset className={s.choice}>
                <legend>Nombre visible en la comunidad</legend>
                <div className={s['choice-list']}>
                  <RadioCard name="nameStyle" value="short" checked={values.nameStyle === 'short'} onChange={() => set('nameStyle', 'short')} title={visibleName(values.firstName, values.lastName, 'short')} text="Nombre e inicial del apellido · Recomendado" />
                  <RadioCard name="nameStyle" value="initials" checked={values.nameStyle === 'initials'} onChange={() => set('nameStyle', 'initials')} title={visibleName(values.firstName, values.lastName, 'initials')} text="Solo iniciales" />
                  <RadioCard name="nameStyle" value="full" checked={values.nameStyle === 'full'} onChange={() => set('nameStyle', 'full')} title={visibleName(values.firstName, values.lastName, 'full')} text={isMinor ? 'No disponible para menores de edad' : 'Nombre completo'} disabled={isMinor} />
                </div>
              </fieldset>

              <fieldset className={s.choice}>
                <legend>Color de tu avatar</legend>
                <div className={s.swatches}>
                  {avatarColors.map(({ id: colorId, label, value }) => (
                    <label key={colorId} className={s.swatch} style={{ '--swatch': value } as CSSProperties}>
                      <input type="radio" name="avatarColor" value={colorId} checked={values.avatarColor === colorId} onChange={() => set('avatarColor', colorId)} />
                      <span aria-hidden="true" />
                      <span className={s['sr-only']}>{label}</span>
                    </label>
                  ))}
                </div>
                <p className={s.hint}>Usamos iniciales en lugar de fotografía para proteger la privacidad.</p>
              </fieldset>

              <fieldset className={s.choice}>
                <legend>¿Quién puede ver tu perfil?</legend>
                <div className={s['choice-grid']}>
                  <RadioCard name="visibility" value="privado" checked={values.visibility === 'privado'} onChange={() => set('visibility', 'privado')} title="Solo mi grupo" text="Tus compañeros y maestros." />
                  <RadioCard name="visibility" value="comunidad" checked={values.visibility === 'comunidad'} onChange={() => set('visibility', 'comunidad')} title="Toda la comunidad" text={isMinor ? 'No disponible para menores de edad' : 'Todos los alumnos de CAI.'} disabled={isMinor} />
                </div>
              </fieldset>

              <Field label={<>Mensaje para CAI <span className={s.optional}>(opcional)</span></>} htmlFor={`${id}-message`} hint={`${values.message.length}/240 · ¿Qué te gustaría compartir en la comunidad?`} hintId={`${id}-message-hint`}>
                <textarea {...fieldProps('message', true)} rows={3} maxLength={240} value={values.message} onChange={onText('message')} placeholder="Quiero compartir mis avances del curso." />
              </Field>
            </div>

            <aside className={s.preview} aria-label="Vista previa del perfil">
              <p className={s['preview-label']}>Vista previa</p>
              <div className={s['preview-card']}>
                <span className={s['preview-avatar']} style={{ background: color.value }} aria-hidden="true">{initialsOf(values.firstName, values.lastName)}</span>
                <strong>{shownName}</strong>
                <span>{values.program || 'Programa'}</span>
                <span className={s['preview-chip']}>{values.visibility === 'privado' || isMinor ? 'Visible para su grupo' : 'Visible para la comunidad'}</span>
              </div>
              <div className={s['preview-post']} aria-hidden="true">
                <span className={s['preview-tag']}>Logro</span>
                <span className={s.skeleton} /><span className={cx(s.skeleton, s['skeleton--short'])} />
              </div>
            </aside>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className={s.fields}>
          <div className={s.summary}>
            <SummaryBlock title="Alumno" onEdit={() => goTo(0)}>
              <dt>Nombre</dt><dd>{values.firstName} {values.lastName}</dd>
              <dt>Edad</dt><dd>{age} años{isMinor && ' · Menor de edad'}</dd>
              <dt>Programa</dt><dd>{values.program}{values.group && ` · ${values.group}`}</dd>
              {values.studentCode && <><dt>Matrícula</dt><dd>{values.studentCode}</dd></>}
              <dt>Correo</dt><dd>{values.email}</dd>
            </SummaryBlock>
            {isMinor && (
              <SummaryBlock title="Tutor" onEdit={() => goTo(1)}>
                <dt>Nombre</dt><dd>{values.guardianName}</dd>
                <dt>Parentesco</dt><dd>{values.relationship}</dd>
                <dt>Contacto</dt><dd>{values.guardianContact}</dd>
                <dt>Autorización</dt><dd>Marcada · CAI la confirmará</dd>
              </SummaryBlock>
            )}
            <SummaryBlock title="Perfil" onEdit={() => goTo(2)}>
              <dt>Nombre visible</dt><dd>{shownName}</dd>
              <dt>Visibilidad</dt><dd>{values.visibility === 'privado' || isMinor ? 'Solo su grupo' : 'Toda la comunidad'}</dd>
            </SummaryBlock>
          </div>

          <details className={s.norms}>
            <summary>Leer las normas de la comunidad</summary>
            <ol>{communityRules.map((rule) => <li key={rule}>{rule}</li>)}</ol>
          </details>

          <div className={s.checks}>
            <Checkbox {...fieldProps('acceptRules')} checked={values.acceptRules} onChange={(checked) => set('acceptRules', checked)}>
              Acepto las normas de la comunidad de CAI.
            </Checkbox>
            <FieldError id={`${id}-acceptRules-error`} message={err('acceptRules')} />
            <Checkbox {...fieldProps('acceptPrivacy')} checked={values.acceptPrivacy} onChange={(checked) => set('acceptPrivacy', checked)}>
              He leído el aviso de privacidad <span className={s.optional}>(texto pendiente de redactar con CAI)</span>.
            </Checkbox>
            <FieldError id={`${id}-acceptPrivacy-error`} message={err('acceptPrivacy')} />
          </div>
        </div>
      )}

      {saveError && <p role="alert" className={s['error-summary']}>{saveError}</p>}
      <div className={s.actions}>
        {step > 0 && <button type="button" disabled={saving} className={cx(s.btn, s['btn--ghost'])} onClick={() => { setErrors({}); goTo(step - 1) }}>Atrás</button>}
        <button type="submit" disabled={saving} className={cx(s.btn, s['btn--primary'])}>
          {saving ? 'Guardando…' : step === steps.length - 1 ? 'Enviar solicitud' : 'Continuar'}
        </button>
      </div>
    </form>
  )
}

function initialsOf(firstName: string, lastName: string) {
  return `${firstName.trim()[0] ?? ''}${lastName.trim()[0] ?? ''}`.toUpperCase() || '?'
}

function Stepper({ current, skipTutor, onSelect }: { current: number; skipTutor: boolean; onSelect: (index: number) => void }) {
  return (
    <ol className={s.stepper} aria-label="Pasos de la solicitud">
      {steps.map(({ short }, index) => {
        const skipped = index === 1 && skipTutor
        const done = index < current && !skipped
        const status = index === current ? 'paso actual' : skipped ? 'no aplica' : done ? 'completado' : 'pendiente'
        return (
          <li key={short} className={cx(s.step, index === current && s['step--current'], done && s['step--done'], skipped && s['step--skipped'])} aria-current={index === current ? 'step' : undefined}>
            {done ? (
              <button type="button" onClick={() => onSelect(index)}>
                <span className={s['step-dot']}><Check on /></span><span className={s['step-label']}>{short}</span><span className={s['sr-only']}> ({status}, volver a este paso)</span>
              </button>
            ) : (
              <span className={s['step-inner']}>
                <span className={s['step-dot']}>{index + 1}</span><span className={s['step-label']}>{skipped ? `${short} · No aplica` : short}</span>{!skipped && <span className={s['sr-only']}> ({status})</span>}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function Field({ label, htmlFor, hint, hintId, error, errorId, children }: {
  label: ReactNode; htmlFor: string; hint?: string; hintId?: string; error?: string; errorId?: string; children: ReactNode
}) {
  return (
    <div className={cx(s.field, error && s['field--error'])}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className={s.hint} id={hintId}>{hint}</p>}
      <FieldError id={errorId} message={error} />
    </div>
  )
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null
  return <p className={s['field-error']} id={id}>{message}</p>
}

function RadioCard({ name, value, checked, onChange, title, text, disabled }: {
  name: string; value: string; checked: boolean; onChange: () => void; title: string; text: string; disabled?: boolean
}) {
  return (
    <label className={cx(s['radio-card'], checked && s['radio-card--on'], disabled && s['radio-card--off'])}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} disabled={disabled} />
      <span><strong>{title || '—'}</strong><small>{text}</small></span>
    </label>
  )
}

function Checkbox({ checked, onChange, children, ...rest }: {
  id: string; name: string; 'aria-invalid': boolean; 'aria-describedby'?: string
  checked: boolean; onChange: (checked: boolean) => void; children: ReactNode
}) {
  return (
    <label className={s.checkbox} htmlFor={rest.id}>
      <input type="checkbox" {...rest} checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{children}</span>
    </label>
  )
}

function SummaryBlock({ title, onEdit, children }: { title: string; onEdit: () => void; children: ReactNode }) {
  return (
    <section className={s['summary-block']} aria-label={title}>
      <div><h3>{title}</h3><button type="button" className={s.link} onClick={onEdit}>Editar<span className={s['sr-only']}> {title.toLowerCase()}</span></button></div>
      <dl>{children}</dl>
    </section>
  )
}

function Check({ on }: { on: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {on ? <path d="m5 12 5 5L20 7" /> : <circle cx="12" cy="12" r="4" />}
    </svg>
  )
}

function SignupSuccess({ ref, request, onRestart, local = false }: { ref: Ref<HTMLHeadingElement>; request: AccessRequest; onRestart: () => void; local?: boolean }) {
  const minor = request.ageGroup === 'menor'
  const timeline = [
    { title: 'Solicitud recibida', text: `Folio ${request.id} · Hoy`, done: true },
    ...(minor ? [{ title: 'Autorización del tutor', text: 'Recepción la confirmará con el tutor registrado.', done: false }] : []),
    { title: 'Revisión de CAI', text: 'La coordinación verifica que el alumno esté inscrito.', done: false },
    { title: 'Acceso a la comunidad', text: local ? 'Tras la aprobación, coordinación preparará tu enlace de activación. En las pruebas locales no se envían correos.' : 'Llegaría un aviso al correo registrado. En la demo no se envían correos.', done: false },
  ]
  return (
    <div className={s.success}>
      <span className={s['success-icon']} aria-hidden="true"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7" /></svg></span>
      <h2 ref={ref} tabIndex={-1}>¡Solicitud enviada!</h2>
      <p>La solicitud <strong>{request.id}</strong> de {request.applicant?.displayName ?? request.name} quedó pendiente de revisión. {local ? 'Se guardó en este equipo. Todavía no se creó una cuenta de alumno.' : 'Esto es una simulación: no se creó una cuenta real.'}</p>
      <ol className={s.timeline} aria-label="Qué sigue">
        {timeline.map(({ title, text, done }) => (
          <li key={title} className={cx(done && s['timeline--done'])}>
            <span className={s['timeline-dot']} aria-hidden="true">{done && <Check on />}</span>
            <div><strong>{title}</strong><span>{text}</span><span className={s['sr-only']}>{done ? ' · Completado' : ' · Pendiente'}</span></div>
          </li>
        ))}
      </ol>
      <div className={s['success-actions']}>
        {local ? <Link to="/" className={cx(s.btn, s['btn--primary'])}>Volver al sitio</Link> : <>
          <Link to="/login" className={cx(s.btn, s['btn--ghost'])}>Continuar al acceso demo</Link>
          <Link to="/admin/solicitudes" className={cx(s.btn, s['btn--primary'])}>Ver la solicitud en el panel (demo)</Link>
        </>}
        <button type="button" className={cx(s.btn, s['btn--ghost'])} onClick={onRestart}>Llenar otra solicitud</button>
      </div>
      <p className={s.hint}>{local ? 'Conserva tu folio. La solicitud permanece guardada aunque cierres la página.' : 'La solicitud se conserva mientras no recargues la página.'}</p>
    </div>
  )
}
