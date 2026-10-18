import { useCommunity } from '../context'
import { useCommunityDialogs } from '../dialogContext'
import { challenges } from '../data/fixtures'
import { getMember, members } from '../data/members'
import { MemberLink } from '../components/MemberLink'
import { CommunityIcon } from '../components/ui'
import s from './home.module.css'

export function HomeChallengePreview() {
  const { state, dispatch } = useCommunity()
  const challenge = challenges.find((item) => item.id === state.challengeId) ?? challenges[0]!
  const attempt = state.attempts[challenge.id]
  return <section className={s.challengePreview} aria-labelledby="home-challenge-title"><span className={s.moduleEyebrow}>RETO DEL DÍA <CommunityIcon name="spark" size={17} /></span><h2 id="home-challenge-title">¿Te animas a intentarlo?</h2><p className={s.challengeQuestion}>{challenge.question}</p><ul className={s.previewOptions} aria-label="Opciones disponibles en Retos">{challenge.options.map((option, index) => <li key={option} className={attempt?.answerIndex === index ? s.attemptedOption : ''}><span aria-hidden="true">{String.fromCharCode(65 + index)}</span>{option}{attempt?.answerIndex === index && <span className={s.srOnly}> · Tu respuesta</span>}</li>)}</ul><button type="button" className={s.yellowButton} onClick={() => dispatch({ type: 'section', section: 'challenges' })}>{attempt ? 'Ver mi resultado' : 'Jugar reto de hoy'} <CommunityIcon name="arrow" size={16} /></button><small>{attempt ? `Reto completado · +${attempt.points} puntos ficticios` : '+5 por participar · +10 por acertar · Sin tiempo límite'}</small></section>
}

export function HomeWelcome() {
  const newcomers = members.filter((member) => !member.institution && member.id !== 'alex').slice().sort((a, b) => b.joinedAt.localeCompare(a.joinedAt)).slice(0, 3)
  return <section className={s.welcome} aria-labelledby="home-welcome-title"><h2 id="home-welcome-title">Bienvenidos a CAI <span aria-hidden="true">👋</span></h2><p>Nuevas caras, nuevas historias. ¡Qué gusto tenerles aquí!</p><div className={s.welcomeAvatars}>{newcomers.map((member) => <div key={member.id}><MemberLink member={member} avatar /><strong><MemberLink member={member} /></strong><small>Perfil ficticio</small></div>)}</div></section>
}

export function HomeRecognition() {
  const { state } = useCommunity()
  const { setDetail } = useCommunityDialogs()
  const weekly = state.posts.filter((post) => post.status === 'approved' && post.category === 'achievement' && post.createdAt >= '2026-10-12').sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  if (!weekly) return null
  const author = getMember(weekly.authorId)
  return <section className={s.recognition} aria-labelledby="home-recognition-title"><span className={s.moduleEyebrow}>LOGROS DE LA SEMANA <CommunityIcon name="award" size={18} /></span><h2 id="home-recognition-title">Un aplauso para<br /><MemberLink member={author} /> <span aria-hidden="true">👏</span></h2><p>{weekly.milestone?.label ?? weekly.title}. Un avance que nos recuerda por qué cada intento cuenta.</p><button type="button" className={s.navyButton} onClick={() => setDetail({ postId: weekly.id, comments: false })}>Ver su historia <CommunityIcon name="arrow" size={16} /></button><small>Reconocimiento ficticio · Sin rankings</small></section>
}
