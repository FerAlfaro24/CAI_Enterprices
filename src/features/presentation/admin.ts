import type { CatalogGroup, ContactInquiry, GalleryReview, InstitutionalDraft, LearningPage, LocalRequest, LocalStudent, StudentRestriction } from '../../../server/contracts'
import { addNotice, addPost, reviews, user } from './community'
import { nextId, practiceDay, value, type PresentationStore } from './store'

export function adminWrite(store: PresentationStore, path: string, method: string, body: Record<string, unknown>): unknown | undefined {
  const requests = value<{ requests: LocalRequest[] }>(store, '/requests').requests
  const students = value<{ students: LocalStudent[] }>(store, '/students').students
  if (path === '/requests') {
    const id = nextId(store, 'CAI'), time = practiceDay()
    requests.unshift({ id, name: `${body.firstName} ${body.lastName}`, program: String(body.className), ageGroup: 'adulto', source: 'Formulario web', signInMethod: 'password', submittedAt: time,
      message: String(body.message ?? ''), status: 'pendiente', revision: 1, applicant: { filledBy: 'alumno', email: String(body.email), age: 25, group: '', studentCode: id, displayName: String(body.displayName), avatarColor: String(body.avatarColor), visibility: 'comunidad' } })
    return { id, submittedAt: time, status: 'pendiente' }
  }
  const decision = path.match(/^\/requests\/(.+)\/(approve|reject|undo|consent)$/)
  if (decision) {
    const request = requests.find(item => item.id === decision[1])
    if (!request) throw Error('Solicitud de muestra no disponible.')
    request.status = decision[2] === 'approve' ? 'aprobada' : decision[2] === 'reject' ? 'rechazada' : 'pendiente'; request.revision++
    if (request.status === 'aprobada' && !students.some(item => item.id === request.id)) students.unshift({ id: request.id, name: request.name, program: request.program, group: '', ageGroup: request.ageGroup, joinedAt: practiceDay(), visibility: 'comunidad', status: 'activo', revision: 1, accountStatus: 'pendiente' })
    return { emailQueued: false }
  }
  const student = path.match(/^\/students\/(.+?)(?:\/(invitation|access-email|assignment|record))?$/)
  if (student) {
    const item = students.find(item => item.id === student[1])
    if (student[2] === 'invitation') return { path: '/activar?token=presentation-only', expiresAt: new Date(Date.now() + 86400000).toISOString() }
    if (student[2] === 'access-email') return { enabled: false, delivery: null }
    if (item && !student[2]) { item.status = body.status === 'suspendido' ? 'suspendido' : 'activo'; item.revision++ }
    if (item && student[2] === 'assignment') { item.program = String(body.program); item.group = String(body.group); item.revision++ }
    if (student[2] === 'record') throw Error('La edición de expedientes no se simula en esta presentación. Usa únicamente datos ficticios.')
    return {}
  }
  const moderate = path.match(/^\/posts\/(.+)\/(approve|reject|undo|withdraw)$/)
  if (moderate) {
    const post = reviews(store).find(item => item.id === moderate[1])
    if (post) {
      post.status = ({ approve: 'publicada', reject: 'rechazada', undo: 'pendiente', withdraw: 'retirada' } as const)[moderate[2] as 'approve']; post.revision++
      post.reason = String(body.reason ?? '') || null
      if (post.status === 'publicada') post.publishedAt = new Date().toISOString()
      if (post.author.id === user(store).publicId) addNotice(store, 'Tu publicación tiene novedades', `La publicación «${post.title}» ahora está ${post.status}.`, true)
      const achievement = value<LearningPage>(store, '/student/achievements').items.find(item => item.publication?.id === post.id)
      if (achievement?.publication) achievement.publication = { id: post.id, status: post.status, revision: post.revision }
    }
    return {}
  }
  if (path === '/contact') {
    const id = nextId(store, 'CONTACT'), createdAt = new Date().toISOString()
    value<{ contacts: ContactInquiry[] }>(store, '/contacts').contacts.unshift({ id, name: String(body.name), contact: String(body.contact), program: String(body.program), consent: true, status: 'nueva', note: '', revision: 1, createdAt, updatedAt: createdAt })
    return { id, createdAt }
  }
  const contact = path.match(/^\/contacts\/(.+)$/)
  if (contact) { const item = value<{ contacts: ContactInquiry[] }>(store, '/contacts').contacts.find(item => item.id === contact[1]); if (item) Object.assign(item, { status: body.status, note: body.note, revision: item.revision + 1 }); return {} }
  const gallery = value<{ images: GalleryReview[] }>(store, '/gallery').images
  if (path === '/gallery') {
    const image: GalleryReview = { id: nextId(store, 'IMG'), title: String(body.title), description: String(body.description), category: 'activities', alt: String(body.alt), audience: 'community', program: '', group: '', authorizationReference: 'Imagen ficticia de esta presentación.', status: body.draft ? 'borrador' : 'publicada', revision: 1, width: 800, height: 600, byteSize: String(body.imageBase64).length, createdAt: new Date().toISOString(), imagePath: `data:image/${String(body.imageBase64).startsWith('iVBOR') ? 'png' : 'jpeg'};base64,${body.imageBase64}` }
    gallery.unshift(image); return { image }
  }
  if (path === '/gallery/official/import') throw Error('La muestra usa solo fotografías de la página pública. Las fotos privadas de alumnos se conservan en la versión conectada.')
  const removeImage = path.match(/^\/gallery\/(.+)\/withdraw$/)
  if (removeImage) { const image = gallery.find(item => item.id === removeImage[1]); if (image) { image.status = 'retirada'; image.revision++ } return {} }
  if (path === '/institutional-posts') {
    const draft = body as unknown as InstitutionalDraft
    const post = addPost(store, draft.title, draft.body, 'experience', true)
    Object.assign(post, { institutional: true, kind: draft.kind, audience: 'community', author: { id: 'cai-team', displayName: 'Equipo CAI', avatarColor: '#1f56d6' }, studentName: 'Equipo CAI', studentId: '', showInGallery: draft.showInGallery, highlighted: draft.kind === 'notice', expiresAt: draft.expiresAt,
      photos: gallery.filter(image => draft.imageIds.includes(image.id)).map(image => { image.status = 'publicada'; image.linkedPostId = post.id; return { ...image } }) })
    if (draft.kind === 'notice') addNotice(store, 'Nuevo aviso de CAI', draft.title, true)
    return { id: Number(post.id.split('-')[1]) }
  }
  const institution = path.match(/^\/institutional-posts\/(.+)$/)
  if (institution) {
    const post = reviews(store).find(item => item.id === institution[1] || item.id === `PUB-${String(institution[1]).padStart(4, '0')}`)
    if (post) { post.revision++; post.expiresAt = body.expiresAt as string | null; if (body.withdraw) { post.status = 'retirada'; for (const image of gallery) if (image.linkedPostId === post.id) image.status = 'retirada' } }
    return {}
  }
  if (path === '/configuration') { Object.assign(value(store, path) as object, { settings: body }); return {} }
  if (path === '/groups') {
    const configuration = value<{ groups: CatalogGroup[] }>(store, '/configuration')
    configuration.groups.push({ id: ++store.sequence, program: String(body.program), name: String(body.name), active: true, revision: 1 }); return {}
  }
  const group = path.match(/^\/groups\/(\d+)$/)
  if (group) { const item = value<{ groups: CatalogGroup[] }>(store, '/configuration').groups.find(item => item.id === Number(group[1])); if (item) { item.active = body.active === true; item.revision++ } return {} }
  const learning = path.match(/^\/achievements\/(\d+)\/review$/)
  if (learning) {
    const item = value<LearningPage>(store, '/student/achievements').items.find(item => item.id === Number(learning[1]))
    if (item) { item.review = body.decision === 'approve' ? 'approved' : 'changes'; item.reason = String(body.reason ?? ''); item.revision++; if (item.review === 'approved') item.validatedAt = new Date().toISOString(); addNotice(store, 'Tu logro tiene novedades', `Revisa el resultado de «${item.title}» en Logros.`, true) }
    return {}
  }
  if (/^\/community\/students\/.+\/moderate$/.test(path)) {
    const studentId = path.split('/')[3]!, commentId = path.includes('/comments/') ? path.split('/')[5] : null
    if (body.removeComment && commentId) for (const [key, data] of Object.entries(store.data)) if (key.endsWith('/comments')) { const page = data as { items: { id: string }[] }; page.items = page.items.filter(item => item.id !== commentId) }
    if (body.suspend) value<{ items: StudentRestriction[] }>(store, '/community/restrictions').items.unshift({ id: ++store.sequence, studentId, studentName: students.find(item => item.id === studentId)?.name ?? 'Alumno de muestra', reason: String(body.reason), createdAt: new Date().toISOString(), expiresAt: body.durationDays ? new Date(Date.now() + Number(body.durationDays) * 86400000).toISOString() : null, endedAt: null, status: 'active', revision: 1 })
    return {}
  }
  const restriction = path.match(/^\/community\/restrictions\/(\d+)\/revoke$/)
  if (restriction) { const item = value<{ items: StudentRestriction[] }>(store, '/community/restrictions').items.find(item => item.id === Number(restriction[1])); if (item) { item.status = 'revoked'; item.endedAt = new Date().toISOString(); item.revision++ } return {} }
  if (path === '/challenges/controls') { Object.assign(value(store, path) as object, body); return {} }
  if (path.includes('/password') || path.startsWith('/admin-team')) throw Error('Las contraseñas y el equipo real no se modifican desde la presentación.')
  if (method === 'POST' && /\/notices\/\d+\/acknowledge$/.test(path)) return {}
  return undefined
}
