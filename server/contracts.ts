export type RequestStatus = 'pendiente' | 'aprobada' | 'rechazada'

export type CatalogGroup = { id: number; program: string; name: string; active: boolean; revision: number }
export type CommunityControls = { registrationOpen: boolean; submissionsOpen: boolean; revision: number }
export type PublicCatalog = { groups: Pick<CatalogGroup, 'id' | 'program' | 'name'>[]; settings: Omit<CommunityControls, 'revision'> }
export type ContactSubmission = { name: string; contact: string; program: string; consent: true }
export type ContactStatus = 'nueva' | 'seguimiento' | 'atendida'
export type ContactInquiry = ContactSubmission & { id: string; status: ContactStatus; note: string; revision: number; createdAt: string; updatedAt: string }
export type ContactReceipt = { id: string; createdAt: string }
export type StudentNotice = { id: number; subject: string; message: string; kind: string; createdAt: string; read: boolean }
export const galleryCategories = { activities: 'Actividades', achievements: 'Logros', events: 'Eventos', backstage: 'Detrás de cámaras' } as const
export const galleryLimits = { uploadBytes: 3 * 1024 * 1024, inputPixels: 12_000_000, outputSide: 1600, totalBytes: 128 * 1024 * 1024 } as const
export type GalleryItem = { id: string; title: string; description: string; category: keyof typeof galleryCategories; alt: string; width: number; height: number; byteSize: number; createdAt: string; imagePath: string }
export type GalleryReview = GalleryItem & { program: string; group: string; authorizationReference: string; revision: number; status: 'publicada' | 'retirada' }
export type GalleryUpload = { title: string; description: string; category: keyof typeof galleryCategories; alt: string; program: string; group: string; authorizationReference: string; confirmed: boolean; imageBase64: string }

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
  id: string; publicId: string; role: 'student'; name: string; displayName: string
  program: string; group: string; avatarColor: string
}
export type GroupMember = { id: string; displayName: string; avatarColor: string }
export type StudentProfile = {
  displayName: string; avatarColor: string; revision: number; nameOptions: string[] | null
}
export type StudentProfileDraft = Pick<StudentProfile, 'displayName' | 'avatarColor' | 'revision'>
export type ActivationInvitation = { path: string; expiresAt: string }
export type AdminAccount = { id:number; name:string; email:string; active:boolean; activated:boolean; revision:number }
export type StudentRecordValues = {
  firstName:string; lastName:string; birthDate:string; studentCode:string; guardian:Submission['guardian']|null
}
export type StudentRecordSnapshot = StudentRecordValues & {displayName:string;visibility:Submission['visibility'];consentReference:string|null}
export type StudentRecord = StudentRecordSnapshot & {
  id:string;revision:number;email:string;
  history:{id:number;actor:string;createdAt:string;reason:string;fields:string[];before:StudentRecordSnapshot;after:StudentRecordSnapshot}[]
}
export type StudentRecordDraft = StudentRecordValues & {revision:number;reason:string;consentReference:string;currentPassword:string;confirmed:boolean}

export type RequestDecision = 'approve' | 'reject' | 'undo' | 'consent'
export type LocalUser = { id: number; name: string; role: 'admin' }
export type Receipt = { id: string; submittedAt: string; status: 'pendiente' }

export type GoogleState =
  | { status: 'anonymous' }
  | { status: 'profile'; email: string }
  | { status: 'pending' | 'approved' | 'rejected' | 'suspended'; requestId: string }

export const publicationLimits = { titleMin: 4, titleMax: 100, bodyMin: 10, bodyMax: 1200 } as const
export const publicationCategories = { achievement: 'Logro', experience: 'Experiencia' } as const
export type PublicationDraft = { title: string; body: string; category: keyof typeof publicationCategories }
export type PublicationStatus = 'pendiente' | 'publicada' | 'rechazada' | 'retirada'
export type PublicationDecision = 'approve' | 'reject' | 'undo'
export type PublishedPost = PublicationDraft & {
  id: string; author: GroupMember; createdAt: string; publishedAt: string | null
}
export type OwnPost = PublishedPost & { status: PublicationStatus; revision: number; reason: string | null }
export type ReviewPost = OwnPost & { studentId: string; studentName: string; program: string; group: string; authorActive: boolean; authorIsMinor: boolean }
