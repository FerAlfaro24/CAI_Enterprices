export type RequestStatus = 'pendiente' | 'aprobada' | 'rechazada'

export interface Submission {
  firstName: string
  lastName: string
  birthDate: string
  email: string
  filledBy: 'alumno' | 'tutor'
  program: string
  group: string
  studentCode?: string
  displayName: string
  avatarColor: string
  visibility: 'privado' | 'comunidad'
  message: string
  guardian?: { name: string; relationship: string; contact: string }
  guardianConsent: boolean
  acceptRules: boolean
  acceptPrivacy: boolean
}

export interface LocalRequest {
  id: string
  name: string
  program: string
  ageGroup: 'menor' | 'adulto'
  guardianConsent?: 'pendiente' | 'recibida'
  source: 'Formulario web'
  signInMethod: 'google' | 'password'
  submittedAt: string
  message: string
  status: RequestStatus
  revision: number
  applicant: {
    filledBy: 'alumno' | 'tutor'
    email: string
    age: number
    group: string
    studentCode?: string
    displayName: string
    avatarColor: string
    visibility: 'privado' | 'comunidad'
    guardian?: Submission['guardian']
  }
}

export interface LocalStudent {
  id: string
  name: string
  program: string
  group: string
  ageGroup: 'menor' | 'adulto'
  guardianConsent?: 'pendiente' | 'recibida'
  joinedAt: string
  visibility: 'privado' | 'comunidad'
  status: 'activo' | 'suspendido'
  revision: number
  accountStatus: 'pendiente' | 'activada'
}

export type StudentUser = {
  id: string; role: 'student'; name: string; displayName: string
  program: string; group: string; avatarColor: string
}
export type GroupMember = { displayName: string; avatarColor: string }
export type ActivationInvitation = { path: string; expiresAt: string }

export type RequestDecision = 'approve' | 'reject' | 'undo' | 'consent'
export type LocalUser = { id: number; name: string; role: 'admin' }
export type Receipt = { id: string; submittedAt: string; status: 'pendiente' }

export type GoogleState =
  | { status: 'anonymous' }
  | { status: 'profile'; email: string }
  | { status: 'pending' | 'approved' | 'rejected' | 'suspended'; requestId: string }
