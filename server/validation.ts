import type { Submission } from './contracts.ts'
import { accessRequests, students } from '../src/features/admin/data/mockData.ts'

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new HttpError(400, 'Revisa los datos enviados.')
  return value as Record<string, unknown>
}

function text(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max || [...value].some((char) => char.charCodeAt(0) < 32 && ![9, 10, 13].includes(char.charCodeAt(0)))) {
    throw new HttpError(400, `Revisa ${label}.`)
  }
  return value.trim()
}

export function ageAt(birthDate: string, today = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw new HttpError(400, 'Revisa la fecha de nacimiento.')
  const date = new Date(`${birthDate}T12:00:00Z`)
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== birthDate) throw new HttpError(400, 'Revisa la fecha de nacimiento.')
  const current = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(today)
  const age = Number(current.slice(0, 4)) - Number(birthDate.slice(0, 4)) - (current.slice(5) < birthDate.slice(5) ? 1 : 0)
  if (age < 5 || age > 99) throw new HttpError(400, 'La edad debe estar entre 5 y 99 años.')
  return age
}

export function validateSubmission(value: unknown, now = new Date()): Submission {
  const v = record(value)
  const allowed = ['firstName', 'lastName', 'birthDate', 'email', 'filledBy', 'program', 'group', 'studentCode', 'displayName', 'avatarColor', 'visibility', 'message', 'guardian', 'guardianConsent', 'acceptRules', 'acceptPrivacy']
  if (Object.keys(v).some((key) => !allowed.includes(key))) throw new HttpError(400, 'La solicitud contiene datos no admitidos.')
  const birthDate = text(v.birthDate, 'la fecha de nacimiento', 10, 10)
  const age = ageAt(birthDate, now)
  const minor = age < 18
  if (!['alumno', 'tutor'].includes(String(v.filledBy)) || (age < 13 && v.filledBy !== 'tutor') || (!minor && v.filledBy !== 'alumno')) throw new HttpError(400, 'Revisa quién llena la solicitud.')
  const email = text(v.email, 'el correo', 5, 160).toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Revisa el correo electrónico.')
  if (v.acceptRules !== true || v.acceptPrivacy !== true) throw new HttpError(400, 'Debes aceptar las normas y el aviso de privacidad de prueba.')
  if (typeof v.guardianConsent !== 'boolean') throw new HttpError(400, 'Revisa la autorización del tutor.')
  if (v.visibility !== 'privado' && v.visibility !== 'comunidad') throw new HttpError(400, 'Revisa la visibilidad del perfil.')
  const program = text(v.program, 'el programa', 2, 100)
  const group = text(v.group, 'el grupo', 2, 100)
  const programs = new Set([...students, ...accessRequests].map((item) => item.program))
  const groups = students.filter((student) => student.program === program).map((student) => student.group)
  if (!programs.has(program) || (groups.length ? !groups.includes(group) : group !== 'Por asignar')) throw new HttpError(400, 'Elige un programa y grupo del catálogo de prueba.')
  const firstName = text(v.firstName, 'el nombre', 2, 60)
  const lastName = text(v.lastName, 'los apellidos', 2, 80)
  const displayName = text(v.displayName, 'el nombre visible', 1, 141)
  // Los menores no pueden enviar un nombre completo ni hacerse públicos alterando el navegador.
  const safeNames = [`${firstName.split(/\s+/)[0]} ${lastName[0]!.toUpperCase()}.`, `${firstName[0]!.toUpperCase()}. ${lastName[0]!.toUpperCase()}.`]
  if (minor && (v.visibility !== 'privado' || !safeNames.includes(displayName))) throw new HttpError(400, 'El perfil de un menor debe usar nombre abreviado y visibilidad privada.')
  let guardian: Submission['guardian']
  if (minor) {
    if (v.guardianConsent !== true) throw new HttpError(400, 'Falta la autorización inicial del tutor.')
    const g = record(v.guardian)
    const contact = text(g.contact, 'el contacto del tutor', 5, 120)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) && !(/^[+\d\s().-]+$/.test(contact) && /^\d{10,15}$/.test(contact.replace(/\D/g, '')))) throw new HttpError(400, 'Revisa el contacto del tutor.')
    guardian = { name: text(g.name, 'el nombre del tutor', 3, 100), relationship: text(g.relationship, 'el parentesco', 2, 60), contact }
  }
  const studentCode = v.studentCode ? text(v.studentCode, 'la matrícula', 4, 12) : undefined
  if (studentCode && !/^[A-Za-z0-9-]+$/.test(studentCode)) throw new HttpError(400, 'Revisa la matrícula.')
  const avatarColor = text(v.avatarColor, 'el avatar', 7, 7)
  if (!/^#[a-f0-9]{6}$/i.test(avatarColor)) throw new HttpError(400, 'Revisa el color del avatar.')
  return {
    firstName, lastName, birthDate, email, filledBy: v.filledBy as Submission['filledBy'],
    program, group,
    studentCode, displayName, avatarColor, visibility: v.visibility,
    message: text(v.message ?? '', 'el mensaje', 0, 240), guardian,
    guardianConsent: minor, acceptRules: true, acceptPrivacy: true,
  }
}

export function revisionOf(value: unknown) {
  if (!Number.isSafeInteger(value) || Number(value) < 1) throw new HttpError(400, 'Falta la versión del registro. Vuelve a cargarlo.')
  return Number(value)
}
