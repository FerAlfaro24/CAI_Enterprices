import { challenges, pendingPosts, photoLibrary, seedPosts } from './data/fixtures'
import { getMember } from './data/members'
import type { CommunityAction, CommunityState, Post } from './types'
import { requestBadge, reviewBadgeRequest, selectBadgeGrants } from './achievements/model'

export const DEMO_DATE = '2026-10-17T18:30:00-06:00'

export function createInitialState(): CommunityState {
  return {
    posts: structuredClone([...seedPosts, ...pendingPosts]),
    mode: 'student', section: 'home', filter: 'recent', challengeId: 'day-1',
    attempts: {}, badgeRequests: [], notice: '', sequence: 1, resetKey: 0,
    focusedPostId: null, focusRequest: 0,
  }
}

export function celebrationCount(post: Post): number {
  return Object.values(post.reactions).reduce((total, count) => total + count, 0)
}

export function selectFeed(state: CommunityState): Post[] {
  const posts = state.posts.filter((post) => {
    if (post.status !== 'approved') return false
    if (state.section === 'achievements' || state.filter === 'achievements') return post.category === 'achievement'
    if (state.section === 'gallery') return post.photos.length > 0
    if (state.filter === 'experiences') return post.category === 'experience'
    return true
  })
  return posts.sort((a, b) => {
    // Official pins remain first, including when sorting by celebrations.
    if (a.pinOrder !== null || b.pinOrder !== null) {
      return (a.pinOrder ?? Number.MAX_SAFE_INTEGER) - (b.pinOrder ?? Number.MAX_SAFE_INTEGER)
    }
    if (state.filter === 'celebrated') {
      const difference = celebrationCount(b) - celebrationCount(a)
      if (difference) return difference
    }
    return Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id)
  })
}

export function formatPostDate(value: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value))
}

const nextTime = (state: CommunityState) => new Date(Date.parse(DEMO_DATE) + state.sequence * 60_000).toISOString()

