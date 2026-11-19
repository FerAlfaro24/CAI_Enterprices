import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router'
import { ApiError, catalogApi, studentApi, type GroupMember, type OwnPost, type PublishedPost, type StudentUser, type StudentNotice, type GalleryItem } from '../local-access/api'
import { CommunityContext } from './context'
import { CommunityDialogContext, type PostDetail } from './dialogContext'
import { feedPost, publicMember, type CommunityConnection } from './connection'
import type { CommunityAction, CommunityState } from './types'
import s from './community.module.css'
import type { StudentProfile } from '../local-access/api'
import { challengesApi,badgesApi,learningApi,type BadgeSnapshot, type ChallengeSnapshot } from '../local-access/api'

const emptyState: CommunityState = { posts: [], mode: 'student', section: 'home', filter: 'recent', challengeId: '', attempts: {}, badgeRequests: [], notice: '', sequence: 0, resetKey: 0, focusedPostId: null, focusRequest: 0 }
type Snapshot = { achievements:import('../../../server/contracts').LearningPage; demonstration?:boolean; badges:BadgeSnapshot;challenges:ChallengeSnapshot;profile: StudentProfile; gallery: GalleryItem[]; user: StudentUser; members: GroupMember[]; posts: PublishedPost[]; mine: OwnPost[]; notices: StudentNotice[]; submissionsOpen: boolean; reactionsOpen: boolean;commentsOpen:boolean }

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
      const badges=await badgesApi.snapshot()
      const [group, feed, catalog, notices, gallery, profile, challenges, achievements] = await Promise.all([studentApi.group(), studentApi.posts(), catalogApi.get(), studentApi.notices(), studentApi.gallery(), studentApi.profile(),challengesApi.today(),learningApi.mine()])
      if (version !== generation.current) return
      setSnapshot({ achievements,badges,challenges, profile: profile.profile, gallery: gallery.images, user, members: group.members, notices: notices.notices, ...feed, submissionsOpen: catalog.settings.submissionsOpen, reactionsOpen: catalog.settings.reactionsOpen,commentsOpen:catalog.settings.commentsOpen }); setAnonymous(false); setError('')
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
  const write = async (operation: () => Promise<unknown>, message: string, options: { refresh?: boolean } = {}) => {
    if (writing.current) return false
    writing.current = true; generation.current++; setBusy(true); setError(''); setNotice('')
    try { await operation(); setNotice(message); if (options.refresh !== false) await refresh(); return true }
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
  const publicMembers = [own, ...members, ...snapshot.posts.map(post => publicMember(post.author))]
  const connection: CommunityConnection = {
    achievements:snapshot.achievements,
    saveAchievement:(id,draft,key,revision)=>write(()=>learningApi.save(id,draft,key,revision),'Tu logro quedó guardado en privado.'),
    submitAchievement:(item,share)=>write(()=>learningApi.submit(item,share),share?'Enviado a revisión para publicar.':'Enviado a validación privada; no se publicará.'),
    cancelAchievement:item=>write(()=>learningApi.cancel(item),'Solicitud retirada; conservas tu logro.'),
    withdrawAchievement:item=>write(()=>studentApi.withdrawPost(item),'Publicación retirada; conservas tu logro y su validación.'),
    demonstration:snapshot.demonstration===true,
    badges:snapshot.badges,
    requestBadge:(badgeId,description,key)=>write(()=>badgesApi.apply(badgeId,description,key),'Solicitud guardada. CAI la revisará en privado.'),
    withdrawBadge:item=>write(()=>badgesApi.withdraw(item),'Solicitud retirada. Se conserva su historial.'),
    challenges:snapshot.challenges,
    answerChallenge:(question,index,key)=>write(()=>challengesApi.answer(question,index,key),'Tu respuesta se guardó. Revisa la explicación.'),
    handleFailure:failure,
    commentsOpen:snapshot.commentsOpen,
    reactionsOpen: snapshot.reactionsOpen,
    react: (post, reaction, key) => write(() => studentApi.react(post.id, reaction, post.reactionRevision ?? 0, key), reaction === null ? 'Quitaste tu reacción.' : 'Tu reacción se guardó.'),
    profile: snapshot.profile,
    saveProfile: draft => write(async () => {
      try {
        const { profile } = await studentApi.updateProfile(draft)
        setSnapshot(current => current ? { ...current, profile, user: { ...current.user, displayName: profile.displayName, avatarColor: profile.avatarColor } } : null)
      } catch (error) {
        if (error instanceof ApiError && (error.status === 0 || error.status >= 500)) throw new ApiError(error.status, 'No pudimos confirmar si se guardó tu perfil. Conservamos tu borrador; puedes volver a intentar o cargar el perfil actual.')
        throw error
      }
    }, 'Perfil actualizado.'),
    user, members, gallery: snapshot.gallery, notices: snapshot.notices, seen: id => write(() => studentApi.seen(id), 'Aviso marcado como leído.'), mine: snapshot.mine, submissionsOpen: snapshot.submissionsOpen, busy, error, notice, refresh,
    resolveMember: id => publicMembers.find(member => member.id === id) ?? publicMember({ id, displayName: 'Miembro no disponible', avatarColor: '#1f56d6' }),
    submit: (draft, key) => write(() => studentApi.createPost(draft, key), 'Tu publicación se guardó y está pendiente de revisión.'),
    withdraw: post => write(() => studentApi.withdrawPost(post), 'Publicación retirada. Ya no aparece en el feed.'),
    logout: async () => { await write(async () => { await studentApi.logout(); setSnapshot(null); setAnonymous(true); setProfileId(null); setDetail(null) }, 'Sesión cerrada.', { refresh: false }) },
  }
  const dispatch = (action: CommunityAction) => {
    if (action.type === 'section') setUi(state => ({ ...state, section: action.section, achievementTab:action.achievementTab??'mine', focusRequest: state.focusRequest + 1 }))
    else if (action.type === 'achievementTab') setUi(state=>({...state,achievementTab:action.tab}))
    else if (action.type === 'filter') setUi(state => ({ ...state, filter: action.filter }))
    else if (action.type === 'focusPost') setDetail({ postId: action.postId, comments: false })
    else setNotice('Esta función está pendiente de conexión.')
  }
  return <CommunityContext.Provider key={user.publicId} value={{ state: { ...ui, posts: snapshot.posts.map(feedPost), notice }, dispatch, connection }}><CommunityDialogContext.Provider value={{ profileId, setProfileId, detail, setDetail }}>{children}</CommunityDialogContext.Provider></CommunityContext.Provider>
}
