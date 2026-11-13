import type { GalleryItem, GalleryReview, GalleryUpload, ContactInquiry, ContactReceipt, ContactSubmission, ContactStatus, StudentNotice, CatalogGroup, CommunityControls, PublicCatalog, ActivationInvitation, GoogleState, GroupMember, LocalRequest, LocalStudent, LocalUser, OwnPost, PublicationDecision, PublicationDraft, PublishedPost, Receipt, RequestDecision, ReviewPost, StudentUser, Submission } from '../../../server/contracts'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) { super(message); this.status = status }
}

export const adminRecoveryApi = {
  request: (email: string) => call<{message:string}>('/admin-recovery/request','POST',{email}),
  reset: (token: string,password: string,confirm: string) => call('/admin-recovery/reset','POST',{token,password,confirm}),
}

export type { StudentProfile, StudentProfileDraft } from '../../../server/contracts'
export type { AdminAccount } from '../../../server/contracts'
export type { StudentRecord,StudentRecordDraft,StudentRecordSnapshot } from '../../../server/contracts'
export const studentRecordApi={
  get:(id:string)=>call<{record:import('../../../server/contracts').StudentRecord}>(`/students/${id}/record`),
  correct:(id:string,draft:import('../../../server/contracts').StudentRecordDraft,key:string)=>call(`/students/${id}/record`,'PATCH',draft,{'Idempotency-Key':key}),
}
export const adminTeamApi={
  list:()=>call<{accounts:import('../../../server/contracts').AdminAccount[]}>('/admin-team'),
  create:(name:string,email:string,currentPassword:string,key:string)=>call('/admin-team','POST',{name,email,currentPassword,confirmed:true},{'Idempotency-Key':key}),
  invite:(account:import('../../../server/contracts').AdminAccount,currentPassword:string)=>call<ActivationInvitation>(`/admin-team/${account.id}/invitation`,'POST',{revision:account.revision,currentPassword,confirmed:true}),
  status:(account:import('../../../server/contracts').AdminAccount,active:boolean,currentPassword:string)=>call(`/admin-team/${account.id}`,'PATCH',{revision:account.revision,active,currentPassword,confirmed:true}),
  activate:(token:string,password:string,confirm:string)=>call('/admin-activation','POST',{token,password,confirm}),
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

export type { ChallengeSnapshot, DailyQuestion, ChallengeBankItem, ChallengeDefinition, ChallengeSchedule, ChallengeHistory } from '../../../server/contracts'
export type ChallengeCalendar={day:string;timeZone:string;today:string;items:import('../../../server/contracts').ChallengeSchedule[];controls:{enabled:boolean;revision:number}}
export const challengesApi={
 today:()=>call<import('../../../server/contracts').ChallengeSnapshot>('/student/challenges'),
 answer:(question:{id:string;revision:number},answerIndex:number,key:string)=>call(`/student/challenges/${question.id}/answer`,'POST',{revision:question.revision,answerIndex},{'Idempotency-Key':key}),
 history:(before=0)=>call<import('../../../server/contracts').ChallengeHistory>(`/student/challenges/history?before=${before}`),
 bank:()=>call<{items:import('../../../server/contracts').ChallengeBankItem[]}>('/challenges/bank'),
 calendar:(day:string,groupId:number)=>call<ChallengeCalendar>(`/challenges/calendar?day=${encodeURIComponent(day)}&groupId=${groupId}`),
 controls:()=>call<{enabled:boolean;revision:number}>('/challenges/controls'),
 configure:(controls:{enabled:boolean;revision:number})=>call('/challenges/controls','PATCH',controls),
 saveBank:(item:import('../../../server/contracts').ChallengeBankItem|null,question:Omit<import('../../../server/contracts').ChallengeDefinition,'id'>,status:import('../../../server/contracts').ChallengeBankItem['status'],key:string)=>call<{item:import('../../../server/contracts').ChallengeBankItem}>('/challenges/bank'+(item?'/'+item.id:''),item?'PATCH':'POST',{question,status,...(item?{revision:item.revision}:{})},{'Idempotency-Key':key}),
 schedule:(item:import('../../../server/contracts').ChallengeSchedule,groupId:number,bankId:string,state:'published'|'archived')=>call<ChallengeCalendar>('/challenges/calendar','POST',{day:item.day,groupId,slot:item.slot,revision:item.revision,bankId,state}),
}
export const catalogApi = { get: () => call<PublicCatalog>('/catalog') }

export const commentsApi = {
  list:(postId:string,before=0)=>call<import('../../../server/contracts').CommentPage<import('../../../server/contracts').PublicComment>&{commentsOpen:boolean}>(`/student/posts/${postId}/comments?before=${before}`),
  mine:(postId:string,before=0)=>call<import('../../../server/contracts').CommentPage<import('../../../server/contracts').OwnComment>>(`/student/posts/${postId}/comments/mine?before=${before}`),
  create:(postId:string,body:string,key:string)=>call<{comment:import('../../../server/contracts').OwnComment}>(`/student/posts/${postId}/comments`,'POST',{body},{'Idempotency-Key':key}),
  withdraw:(comment:import('../../../server/contracts').OwnComment)=>call(`/student/comments/${comment.id}/withdraw`,'POST',{revision:comment.revision,confirmed:true}),
  counts:()=>call<{counts:import('../../../server/contracts').CommentCounts}>('/comment-counts'),
  reviews:(status:import('../../../server/contracts').CommentStatus,before=0)=>call<import('../../../server/contracts').CommentPage<import('../../../server/contracts').CommentReview>&{counts:import('../../../server/contracts').CommentCounts}>(`/comments?status=${status}&before=${before}`),
  detail:(id:string)=>call<{comment:import('../../../server/contracts').CommentReview;history:import('../../../server/contracts').CommentHistory[]}>(`/comments/${id}`),
  decide:(comment:import('../../../server/contracts').CommentReview,decision:'approve'|'reject'|'undo'|'withdraw',reason:string)=>call(`/comments/${comment.id}/${decision}`,'POST',{revision:comment.revision,reason,confirmed:true}),
  configure:(post:{id:string;revision:number},open:boolean)=>call(`/posts/${post.id}/comments`,'PATCH',{revision:post.revision,open}),
}

export const localApi = {
  configuration: () => call<{ groups: CatalogGroup[]; settings: CommunityControls }>('/configuration'),
  saveControls: (settings: CommunityControls) => call('/configuration', 'PATCH', settings),
  createGroup: (program: string, name: string) => call('/groups', 'POST', { program, name }),
  groupStatus: (group: CatalogGroup, active: boolean) => call(`/groups/${group.id}`, 'PATCH', { revision: group.revision, active }),
  assignStudent: (student: LocalStudent, program: string, group: string, confirmed: boolean) => call(`/students/${student.id}/assignment`, 'PATCH', { revision: student.revision, program, group, confirmed }),
  session: () => call<{ user: LocalUser | null }>('/auth/session'),
  login: (email: string, password: string) => call<{ user: LocalUser }>('/auth/login', 'POST', { email, password }),
  logout: () => call('/auth/logout', 'POST', {}),
  changePassword: (currentPassword: string, password: string, confirm: string) => call('/auth/password', 'POST', { currentPassword, password, confirm }),
  requests: () => call<{ requests: LocalRequest[] }>('/requests'),
  students: () => call<{ students: LocalStudent[] }>('/students'),
  submit: (submission: Submission, key: string) => call<Receipt>('/requests', 'POST', submission, { 'Idempotency-Key': key }),
  decide: (request: LocalRequest, decision: RequestDecision, reference?: string) => call(`/requests/${request.id}/${decision}`, 'POST', { revision: request.revision, reference }),
  studentStatus: (student: LocalStudent, status: 'activo' | 'suspendido') => call(`/students/${student.id}`, 'PATCH', { revision: student.revision, status }),
  invite: (student: LocalStudent) => call<ActivationInvitation>(`/students/${student.id}/invitation`, 'POST', { revision: student.revision }),
  posts: () => call<{ posts: ReviewPost[] }>('/posts'),
  moderate: (post: ReviewPost, decision: PublicationDecision, reason?: string, confirmed?: boolean) => call(`/posts/${post.id}/${decision}`, 'POST', { revision: post.revision, reason, confirmed }),
}

export const galleryApi = {
  list: () => call<{images: GalleryReview[]}>('/gallery'),
  upload: (draft: GalleryUpload, key: string) => call<{image: GalleryReview}>('/gallery','POST',draft,{'Idempotency-Key':key}),
  withdraw: (image: GalleryReview) => call(`/gallery/${image.id}/withdraw`,'POST',{revision:image.revision,confirmed:true}),
}

export const contactApi = {
  submit: (submission: ContactSubmission, key: string) => call<ContactReceipt>('/contact', 'POST', submission, {'Idempotency-Key':key}),
  list: () => call<{ contacts: ContactInquiry[] }>('/contacts'),
  update: (contact: ContactInquiry, status: ContactStatus, note: string) => call(`/contacts/${contact.id}`, 'PATCH', {revision:contact.revision,status,note}),
}

export const studentApi = {
  react: (postId: string, reaction: import('../../../server/contracts').ReactionKind | null, revision: number, key: string) => call(`/student/posts/${postId}/reaction`, 'PATCH', { reaction, revision }, { 'Idempotency-Key': key }),
  profile: () => call<{ profile: import('../../../server/contracts').StudentProfile }>('/student/profile'),
  updateProfile: (draft: import('../../../server/contracts').StudentProfileDraft) => call<{ profile: import('../../../server/contracts').StudentProfile }>('/student/profile', 'PATCH', draft),
  gallery: () => call<{images: GalleryItem[]}>('/student/gallery'),
  notices: () => call<{ notices: StudentNotice[] }>('/student/notices'),
  seen: (id: number) => call(`/student/notices/${id}/seen`, 'POST', {}),
  requestRecovery: (email: string) => call<{message: string}>('/recovery/request', 'POST', { email }),
  resetPassword: (token: string, password: string, confirm: string) => call('/recovery/reset', 'POST', { token, password, confirm }),
  activate: (token: string, password: string, confirm: string) => call('/activation', 'POST', { token, password, confirm }),
  session: () => call<{ user: StudentUser | null }>('/student/session'),
  login: (email: string, password: string) => call<{ user: StudentUser }>('/student/login', 'POST', { email, password }),
  logout: () => call('/student/logout', 'POST', {}),
  me: () => call<{ user: StudentUser }>('/student/me'),
  group: () => call<{ members: GroupMember[] }>('/student/group'),
  posts: () => call<{ posts: PublishedPost[]; mine: OwnPost[] }>('/student/posts'),
  createPost: (draft: PublicationDraft, key: string) => call<{ post: OwnPost }>('/student/posts', 'POST', draft, { 'Idempotency-Key': key }),
  withdrawPost: (post: OwnPost) => call(`/student/posts/${post.id}/withdraw`, 'POST', { revision: post.revision }),
}

export type LocalNotice = { id: number; subject: string; message: string; kind: string; recipient: string; createdAt: string; acknowledged: number }
export const noticeApi = {
  list: () => call<{notices: LocalNotice[]}>('/notices'),
  acknowledge: (id: number) => call(`/notices/${id}/acknowledge`, 'POST', {}),
  preview: (id: number) => call<ActivationInvitation>(`/notices/${id}/preview`, 'POST', {}),
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

export type { GalleryItem, GalleryReview, GalleryUpload, ContactInquiry, ContactReceipt, ContactSubmission, ContactStatus, StudentNotice, CatalogGroup, CommunityControls, PublicCatalog, ActivationInvitation, GroupMember, LocalRequest, LocalStudent, LocalUser, OwnPost, PublicationDecision, PublicationDraft, PublishedPost, RequestDecision, ReviewPost, StudentUser, Submission }
