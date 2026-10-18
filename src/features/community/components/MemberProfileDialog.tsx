import { useId, useState } from 'react'
import { useCommunity } from '../context'
import { getMember } from '../data/members'
import { useCommunityDialog } from '../useCommunityDialog'
import s from '../community.module.css'
import { Avatar, CommunityIcon } from './ui'
import { selectBadgeGrants } from '../achievements/model'

export function MemberProfileDialog({ memberId, onClose }: { memberId: string; onClose: () => void }) {
  const dialog = useCommunityDialog()
  const id = useId()
  const { state } = useCommunity()
  const [activityVisible, setActivityVisible] = useState(false)
  const member = getMember(memberId)
  const own = member.id === 'alex'
  const earned = own ? selectBadgeGrants(state) : []
  const days = Object.keys(state.attempts).length
  const points = Object.values(state.attempts).reduce((total, attempt) => total + attempt.points, 0)
  const personalPosts = state.posts.filter((post) => post.authorId === member.id)
  return (
    <dialog ref={dialog} className={s.profileDialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={(event) => { event.preventDefault(); onClose() }}>
      <div className={s.dialogHeading}>
        <div><span className={s.eyebrow}>{own ? 'MI ESPACIO' : 'PERFIL'} · DEMOSTRACIÓN</span><h2 id={`${id}-title`}>{member.alias}</h2></div>
        <button className={s.iconButton} type="button" onClick={onClose} aria-label="Cerrar perfil"><CommunityIcon name="close" /></button>
      </div>
      <div className={s.profileIdentity}><Avatar member={member} /><span>Perfil {member.institution ? 'institucional' : 'de alumno'} ficticio<small>Personaje del escenario de octubre de 2026</small></span></div>
      <p id={`${id}-description`}>{member.bio}</p>
      <div className={s.profileBadge}><CommunityIcon name="award" size={18} />{own ? `${earned.length} ${earned.length === 1 ? 'insignia conseguida' : 'insignias conseguidas'}` : member.badge}</div>
      {own && <>
        <p className={s.profileProgress}>{points} puntos ficticios · {days} {days === 1 ? 'día de participación' : 'días de participación'}</p>
        <button className={s.primaryButton} type="button" aria-expanded={activityVisible} aria-controls={`${id}-activity`} onClick={() => setActivityVisible(!activityVisible)}>Ver mi participación <CommunityIcon name="arrow" size={16} /></button>
        {activityVisible && <section className={s.profileActivity} id={`${id}-activity`} aria-label="Mi participación ficticia"><h3>Mi actividad de esta visita</h3><p>{days} retos completados · {personalPosts.filter((post) => post.status === 'approved').length} publicaciones aprobadas · {personalPosts.filter((post) => post.status === 'pending').length} pendientes de revisión.</p><p>Tu participación comienza aquí; los datos se reinician al recargar. No hay un historial ni cuentas reales.</p></section>}
      </>}
    </dialog>
  )
}