export function communityReducer(state: CommunityState, action: CommunityAction): CommunityState {
  switch (action.type) {
    case 'section':
      return { ...state, section: action.section, filter: 'recent', focusedPostId: null, focusRequest: state.focusRequest + 1 }
    case 'filter':
      return { ...state, filter: action.filter, focusedPostId: null }
    case 'mode':
      return { ...state, mode: action.mode, notice: action.mode === 'moderator' ? 'Vista de moderador demo. No existen permisos ni autenticación reales.' : 'Vista de alumno demo. Publicas y comentas como Alex Demo.' }
    case 'react': {
      const target = state.posts.find((post) => post.id === action.postId && post.status === 'approved')
      if (!target) return state
      const reactions = { ...target.reactions }
      if (target.myReaction) reactions[target.myReaction] = Math.max(0, reactions[target.myReaction] - 1)
      const selected = target.myReaction === action.reaction ? null : action.reaction
      if (selected) reactions[selected] += 1
      return {
        ...state,
        posts: state.posts.map((post) => post.id === target.id ? { ...post, reactions, myReaction: selected } : post),
        notice: selected ? 'Tu reacción ficticia se añadió a la conversación.' : 'Se retiró tu reacción ficticia.',
      }
    }
    case 'comment': {
      if (!action.body.trim() || action.body.trim().length > 400) return state
      const target = state.posts.find((post) => post.id === action.postId && post.status === 'approved')
      if (!target) return state
      const comment = { id: action.id, authorId: state.mode === 'moderator' ? 'cai' : 'alex', body: action.body.trim(), createdAt: nextTime(state) }
      return {
        ...state, sequence: state.sequence + 1,
        posts: state.posts.map((post) => post.id === target.id ? { ...post, comments: [...post.comments, comment] } : post),
        notice: 'Comentario ficticio añadido. Solo existe durante esta visita.',
      }
    }
    case 'create': {
      const title = action.title.trim()
      const body = action.body.trim()
      if (title.length < 4 || title.length > 100 || body.length < 10 || body.length > 1200) return state
      if (action.category === 'announcement' && state.mode !== 'moderator') return state
      if (action.badgeId && (state.mode !== 'student' || action.category !== 'achievement' || !selectBadgeGrants(state).some((grant) => grant.badgeId === action.badgeId))) return state
      const photos = photoLibrary.filter((photo) => action.photoIds.includes(photo.id))
      if (action.category === 'gallery' && !photos.length) return state
      const post: Post = {
        id: action.id, authorId: state.mode === 'moderator' ? 'cai' : 'alex', title, body,
        category: action.category, createdAt: nextTime(state), status: 'pending', pinOrder: null,
        layout: photos.length > 1 ? 'gallery' : photos.length === 1 ? 'single' : 'text',
        photos, reactions: { love: 0, wellDone: 0, congrats: 0, amazing: 0, funny: 0 }, myReaction: null, comments: [],
        ...(action.badgeId ? { badgeId: action.badgeId } : {}),
      }
      return {
        ...state, posts: [post, ...state.posts], sequence: state.sequence + 1,
        notice: 'Publicación ficticia enviada a revisión. Está pendiente y todavía no aparece en el feed.',
      }
    }
    case 'moderate': {
      // Demonstration guard only. It is never server authorization.
      if (state.mode !== 'moderator') return state
      const target = state.posts.find((post) => post.id === action.postId && post.status === 'pending')
      if (!target) return state
      return {
        ...state,
        posts: state.posts.map((post) => post.id === target.id ? { ...post, status: action.decision } : post),
        notice: action.decision === 'approved' ? `“${target.title}” se aprobó en la demo y ya aparece en el feed.` : `“${target.title}” se rechazó en la demo. No aparecerá en el feed.`,
      }
    }
    case 'pin': {
      if (state.mode !== 'moderator') return state
      const target = state.posts.find((post) => post.id === action.postId && post.status === 'approved' && post.category === 'announcement' && getMember(post.authorId).institution)
      if (!target) return state
      const pinned = state.posts.filter((post) => post.pinOrder !== null)
      if (target.pinOrder === null && pinned.length >= 3) return { ...state, notice: 'La demo permite fijar hasta tres avisos de CAI. Retira uno antes de añadir otro.' }
      const pinOrder = target.pinOrder === null ? Math.max(0, ...pinned.map((post) => post.pinOrder ?? 0)) + 1 : null
      return {
        ...state, posts: state.posts.map((post) => post.id === target.id ? { ...post, pinOrder } : post),
        notice: pinOrder === null ? 'Aviso retirado de los fijados.' : 'Aviso de CAI fijado al inicio del feed.',
      }
    }
    case 'requestBadge':
      return requestBadge(state, action, nextTime(state))
    case 'reviewBadge':
      return reviewBadgeRequest(state, action, nextTime(state))
    case 'challengeDay':
      return challenges.some((challenge) => challenge.id === action.id) ? { ...state, challengeId: action.id } : state
    case 'answer': {
      const challenge = challenges.find((item) => item.id === action.challengeId)
      if (!challenge || state.attempts[challenge.id] || !Number.isInteger(action.answerIndex) || action.answerIndex < 0 || action.answerIndex >= challenge.options.length) return state
      const correct = challenge.correctIndex === action.answerIndex
      const points = 5 + (correct ? 10 : 0)
      return {
        ...state, attempts: { ...state.attempts, [challenge.id]: { answerIndex: action.answerIndex, correct, points } },
        // Retos announces its focused result card; avoid a duplicate global announcement.
        notice: state.section === 'challenges' ? '' : `${correct ? '¡Respuesta correcta!' : 'Gracias por intentarlo.'} Sumaste ${points} puntos ficticios.`,
      }
    }
    case 'focusPost':
      return { ...state, section: 'home', filter: 'recent', focusedPostId: action.postId, focusRequest: state.focusRequest + 1 }
    case 'reset':
      return { ...createInitialState(), resetKey: state.resetKey + 1, notice: 'Demo reiniciada: se restauraron las publicaciones, comentarios, reacciones y retos de muestra.' }
  }
}
