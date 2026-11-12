import { accessRequests, students } from '../admin/data/mockData'

/** Programas y grupos ficticios, tomados de los datos de muestra del panel. */
export const signupPrograms = [...new Set([...students, ...accessRequests].map(({ program }) => program))].sort((a, b) => a.localeCompare(b, 'es'))

export function groupsFor(program: string) {
  return [...new Set(students.filter((student) => student.program === program).map(({ group }) => group))]
}

export const relationships = ['Madre', 'Padre', 'Tutor o tutora legal', 'Otro familiar responsable']

export { avatarColors } from './profile-options'

export const communityRules = [
  'Publica solo logros, experiencias y contenido relacionado con tus clases.',
  'No compartas teléfonos, direcciones, escuelas ni datos personales.',
  'No publiques fotos de otras personas sin su autorización.',
  'Trata con respeto a tus compañeros y maestros.',
  'Todas las publicaciones pasan por revisión antes de mostrarse.',
]

export const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
export const isPhone = (value: string) => /^[+\d\s().-]+$/.test(value) && /^\d{10,15}$/.test(value.replace(/\D/g, ''))

/** Edad cumplida a la fecha de hoy a partir de una fecha AAAA-MM-DD. */
export function ageFrom(isoDate: string, today = new Date()) {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return null
  let age = today.getFullYear() - year
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1
  return age
}

export function todayIso() {
  return new Date().toLocaleDateString('en-CA')
}

export type NameStyle = 'short' | 'initials' | 'full'

export function visibleName(firstName: string, lastName: string, style: NameStyle) {
  const first = firstName.trim().split(/\s+/)[0] ?? ''
  const lastInitial = lastName.trim()[0]?.toUpperCase()
  if (style === 'full') return `${firstName.trim()} ${lastName.trim()}`.trim()
  if (style === 'initials') return [first[0]?.toUpperCase(), lastInitial].filter(Boolean).map((letter) => `${letter}.`).join(' ')
  return lastInitial ? `${first} ${lastInitial}.` : first
}
