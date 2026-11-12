import type { ActivationInvitation, GoogleState, GroupMember, LocalRequest, LocalStudent, LocalUser, Receipt, RequestDecision, StudentUser, Submission } from '../../../server/contracts'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

async function call<T>(path: string, method = 'GET', body?: unknown, headers?: Record<string, string>): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api/local${path}`, {
      method, credentials: 'same-origin', headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(15_000),
    })
  } catch { throw new ApiError(0, 'No pudimos conectar. Comprueba que el servicio local esté encendido y vuelve a intentarlo.') }
  let data: unknown
  try { data = await response.json() }
  catch { throw new ApiError(response.status, 'El servicio local no está disponible. Vuelve a intentarlo.') }
  if (!response.ok) throw new ApiError(response.status, (data as { error?: string }).error ?? 'No se pudo completar la operación.')
  return data as T
}

export const localApi = {
  session: () => call<{ user: LocalUser | null }>('/auth/session'),
  login: (email: string, password: string) => call<{ user: LocalUser }>('/auth/login', 'POST', { email, password }),
  logout: () => call('/auth/logout', 'POST', {}),
  requests: () => call<{ requests: LocalRequest[] }>('/requests'),
  students: () => call<{ students: LocalStudent[] }>('/students'),
  submit: (submission: Submission, key: string) => call<Receipt>('/requests', 'POST', submission, { 'Idempotency-Key': key }),
  decide: (request: LocalRequest, decision: RequestDecision, reference?: string) => call(`/requests/${request.id}/${decision}`, 'POST', { revision: request.revision, reference }),
  studentStatus: (student: LocalStudent, status: 'activo' | 'suspendido') => call(`/students/${student.id}`, 'PATCH', { revision: student.revision, status }),
  invite: (student: LocalStudent) => call<ActivationInvitation>(`/students/${student.id}/invitation`, 'POST', { revision: student.revision }),
}

export const studentApi = {
  activate: (token: string, password: string, confirm: string) => call('/activation', 'POST', { token, password, confirm }),
  session: () => call<{ user: StudentUser | null }>('/student/session'),
  login: (email: string, password: string) => call<{ user: StudentUser }>('/student/login', 'POST', { email, password }),
  logout: () => call('/student/logout', 'POST', {}),
  me: () => call<{ user: StudentUser }>('/student/me'),
  group: () => call<{ members: GroupMember[] }>('/student/group'),
}

export const googleApi = {
  config: () => call<{ enabled: boolean; clientId: string | null }>('/google/config'),
  challenge: () => call<{ clientId: string; nonce: string }>('/google/challenge', 'POST', {}),
  signIn: (credential: string) => call<{ destination: string }>('/google/signin', 'POST', { credential }),
  session: () => call<GoogleState>('/google/session'),
  submit: (submission: Submission, key: string) => call<Receipt>('/google/profile', 'POST', submission, { 'Idempotency-Key': key }),
  enter: () => call<{ destination: string }>('/google/continue', 'POST', {}),
  logout: () => call('/google/logout', 'POST', {}),
}

export type { ActivationInvitation, GroupMember, LocalRequest, LocalStudent, LocalUser, RequestDecision, StudentUser, Submission }
