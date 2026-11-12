import { useOutletContext } from 'react-router'
import type { AdminConnection } from './useAdminConnection'
import {
  accessRequests,
  initiallySuspended,
  posts,
  students,
  type AccessRequest,
  type Post,
  type RequestStatus,
  type Student,
} from './data/mockData'

export type Settings = {
  reviewAllPosts: boolean
  allowReactions: boolean
  allowComments: boolean
  requireGuardianConsent: boolean
  minorsPrivateByDefault: boolean
  hideLastNames: boolean
  allowPhotos: boolean
}

/**
 * Estado en memoria de la demostración. Las decisiones se pierden al recargar
 * y no representan una autorización real.
 */
export type AdminState = {
  directory?: DirectoryStudent[]
  requests: AccessRequest[]
  posts: Post[]
  suspended: string[]
  settings: Settings
}

export type AdminAction =
  | { type: 'submit'; request: AccessRequest }
  | { type: 'decide'; id: string; status: Exclude<RequestStatus, 'pendiente'> }
  | { type: 'undo'; id: string }
  | { type: 'consent'; id: string }
  | { type: 'moderate'; id: string; status: 'publicada' | 'rechazada'; reason?: string }
  | { type: 'unmoderate'; id: string }
  | { type: 'suspend' | 'reactivate'; id: string }
  | { type: 'setting'; key: keyof Settings; value: boolean }
  | { type: 'reset' }

export const defaultSettings: Settings = {
  reviewAllPosts: true,
  allowReactions: true,
  allowComments: false,
  requireGuardianConsent: true,
  minorsPrivateByDefault: true,
  hideLastNames: true,
  allowPhotos: true,
}

export const initialAdminState: AdminState = {
  requests: accessRequests,
  posts,
  suspended: initiallySuspended,
  settings: defaultSettings,
}

export function adminReducer(state: AdminState, action: AdminAction): AdminState {
  switch (action.type) {
    case 'submit':
      return { ...state, requests: [action.request, ...state.requests] }
    case 'decide':
      return { ...state, requests: state.requests.map((r) => (r.id === action.id ? { ...r, status: action.status } : r)) }
    case 'undo':
      return { ...state, requests: state.requests.map((r) => (r.id === action.id ? { ...r, status: 'pendiente' } : r)) }
    case 'consent':
      return { ...state, requests: state.requests.map((r) => (r.id === action.id ? { ...r, guardianConsent: 'recibida' } : r)) }
    case 'moderate':
      return { ...state, posts: state.posts.map((p) => (p.id === action.id ? { ...p, status: action.status, rejectReason: action.reason } : p)) }
    case 'unmoderate':
      return { ...state, posts: state.posts.map((p) => (p.id === action.id ? { ...p, status: 'pendiente', rejectReason: undefined } : p)) }
    case 'suspend':
      return { ...state, suspended: [...state.suspended, action.id] }
    case 'reactivate':
      return { ...state, suspended: state.suspended.filter((id) => id !== action.id) }
    case 'setting':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } }
    case 'reset':
      return initialAdminState
  }
}

export type AdminContext = {
  connection?: AdminConnection
  state: AdminState
  dispatch: (action: AdminAction) => void
  announce: (message: string) => void
}

export function useAdmin() {
  return useOutletContext<AdminContext>()
}

export function countByStatus<S extends string>(items: { status: S }[], statuses: readonly S[]) {
  const counts = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<S, number>
  for (const item of items) counts[item.status] += 1
  return counts
}

export const requestStatuses = ['pendiente', 'aprobada', 'rechazada'] as const
export const postStatuses = ['pendiente', 'publicada', 'rechazada'] as const

export type DirectoryStudent = Student & { status: 'activo' | 'suspendido'; isNew: boolean }

/** Directorio: alumnos de muestra más las solicitudes aprobadas en la demo. */
export function buildDirectory(state: AdminState): DirectoryStudent[] {
  if (state.directory) return state.directory
  const fromRequests: Student[] = state.requests
    .filter((r) => r.status === 'aprobada')
    .map((r) => ({
      id: r.id,
      name: r.name,
      program: r.program,
      group: r.applicant?.group ?? 'Por asignar',
      ageGroup: r.ageGroup,
      guardianConsent: r.guardianConsent,
      joinedAt: r.submittedAt,
      posts: 0,
      visibility: r.applicant?.visibility ?? 'privado',
    }))
  return [...fromRequests, ...students].map((student) => ({
    ...student,
    status: state.suspended.includes(student.id) ? 'suspendido' : 'activo',
    isNew: student.id.startsWith('CAI-'),
  }))
}

/** Siguiente folio de solicitud, por ejemplo CAI-0143. */
export function nextRequestId(requests: AccessRequest[]) {
  const max = Math.max(0, ...requests.map((r) => Number(r.id.replace(/\D/g, '')) || 0))
  return `CAI-${String(max + 1).padStart(4, '0')}`
}

/** Un menor solo puede aprobarse con la autorización de su tutor registrada. */
export function canApprove(request: AccessRequest) {
  return request.ageGroup === 'adulto' || request.guardianConsent === 'recibida'
}

const dateFormat = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })

export function formatDate(isoDate: string) {
  return dateFormat.format(new Date(`${isoDate}T12:00:00`))
}

export function initials(name: string) {
  return name.split(' ').slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

/** Muestra «Nombre A.» cuando la configuración oculta apellidos. */
export function displayName(name: string, hideLastNames: boolean) {
  if (!hideLastNames) return name
  const [first, last] = name.split(' ')
  return last ? `${first} ${last[0]}.` : name
}
