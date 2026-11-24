import { MemberLink } from './MemberLink'
import { useCommunity } from '../context'
import { members } from '../data/members'
import s from '../community.module.css'
import { Avatar, CommunityIcon } from './ui'

export function MemberDirectory() {
  const { state, connection } = useCommunity()
  const points = Object.values(state.attempts).reduce((sum, attempt) => sum + attempt.points, 0)
  if (connection) return <section className={s.directory} aria-label="Miembros de la comunidad">{connection.members.map(member => <article className={s.memberCard} key={member.id}><MemberLink member={member} avatar/><div><h2><MemberLink member={member}/></h2><span>Alumno de CAI</span></div>{member.joinedAt&&<small>Se incorporó el <time dateTime={member.joinedAt}>{new Intl.DateTimeFormat('es-MX',{day:'numeric',month:'short',year:'numeric',timeZone:'America/Mexico_City'}).format(new Date(member.joinedAt))}</time></small>}</article>)}{!connection.members.length&&<p>Los alumnos aprobados aparecerán aquí.</p>}</section>
  return (
    <section className={s.directory} aria-label="Perfiles ficticios de la comunidad">
      {members.map((member) => <article className={s.memberCard} key={member.id}>
        <Avatar member={member} /><div><h2>{member.alias}</h2><span>{member.institution ? 'Equipo institucional de muestra' : 'Alias ficticio · Alumno demo'}</span></div><p>{member.bio}</p><span className={s.memberBadge}><CommunityIcon name="award" size={15} />{member.id === 'alex' && Object.keys(state.attempts).length >= 3 ? 'Constancia que inspira' : member.badge}</span><small>Se unió en el escenario: {new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: 'America/Mexico_City' }).format(new Date(`${member.joinedAt}T12:00:00-06:00`))}</small>{member.id === 'alex' && <small>{points} puntos ficticios en tus retos de demostración.</small>}
      </article>)}
    </section>
  )
}
