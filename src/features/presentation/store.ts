import initial from './seed.json'
import { improvePresentationContent } from './content'
import aula from '../../assets/official/aula.webp'
import online from '../../assets/official/practica-online.webp'
import materiales from '../../assets/official/materiales.webp'
import actividad from '../../assets/official/actividad-aula.webp'
import type { ChallengeSnapshot, ChallengeCalendar, ChallengeBankItem } from '../local-access/api'
import type { BadgeSnapshot, CommentPage, GalleryReview, GroupMember, PublishedPost, PublicComment, ReviewPost, StudentNotice, StudentUser } from '../../../server/contracts'

const key = 'cai-presentation-v1'
const media: Record<string, string> = { '@media/aula': aula, '@media/online': online, '@media/materiales': materiales, '@media/actividad': actividad }
export type PresentationStore = { version: 1; contentRevision?: number; data: Record<string, unknown>; student: boolean; admin: boolean; sequence: number }
let current: PresentationStore | undefined

export function value<T>(store: PresentationStore, path: string): T {
  if (!(path in store.data)) throw Error('Esta acción no está incluida en la presentación. No se envió información a ningún servidor.')
  return store.data[path] as T
}

export function practiceDay(time = Date.now()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(time))
}
function midnight() {
  let low = Date.now(), high = low + 36 * 3600000
  const today = practiceDay(low)
  while (high - low > 1000) {
    const middle = Math.floor((low + high) / 2)
    if (practiceDay(middle) === today) low = middle
    else high = middle
  }
  return new Date(high).toISOString()
}
function fresh(): PresentationStore {
  const data = JSON.parse(JSON.stringify(initial), (_key, item: unknown) => typeof item === 'string' && item in media ? media[item] : item) as Record<string, unknown>
  const store: PresentationStore = { version: 1, data, student: true, admin: true, sequence: 1000 }
  // Colores distintos y fechas relativas, sin usar expedientes ni fotografías privadas.
  const colors = ['#1f56d6', '#7c3aed', '#0f766e', '#b45309', '#be185d']
  const members = value<{ members: { id: string; avatarColor: string }[] }>(store, '/student/group').members
  members.forEach((member, index) => { member.avatarColor = colors[index % colors.length]! })
  const snapshot = value<ChallengeSnapshot>(store, '/student/challenges')
  const offset = Date.now() - Date.parse(snapshot.serverTime)
  const shift = (item: unknown): unknown => {
    if (Array.isArray(item)) return item.map(shift)
    if (item && typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([name, val]) => [name,
      typeof val === 'string' && /^(createdAt|publishedAt|submittedAt|awardedAt|validatedAt|joinedAt|expiresAt)$/.test(name) && /^\d{4}-\d{2}-\d{2}T/.test(val) ? new Date(Date.parse(val) + offset).toISOString() : shift(val)]))
    return item
  }
  store.data = shift(data) as Record<string, unknown>
  const me = value<{ user: StudentUser }>(store, '/student/me').user
  const posts = value<{ posts: ReviewPost[] }>(store, '/posts').posts
  posts.push(...value<{ posts: ReviewPost[] }>(store, '/institutional-posts').posts)
  const original = value<{ posts: PublishedPost[] }>(store, '/student/posts').posts
  for (const [index, post] of posts.entries()) {
    post.audience = 'community'
    const member = members.find(member => member.id === post.author.id)
    if (member) post.author.avatarColor = member.avatarColor
    const page = store.data[`/student/posts/${post.id}/comments`] as CommentPage<PublicComment> | undefined
    if (page && page.items.length === 0 && post.status === 'publicada') {
      for (const [n, body] of ['¡Me gusta esta idea! La voy a probar esta semana.', 'Un paso pequeño cada día. ¡Gracias por compartirlo!'].entries()) {
        const author = members[(index + n) % members.length]! as GroupMember
        page.items.push({ id: `DEMO-COM-${index}-${n}`, body, author, createdAt: new Date(Date.now() - (n + 5) * 60000).toISOString() })
      }
    }
    const source = original.find(item => item.id === post.id)
    if (source?.engagement && Object.values(source.engagement.counts).every(count => count === 0)) source.engagement.counts = { love: 4 + index, wellDone: 2, congrats: 1, amazing: 2, funny: 1 }
  }
  // Contenido propio para que el perfil y la actividad también tengan ejemplos.
  const own: ReviewPost = { id: 'PUB-DEMO-OWN', title: 'Mi cuaderno de pequeñas victorias', body: 'Esta semana entendí una escena sin traducir cada palabra y terminé un cuento corto. Me ayudó anotar solo dos expresiones y volver a usarlas. Mi siguiente paso: contarlo en voz alta.', category: 'achievement', author: { id: me.publicId, displayName: me.displayName, avatarColor: me.avatarColor }, createdAt: new Date(Date.now() - 3600000).toISOString(), publishedAt: new Date(Date.now() - 3600000).toISOString(), status: 'publicada', revision: 1, reason: null, studentId: me.id, studentName: me.name, program: me.program, group: '', authorActive: true, authorIsMinor: false, commentsOpen: true }
  posts.unshift(own)
  store.data['/student/posts/PUB-DEMO-OWN/comments'] = { items: [], nextCursor: null, commentsOpen: true }
  store.data['/student/posts/PUB-DEMO-OWN/comments/mine'] = { items: [], nextCursor: null }
  const galleries = value<{ images: GalleryReview[] }>(store, '/gallery').images
  for (const [index, image] of galleries.slice(0, 4).entries()) galleries.push({ ...image, id: `DEMO-GALLERY-${index}`, title: ['Nuestro espacio para aprender', 'Práctica también desde casa', 'Materiales que nos acompañan', 'Aprender haciendo'][index]!, linkedPostId: undefined })
  const notices = value<{ notices: StudentNotice[] }>(store, '/student/notices').notices
  notices.splice(0, 3)
  notices.unshift({ id: 9001, subject: 'Tu comunidad te acompaña', message: 'Tienes nuevas conversaciones para explorar. Comparte una idea o celebra el avance de un compañero.', kind: 'information', createdAt: new Date().toISOString(), read: false, important: false })
  notices.push({ id: 9002, subject: 'Un pequeño paso cada día', message: 'Tu práctica de ayer ya está en tu cuaderno de repaso.', kind: 'information', createdAt: new Date(Date.now() - 86400000).toISOString(), read: true, important: false })
  const badges = value<BadgeSnapshot>(store, '/student/badges')
  members.forEach((member, index) => {
    const profile = store.data[`/student/members/${member.id}`] as { badges: unknown[] } | undefined
    if (profile) profile.badges = [{ id: `DEMO-BDG-${index}`, badge: badges.catalog[index % 3]!, awardedAt: new Date().toISOString() }]
  })
  value<ChallengeSnapshot>(store, '/student/challenges').day = ''
  renewPractice(store)
  improvePresentationContent(store)
  return store
}
export function renewPractice(store: PresentationStore) {
  const snapshot = value<ChallengeSnapshot>(store, '/student/challenges')
  snapshot.serverTime = new Date().toISOString()
  if (snapshot.day === practiceDay()) return
  const day = practiceDay(), bank = value<{ items: ChallengeBankItem[] }>(store, '/challenges/bank').items
  const number = Number(day.replaceAll('-', ''))
  const questions = ['grammar', 'words', 'everyday'].map((lane, slot) => {
    const choices = bank.filter(item => item.lane === lane && item.status === 'ready')
    const question = choices[(number + slot * 7) % choices.length]!
    return { id: `DEMO-${day}-${slot}`, day, slot, program: '', group: '', revision: 1, state: 'published' as const, question, source: 'automatic' as const, attempts: 0 }
  })
  store.data['/challenges/calendar'] = { day, timeZone: 'America/Mexico_City', today: day, items: questions, controls: { enabled: true, revision: 1 } } satisfies ChallengeCalendar
  snapshot.day = day; snapshot.nextRefreshAt = midnight(); snapshot.progress.todayAnswered = 0
  snapshot.items = questions.map(item => ({ ...item.question, id: item.id, day, revision: 1, slot: item.slot, attempt: null, previousGroup: false }))
}
export function readStore() {
  if (!current) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? 'null') as PresentationStore | null
      if (parsed?.version === 1 && parsed.data?.['/student/me'] && Number.isFinite(parsed.sequence)) current = parsed
    } catch { /* Una muestra local dañada puede regenerarse; nunca contiene datos reales. */ }
    current ??= fresh()
    if (improvePresentationContent(current)) commitStore(current)
  }
  renewPractice(current)
  return current
}
export function commitStore(store: PresentationStore) {
  try { localStorage.setItem(key, JSON.stringify(store)) }
  catch { throw Error('El navegador no tiene espacio para guardar la muestra. Reduce las imágenes o reinicia la presentación.') }
  current = store
}
export function resetPresentation() { localStorage.removeItem(key); current = undefined }
export const nextId = (store: PresentationStore, prefix: string) => `${prefix}-${++store.sequence}`
