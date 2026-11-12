import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router'
import { ApiError, studentApi, type GroupMember, type OwnPost, type PublishedPost, type StudentUser } from '../local-access/api'
import { CommunityContext } from './context'
import { CommunityDialogContext, type PostDetail } from './dialogContext'
import { feedPost, publicMember, type CommunityConnection } from './connection'
import type { CommunityAction, CommunityState } from './types'
import s from './community.module.css'

const emptyState: CommunityState = { posts: [], mode: 'student', section: 'home', filter: 'recent', challengeId: '', attempts: {}, badgeRequests: [], notice: '', sequence: 0, resetKey: 0, focusedPostId: null, focusRequest: 0 }
type Snapshot = { user: StudentUser; members: GroupMember[]; posts: PublishedPost[]; mine: OwnPost[] }

/** Usa las vistas de v1.0 con una instantánea autorizada, sin inicializar fixtures. */
export function ConnectedCommunity({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [checking, setChecking] = useState(true), [anonymous, setAnonymous] = useState(false)
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [busy, setBusy] = useState(false)
  const [ui, setUi] = useState(emptyState)
  const [profileId, setProfileId] = useState<string | null>(null), [detail, setDetail] = useState<PostDetail | null>(null)
  const generation = useRef(0), writing = useRef(false)
  const failure = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) {
      generation.current++; setChecking(false); setSnapshot(null); setAnonymous(true); setProfileId(null); setDetail(null)
    }
    setError(error instanceof Error ? error.message : 'No pudimos cargar tu comunidad.')
  }, [])
  const refresh = useCallback(() => {
    const version = ++generation.current
    return studentApi.me().then(async ({ user }) => {
      const [group, feed] = await Promise.all([studentApi.group(), studentApi.posts()])
      if (version !== generation.current) return
      setSnapshot({ user, members: group.members, ...feed }); setAnonymous(false); setError('')
    }).catch((error: unknown) => { if (version === generation.current) failure(error) })
      .finally(() => { if (version === generation.current) setChecking(false) })
  }, [failure])
  useEffect(() => {
    const sequence = generation
    void refresh()
    const visible = () => { if (!writing.current && document.visibilityState === 'visible') void refresh() }
    const timer = window.setInterval(visible, 15_000)
    window.addEventListener('focus', visible); document.addEventListener('visibilitychange', visible)
    return () => { sequence.current++; clearInterval(timer); window.removeEventListener('focus', visible); document.removeEventListener('visibilitychange', visible) }
  }, [refresh])
  const write = async (operation: () => Promise<unknown>, message: string) => {
    if (writing.current) return false
    writing.current = true; generation.current++; setBusy(true); setError(''); setNotice('')
    try { await operation(); setNotice(message); await refresh(); return true }
    catch (error) {
      failure(error)
      if (error instanceof ApiError && error.status === 409) { await refresh(); setError(error.message) }
      return false
    } finally { writing.current = false; setBusy(false) }
  }
  if (anonymous) return <Navigate to="/login" replace />
  if (checking) return <main className={s.workspace}><p role="status">Comprobando tu acceso…</p></main>
  if (!snapshot) return <main className={s.workspace}><h1>No pudimos actualizar tu comunidad</h1><p role="alert">{error}</p><button type="button" className={s.primaryButton} onClick={() => { void refresh() }}>Volver a intentar</button></main>
  const { user } = snapshot
  const own = publicMember({ id: user.publicId, displayName: user.displayName, avatarColor: user.avatarColor })
  const members = snapshot.members.map(publicMember)
  const publicMembers = [...members, own, ...snapshot.posts.map(post => publicMember(post.author))]
  const connection: CommunityConnection = {
    user, members, mine: snapshot.mine, busy, error, notice, refresh,
    resolveMember: id => publicMembers.find(member => member.id === id) ?? publicMember({ id, displayName: 'Miembro no disponible', avatarColor: '#1f56d6' }),
    submit: (draft, key) => write(() => studentApi.createPost(draft, key), 'Tu publicación se guardó y está pendiente de revisión.'),
    withdraw: post => write(() => studentApi.withdrawPost(post), 'Publicación retirada. Ya no aparece en el feed.'),
    logout: async () => { await write(async () => { await studentApi.logout(); setSnapshot(null); setAnonymous(true); setProfileId(null); setDetail(null) }, 'Sesión cerrada.') },
  }
  const dispatch = (action: CommunityAction) => {
    if (action.type === 'section') setUi(state => ({ ...state, section: action.section, focusRequest: state.focusRequest + 1 }))
    else if (action.type === 'filter') setUi(state => ({ ...state, filter: action.filter }))
    else if (action.type === 'focusPost') setDetail({ postId: action.postId, comments: false })
    else setNotice('Esta función está pendiente de conexión.')
  }
  return <CommunityContext.Provider key={user.publicId} value={{ state: { ...ui, posts: snapshot.posts.map(feedPost), notice }, dispatch, connection }}><CommunityDialogContext.Provider value={{ profileId, setProfileId, detail, setDetail }}>{children}</CommunityDialogContext.Provider></CommunityContext.Provider>
}
