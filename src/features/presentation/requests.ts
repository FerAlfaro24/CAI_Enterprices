import type { BadgeGrantReview, BadgeSnapshot, CatalogGroup, CommunityModerationComment, GalleryReview, GroupMember, LearningPage, LocalStudent, PublicComment, StudentRestriction } from '../../../server/contracts'
import { ApiError } from '../local-access/api'
import { communityGet, communityWrite, feed, reviews, user } from './community'
import { adminWrite } from './admin'
import { commitStore, readStore, value, type PresentationStore } from './store'
import { presentationCredentials } from './credentials'
import { presentationGoogle } from './google'

function get(store: PresentationStore, pathname: string, query: URLSearchParams): unknown {
  if (pathname === '/google/config' || pathname === '/student/google') return { enabled: false, clientId: null, linked: false }
  if (pathname === '/delivery/config' || pathname.endsWith('/access-email')) return { enabled: false, adminEnabled: false, delivery: null }
  if (pathname === '/google/session') return { status: 'anonymous' }
  if (pathname === '/auth/session') return { user: store.admin ? value<{ user: unknown }>(store, pathname).user : null }
  if (pathname === '/student/session') return { user: store.student ? user(store) : null }
  if (pathname === '/student/me' && !store.student) throw new ApiError(401, 'Entra de nuevo en la muestra como alumno.')
  if (pathname === '/catalog') {
    const config = value<{ groups: CatalogGroup[]; settings: object }>(store, '/configuration')
    return { groups: config.groups.filter(item => item.active), settings: config.settings }
  }
  if (pathname === '/institutional-posts') return { posts: reviews(store).filter(post => post.institutional) }
  if (pathname === '/posts') return { posts: reviews(store).filter(post => !post.institutional) }
  if (pathname === '/community/posts') return { items: feed(store).map(post => ({ ...post, moderation: post.institutional ? null : moderation(store, post.author) })), nextCursor: null }
  const comments = pathname.match(/^\/community\/posts\/(.+)\/comments$/)
  if (comments) {
    const items = value<{ items: PublicComment[] }>(store, `/student/posts/${comments[1]}/comments`).items
    return { items: items.map(comment => ({ ...comment, revision: comment.ownRevision ?? 1, moderation: moderation(store, comment.author) } satisfies CommunityModerationComment)), nextCursor: null }
  }
  if (pathname === '/community/restrictions') return { items: value<{ items: StudentRestriction[] }>(store, pathname).items.filter(item => query.get('view') === 'history' ? item.status !== 'active' : item.status === 'active'), nextCursor: null }
  if (pathname === '/student/gallery') {
    const posts = reviews(store), images = value<{ images: GalleryReview[] }>(store, '/gallery').images.filter(image => image.status === 'publicada' && (!image.linkedPostId || posts.some(post => post.id === image.linkedPostId && post.status === 'publicada' && post.kind !== 'notice')))
    return { images: images.map(image => { const post = posts.find(post => post.id === image.linkedPostId); return { ...image, ...(post ? { publication: { id: post.id, title: post.title, description: post.body, createdAt: post.publishedAt ?? post.createdAt } } : {}) } }) }
  }
  if (pathname === '/achievements/reviews') return { items: value<LearningPage>(store, '/student/achievements').items.filter(item => item.review === 'pending').map(item => ({ ...item, studentId: user(store).id, studentName: user(store).name })), nextCursor: null }
  if (pathname === '/badge-grants') return { items: value<BadgeSnapshot>(store, '/student/badges').grants.map(item => ({ ...item, studentId: user(store).id, studentName: user(store).name, program: user(store).program, group: '', active: true } satisfies BadgeGrantReview)), nextCursor: null }
  const grants = pathname.match(/^\/badge-grants\/(.+)$/)
  if (grants) return { grant: (get(store, '/badge-grants', query) as { items: BadgeGrantReview[] }).items.find(item => item.id === grants[1]), history: [] }
  const ownGrant = pathname.match(/^\/student\/badges\/(.+)$/)
  if (ownGrant) return { grant: value<BadgeSnapshot>(store, '/student/badges').grants.find(item => item.id === ownGrant[1]), history: [] }
  if (pathname === '/challenges/calendar') return { ...value<object>(store, pathname), ...(query.get('day') ? { day: query.get('day') } : {}) }
  const result = communityGet(store, pathname)
  return result === undefined ? value(store, pathname) : result
}
function moderation(store: PresentationStore, author: GroupMember) {
  const old = reviews(store).find(post => post.author.id === author.id), me = user(store)
  const student = value<{ students: LocalStudent[] }>(store, '/students').students.find(item => item.name.startsWith(author.displayName.split(' ')[0]!))
  const studentId = author.id === me.publicId ? me.id : old?.studentId ?? student?.id ?? 'CAI-0002'
  return { studentId, displayName: author.displayName, studentRevision: student?.revision ?? 1, restriction: value<{ items: StudentRestriction[] }>(store, '/community/restrictions').items.find(item => item.studentId === studentId && item.status === 'active') ?? null }
}

/** Datos de muestra independientes; únicamente la identificación de Google usa servidor. */
export async function presentationRequest<T>(path: string, method: string, input?: unknown): Promise<T> {
  const url = new URL(path, 'https://presentation.invalid'), state = readStore()
  if (['/google/config', '/google/challenge', '/google/signin', '/google/logout'].includes(url.pathname)) {
    const result = await presentationGoogle<T>(url.pathname.slice('/google/'.length), method, input)
    if (url.pathname === '/google/signin') { const store = structuredClone(state); store.student = true; commitStore(store) }
    return result
  }
  if (url.pathname === '/student/logout') await presentationGoogle('logout', 'POST', {})
  if (method === 'GET') return structuredClone(get(state, url.pathname, url.searchParams)) as T
  const store = structuredClone(state), body = (input ?? {}) as Record<string, unknown>
  let result: unknown
  if (url.pathname === '/auth/login' || url.pathname === '/student/login') {
    const account = presentationCredentials[url.pathname === '/auth/login' ? 'admin' : 'student']
    if (body.email !== account.email || body.password !== account.password) throw new ApiError(401, 'Usa el correo y la contraseña de la cuenta de muestra que aparecen en esta pantalla.')
    if (url.pathname === '/auth/login') { store.admin = true; result = { user: value<{ user: unknown }>(store, '/auth/session').user } }
    else { store.student = true; result = { user: user(store) } }
  } else if (url.pathname === '/auth/logout') { store.admin = false; result = {} }
  else if (url.pathname === '/student/logout') { store.student = false; result = {} }
  else if (['/recovery/request', '/admin-recovery/request'].includes(url.pathname)) result = { message: 'Esta presentación no envía correos. Usa los accesos de muestra para continuar.' }
  else if (['/activation', '/recovery/reset', '/admin-recovery/reset', '/admin-activation'].includes(url.pathname)) { store.student = true; result = {} }
  else result = communityWrite(store, url.pathname, method, body) ?? adminWrite(store, url.pathname, method, body)
  if (result === undefined) throw new ApiError(400, 'Esta acción no se simula en la presentación. No se modificó ningún servicio real.')
  commitStore(store)
  return structuredClone(result) as T
}
