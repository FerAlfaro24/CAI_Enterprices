import { useCommunity } from '../context'
import { getMember, members } from '../data/members'
import { celebrationCount } from '../model'
import s from '../community.module.css'
import { DailyChallenge } from './DailyChallenge'
import { CommunityIcon } from './ui'
import { MemberLink } from './MemberLink'

export function CommunityAside() {
  const { state, dispatch } = useCommunity()
  const newcomers = members.filter((member) => !member.institution).slice().sort((a, b) => b.joinedAt.localeCompare(a.joinedAt)).slice(0, 3)
  const celebrated = state.posts.filter((post) => post.status === 'approved').sort((a, b) => celebrationCount(b) - celebrationCount(a)).slice(0, 3)
  const weekly = state.posts.filter((post) => post.status === 'approved' && post.category === 'achievement' && post.createdAt >= '2026-10-12').slice(0, 3)
  return (
    <aside className={s.contextColumn} aria-label="Retos y reconocimientos de muestra">
      {state.section !== 'challenges' && <DailyChallenge />}
      <section className={s.sideCard}>
        <div className={s.sideHeading}><span aria-hidden="true">👋</span><h2>Bienvenidos a CAI</h2></div>
        <p className={s.sideIntro}>Nuevas voces, nuevas historias.</p>
        <div className={s.memberList}>{newcomers.map((member) => <div key={member.id}><MemberLink member={member} avatar small /><span><strong><MemberLink member={member} /></strong><small>{member.badge}</small></span><span className={s.welcomeSpark} aria-hidden="true">✦</span></div>)}</div>
      </section>
      <section className={[s.sideCard, s.weeklyCard].join(' ')}>
        <div className={s.sideHeading}><span aria-hidden="true">🏅</span><h2>Logros de la semana</h2></div>
        <p className={s.sideIntro}>Cada historia merece su momento.</p>
        {weekly.length ? weekly.map((post) => <button key={post.id} className={s.weeklyItem} type="button" onClick={() => dispatch({ type: 'focusPost', postId: post.id })}><CommunityIcon name="award" size={19} /><span><strong>{getMember(post.authorId).alias}</strong><small>{post.milestone?.label ?? post.title}</small></span><span aria-hidden="true">↗</span></button>) : <p className={s.muted}>Los próximos avances aparecerán aquí.</p>}
      </section>
      <section className={s.sideCard}>
        <div className={s.sideHeading}><span aria-hidden="true">💙</span><h2>Lo estamos celebrando</h2></div>
        <p className={s.sideIntro}>Conversaciones que nos acercan.</p>
        {celebrated.map((post) => <button key={post.id} type="button" className={s.celebratedItem} onClick={() => dispatch({ type: 'focusPost', postId: post.id })}><span>{post.title}</span><small>{celebrationCount(post)} celebraciones · {getMember(post.authorId).alias}</small></button>)}
      </section>
      <p className={s.contextFootnote}>Una comunidad de muestra.<br />Personas, cifras y conversaciones ficticias.<br />Fotografías ilustrativas de Unsplash.</p>
    </aside>
  )
}
