import type { BadgeSnapshot, ChallengeSnapshot, CommentPage, DailyQuestion, GroupMember, LearningAchievement, LearningDraft, LearningPage, OwnComment, PublicComment, PublishedPost, ReviewPost, StudentNotice, StudentProfile, StudentUser } from '../../../server/contracts'
import type { ChallengeCalendar } from '../local-access/api'
import { value, nextId, type PresentationStore } from './store'

export const user = (store: PresentationStore) => value<{ user: StudentUser }>(store, '/student/me').user
export const reviews = (store: PresentationStore) => value<{ posts: ReviewPost[] }>(store, '/posts').posts
const emptyReactions = () => ({ love: 0, wellDone: 0, congrats: 0, amazing: 0, funny: 0 })
const now = () => new Date().toISOString()
export function feed(store: PresentationStore): PublishedPost[] {
  const original = value<{ posts: PublishedPost[] }>(store, '/student/posts').posts
  return reviews(store).filter(post => post.status === 'publicada').map(post => ({ ...post,
    engagement: original.find(item => item.id === post.id)?.engagement ?? post.engagement ?? { counts: emptyReactions(), myReaction: null, revision: 0 },
    commentCount: value<CommentPage<PublicComment>>(store, `/student/posts/${post.id}/comments`).items.length,
  })).sort((a, b) => Date.parse(b.publishedAt ?? b.createdAt) - Date.parse(a.publishedAt ?? a.createdAt))
}
export function addNotice(store: PresentationStore, subject: string, message: string, important = false) {
  value<{ notices: StudentNotice[] }>(store, '/student/notices').notices.unshift({ id: ++store.sequence, subject, message, kind: important ? 'publication' : 'information', important, read: false, createdAt: now() })
}
export function addPost(store: PresentationStore, title: string, body: string, category: 'achievement' | 'experience', approved = false) {
  const me = user(store), id = nextId(store, 'PUB')
  const post: ReviewPost = { id, title, body, category, author: { id: me.publicId, displayName: me.displayName, avatarColor: me.avatarColor }, createdAt: now(), publishedAt: approved ? now() : null,
    status: approved ? 'publicada' : 'pendiente', revision: 1, reason: null, studentId: me.id, studentName: me.name, program: me.program, group: '', authorActive: true, authorIsMinor: false, commentsOpen: true, audience: 'community' }
  reviews(store).unshift(post)
  store.data[`/student/posts/${id}/comments`] = { items: [], nextCursor: null, commentsOpen: true }
  store.data[`/student/posts/${id}/comments/mine`] = { items: [], nextCursor: null }
  return post
}
function grant(store: PresentationStore, badgeId: string) {
  const badges = value<BadgeSnapshot>(store, '/student/badges')
  const badge = badges.catalog.find(item => item.id === badgeId)
  if (!badge || badges.grants.some(item => item.badge.id === badgeId)) return
  badge.progress = badge.target
  badges.grants.unshift({ id: nextId(store, 'BDG'), badge, source: 'automatic', condition: badge.description, awardedAt: now(), status: 'active', revision: 1, reason: null })
  addNotice(store, 'Una insignia que ya es tuya', `Conseguiste ${badge.title}. ¡Cada paso cuenta!`)
}
export function communityGet(store: PresentationStore, path: string): unknown | undefined {
  const me = user(store)
  if (path === '/student/posts') return { demonstration: true, posts: feed(store), mine: reviews(store).filter(post => post.author.id === me.publicId) }
  const member = path.match(/^\/student\/members\/(.+)$/)
  if (member) {
    const id = decodeURIComponent(member[1]!), members = value<{ members: GroupMember[] }>(store, '/student/group').members
    const profile = id === me.publicId ? { id, displayName: me.displayName, avatarColor: me.avatarColor } : members.find(item => item.id === id)
    const saved = store.data[path] as { badges?: unknown[] } | undefined
    return { member: profile ?? { id, displayName: 'Equipo CAI', avatarColor: '#1f56d6' }, posts: feed(store).filter(post => post.author.id === id), nextCursor: null,
      badges: id === me.publicId ? value<BadgeSnapshot>(store, '/student/badges').grants.filter(g => g.status === 'active') : saved?.badges ?? [] }
  }
  return undefined
}
export function communityWrite(store: PresentationStore, path: string, method: string, body: Record<string, unknown>): unknown | undefined {
  const me = user(store), notices = value<{ notices: StudentNotice[] }>(store, '/student/notices')
  const notice = path.match(/^\/student\/notices\/(\d+)\/seen$/)
  if (notice) { const item = notices.notices.find(n => n.id === Number(notice[1])); if (item) item.read = true; return {} }
  if (path === '/student/notices/archive-viewed' || path === '/student/notices/dismiss-history') {
    const ids = body.ids as number[]
    if (path.endsWith('dismiss-history')) notices.notices = notices.notices.filter(item => !item.read || !ids.includes(item.id))
    else for (const item of notices.notices) if (!item.important && ids.includes(item.id)) item.read = true
    return {}
  }
  if (path === '/student/profile') {
    const profile = value<{ profile: StudentProfile }>(store, path).profile
    profile.displayName = String(body.displayName).trim(); profile.avatarColor = String(body.avatarColor); profile.revision++
    me.displayName = profile.displayName; me.avatarColor = profile.avatarColor
    for (const post of reviews(store)) if (post.author.id === me.publicId) post.author = { ...post.author, ...profile }
    return { profile }
  }
  const answer = path.match(/^\/student\/challenges\/(.+)\/answer$/)
  if (answer) {
    const snapshot = value<ChallengeSnapshot>(store, '/student/challenges'), question = snapshot.items.find(item => item.id === answer[1])
    const definition = value<ChallengeCalendar>(store, '/challenges/calendar').items.find(item => item.id === answer[1])?.question
    if (!question || !definition) throw Error('Actualiza las actividades de la muestra.')
    if (question.attempt) return {}
    const index = Number(body.answerIndex)
    if (!Number.isInteger(index) || index < 0 || index >= question.options.length) throw Error('Elige una respuesta.')
    const correct = index === definition.correctIndex, points = correct ? 15 : 5
    question.attempt = { answerIndex: index, correct, points, correctIndex: definition.correctIndex, explanation: definition.explanation, example: definition.example, createdAt: now() }
    const progress = snapshot.progress
    progress.points += points; progress.answered++; progress.correct += correct ? 1 : 0; progress.todayAnswered++
    if (progress.todayAnswered === 1) progress.participatedDays++
    value<{ items: DailyQuestion[] }>(store, '/student/challenges/history').items.unshift(structuredClone(question))
    grant(store, 'first-answer')
    if (progress.todayAnswered === 3) {
      progress.completedDays++; progress.currentStreak++; progress.longestStreak = Math.max(progress.longestStreak, progress.currentStreak)
      if (progress.currentStreak >= 3) grant(store, 'three-consecutive')
    }
    return { result: question.attempt }
  }
  const reaction = path.match(/^\/student\/posts\/(.+)\/reaction$/)
  if (reaction) {
    const post = feed(store).find(item => item.id === reaction[1])
    if (!post) throw Error('La publicación ya no está disponible en la muestra.')
    const engagement = post.engagement!, selected = body.reaction as keyof typeof engagement.counts | null
    if (selected !== null && !(selected in engagement.counts)) throw Error('Elige una reacción válida.')
    if (engagement.myReaction) engagement.counts[engagement.myReaction] = Math.max(0, engagement.counts[engagement.myReaction] - 1)
    if (selected) engagement.counts[selected]++
    engagement.myReaction = selected; engagement.revision++
    const old = value<{ posts: PublishedPost[] }>(store, '/student/posts').posts.find(item => item.id === post.id)
    if (old) old.engagement = engagement
    else reviews(store).find(item => item.id === post.id)!.engagement = engagement
    return { engagement }
  }
  const comment = path.match(/^\/student\/posts\/(.+)\/comments$/)
  if (comment) {
    const text = String(body.body ?? '').trim()
    if (!text || text.length > 400) throw Error('Escribe un comentario de hasta 400 caracteres.')
    const item: OwnComment = { id: nextId(store, 'COM'), body: text, author: { id: me.publicId, displayName: me.displayName, avatarColor: me.avatarColor }, createdAt: now(), ownRevision: 1, revision: 1, reason: null, status: 'publicado' }
    value<CommentPage<PublicComment>>(store, path).items.push(item)
    value<CommentPage<OwnComment>>(store, path + '/mine').items.unshift(item)
    return { comment: item }
  }
  const removeComment = path.match(/^\/student\/comments\/(.+)\/withdraw$/)
  if (removeComment) {
    for (const [key, data] of Object.entries(store.data)) if (/^\/student\/posts\/.+\/comments$/.test(key)) {
      const page = data as CommentPage<PublicComment>; page.items = page.items.filter(item => item.id !== removeComment[1] || item.author.id !== me.publicId)
    }
    for (const [key, data] of Object.entries(store.data)) if (key.endsWith('/comments/mine')) for (const item of (data as CommentPage<OwnComment>).items) if (item.id === removeComment[1]) { item.status = 'retirado'; item.revision++ }
    return {}
  }
  if (path === '/student/posts') return { post: addPost(store, String(body.title), String(body.body), body.category === 'achievement' ? 'achievement' : 'experience') }
  const withdraw = path.match(/^\/student\/posts\/(.+)\/withdraw$/)
  if (withdraw) { const post = reviews(store).find(item => item.id === withdraw[1] && item.author.id === me.publicId); if (post) { post.status = 'retirada'; post.revision++ } return {} }
  const learning = path.match(/^\/student\/achievements(?:\/(\d+))?(?:\/(submit|cancel))?$/)
  if (learning) {
    const page = value<LearningPage>(store, '/student/achievements'), id = Number(learning[1]), item = page.items.find(item => item.id === id)
    if (learning[2]) {
      if (!item) throw Error('No encontramos ese logro de muestra.')
      item.review = learning[2] === 'cancel' ? 'none' : 'pending'; item.revision++
      if (learning[2] === 'submit' && body.share) {
        const post = addPost(store, item.title, item.practice + (item.expression ? '\n\nExpresiones: ' + item.expression : ''), 'achievement')
        post.learningId = item.id
        post.photos = item.images.map(image => ({ ...image, title: item.title, description: item.practice, alt: item.title, byteSize: 0, category: 'achievements', createdAt: now() }))
        item.publication = { id: post.id, status: post.status, revision: post.revision }
      }
      return { item }
    }
    const draft = body as unknown as LearningDraft
    if (!draft.title.trim() || (draft.state === 'completed' && !draft.practice.trim())) throw Error('Completa el nombre y lo que aprendiste.')
    const images = draft.images.map(image => 'data' in image ? { id: nextId(store, 'IMG'), imagePath: image.data.startsWith('data:') ? image.data : 'data:image/jpeg;base64,' + image.data, width: 800, height: 600 } : item?.images.find(old => old.id === image.id)).filter((image): image is NonNullable<typeof image> => Boolean(image))
    const next: LearningAchievement = { ...draft, images, id: id || ++store.sequence, revision: (item?.revision ?? 0) + 1, review: item?.review ?? 'none', reason: item?.reason ?? null, createdAt: item?.createdAt ?? now(), validatedAt: item?.validatedAt ?? null, publication: item?.publication ?? null }
    if (method === 'PATCH' && item) page.items[page.items.indexOf(item)] = next
    else page.items.unshift(next)
    return { item: next }
  }
  return undefined
}
