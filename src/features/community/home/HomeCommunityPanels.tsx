import { useState } from 'react'
import { useCommunity } from '../context'
import { useCommunityDialogs } from '../dialogContext'
import { challenges } from '../data/fixtures'
import { getMember, members } from '../data/members'
import { MemberLink } from '../components/MemberLink'
import { CommunityIcon } from '../components/ui'
import { MotionButton } from '../components/CommunityMotion'
import s from './home.module.css'

export function HomeChallengePreview() {
  const { state, dispatch, connection } = useCommunity()
  if (connection) {
    const data=connection.challenges,done=data.progress.todayAnswered===3,question=data.items.find(q=>!q.attempt)??data.items[0]
    return <section className={s.challengePreview} aria-labelledby="home-challenge-title"><span className={s.moduleEyebrow}>TUS TRES PREGUNTAS DE HOY <CommunityIcon name="spark" size={22}/></span><h2 id="home-challenge-title">{done?'¡Buen trabajo!':'Un intento.'}<br/>{done?'Mañana hay más.':'Algo nuevo.'}</h2><span className={s.challengeIntro}>{data.progress.todayAnswered}/3 respondidas · {data.day}</span><p className={s.challengeQuestion}>{data.needsGroup?'Coordinación debe asignarte un grupo para empezar.':!data.enabled?'Los retos están pausados. Puedes repasar lo que aprendiste.':done?'Ya practicaste gramática, vocabulario y vida cotidiana.':question?.question??'Pronto habrá más preguntas para practicar.'}</p><MotionButton type="button" className={s.yellowButton} onClick={()=>dispatch({type:'section',section:'challenges'})}>{done||!data.enabled?'Revisar mis respuestas':'Practicar hoy'} <CommunityIcon name="arrow" size={18}/></MotionButton><small>+5 por participar · +10 por acertar · Sin tiempo límite</small></section>
  }
  const challenge = challenges.find((item) => item.id === state.challengeId) ?? challenges[0]!
  const attempt = state.attempts[challenge.id]

  return <section className={s.challengePreview} aria-labelledby="home-challenge-title"><span className={s.moduleEyebrow}>RETO DEL DÍA <CommunityIcon name="spark" size={22} /></span><h2 id="home-challenge-title">Un intento.<br />Algo nuevo.</h2><span className={s.challengeIntro}>{challenge.day} · Responde esta pregunta en Retos.</span><p className={s.challengeQuestion}>{challenge.question}</p><ul className={s.previewOptions} aria-label="Opciones disponibles en Retos">{challenge.options.map((option, index) => <li key={option} className={attempt?.answerIndex === index ? s.attemptedOption : ''}><span aria-hidden="true">{String.fromCharCode(65 + index)}</span>{option}{attempt?.answerIndex === index && <span className={s.srOnly}> · Tu respuesta</span>}</li>)}</ul><MotionButton type="button" className={s.yellowButton} onClick={() => dispatch({ type: 'section', section: 'challenges' })}>{attempt ? 'Ver mi resultado' : 'Jugar reto de hoy'} <CommunityIcon name="arrow" size={18} /></MotionButton><small>{attempt ? `Reto completado · +${attempt.points} puntos ficticios` : '+5 por participar · +10 por acertar · Sin tiempo límite'}</small></section>
}

export function HomeWelcome() {
  const { connection } = useCommunity()
  const newcomers = (connection?.members ?? members).filter((member) => !member.institution && member.id !== 'alex').slice().sort((a, b) => b.joinedAt.localeCompare(a.joinedAt)).slice(0, 3)
  return <section className={s.welcome} aria-labelledby="home-welcome-title"><span className={s.moduleEyebrow}>SIEMPRE CABE UN HELLO <CommunityIcon name="users" size={20} /></span><h2 id="home-welcome-title">Qué gusto<br />tenerles aquí<span aria-hidden="true">.</span></h2><p>Nuevas caras, nuevas historias. Dales la bienvenida.</p><div className={s.welcomeAvatars}>{newcomers.map((member) => <div key={member.id}><MemberLink member={member} avatar /><strong><MemberLink member={member} /></strong><small>{connection ? 'Miembro de tu grupo' : 'Perfil ficticio'}</small></div>)}</div></section>
}

export function HomeRecognition() {
  const { state, connection } = useCommunity()
  const { setDetail } = useCommunityDialogs()
  const [weekStart] = useState(() => new Date(Date.now() - 7 * 86400000).toISOString())
  const weekly = state.posts.filter((post) => post.status === 'approved' && post.category === 'achievement' && post.createdAt >= (connection ? weekStart : '2026-10-12')).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  if (!weekly) return null
  const author = connection ? connection.resolveMember(weekly.authorId) : getMember(weekly.authorId)
  return <section className={s.recognition} aria-labelledby="home-recognition-title"><span className={s.moduleEyebrow}>LOGROS DE LA SEMANA <CommunityIcon name="award" size={20} /></span><div className={s.recognitionStamp} aria-hidden="true"><CommunityIcon name="award" size={42} /></div><h2 id="home-recognition-title">Un aplauso para<br /><MemberLink member={author} /></h2><p>{weekly.milestone?.label ?? weekly.title}. Un avance que nos recuerda por qué cada intento cuenta.</p><MotionButton type="button" className={s.navyButton} onClick={() => setDetail({ postId: weekly.id, comments: false })}>Ver su historia <CommunityIcon name="arrow" size={16} /></MotionButton><small>{connection ? 'Logro compartido con tu grupo' : 'Reconocimiento ficticio · Sin rankings'}</small></section>
}
