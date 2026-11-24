import { SocialProfileContent } from './SocialProfileContent'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { useCommunity } from '../context'
import { getMember } from '../data/members'
import { useCommunityDialog } from '../useCommunityDialog'
import s from '../community.module.css'
import { BadgeArtwork } from '../achievements/BadgeArtwork'
import { OwnProfileForm } from './OwnProfileForm'
import { Avatar, CommunityIcon } from './ui'
import { selectBadgeGrants } from '../achievements/model'

export function MemberProfileDialog({ memberId, onClose, onOpenNotifications }: { memberId: string; onClose: () => void; onOpenNotifications?: () => void }) {
  const dialog = useCommunityDialog()
  const id = useId()
  const { state, connection, dispatch } = useCommunity()
  const [activityVisible, setActivityVisible] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [profileView,setProfileView]=useState<'activity'|'account'>('activity')
  const member = connection ? connection.resolveMember(memberId) : getMember(memberId)
  const own = member.id === 'alex'
  const earned = own ? selectBadgeGrants(state) : []
  const days = Object.keys(state.attempts).length
  const points = Object.values(state.attempts).reduce((total, attempt) => total + attempt.points, 0)
  const personalPosts = state.posts.filter((post) => post.authorId === member.id)
  if (connection) {
    const isOwn=member.id===connection.user.publicId
    const recent=connection.badges.grants.filter(grant=>grant.status==='active').slice(0,3)
    return <dialog ref={dialog} className={`${s.profileDialog} ${s.memberDialog}`} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={event=>{event.preventDefault();if(!connection.busy)onClose()}}>
      <div className={s.dialogHeading}><div><span className={s.eyebrow}>{isOwn?'MI ESPACIO':'MIEMBRO DEL GRUPO'}</span><h2 id={`${id}-title`}>{member.alias}</h2></div><button className={s.iconButton} disabled={connection.busy} type="button" onClick={onClose} aria-label="Cerrar perfil"><CommunityIcon name="close"/></button></div>
      <div className={s.profileBody}>
        <div className={s.profileIdentity}><Avatar member={member}/><div><strong>{member.alias}</strong><p id={`${id}-description`}>{isOwn?'Tu espacio personal en CAI':'Su aprendizaje, sus momentos y lo que comparte.'}</p></div></div>
        {isOwn&&<><section className={s.profileStats} aria-label="Mi progreso privado"><div><b>{connection.challenges.progress.points.toLocaleString('es-MX')}</b><span>puntos</span></div><div><b>{connection.badges.grants.filter(grant=>grant.status==='active').length}</b><span>insignias</span></div><div><b>{connection.challenges.progress.currentStreak}</b><span>días seguidos</span></div></section><p className={s.profilePrivateHint}><CommunityIcon name="shield" size={15}/> Tus puntos y tu serie solo los ves tú.</p><div className={s.profileTabs} role="group" aria-label="Organizar mi perfil"><button type="button" aria-pressed={profileView==='activity'} onClick={()=>setProfileView('activity')}>Mi actividad</button><button type="button" aria-pressed={profileView==='account'} onClick={()=>setProfileView('account')}>Mi cuenta</button></div></>}
        <div hidden={isOwn&&profileView!=='activity'}>
          {isOwn&&recent.length>0&&<section className={s.profileCollection} aria-label="Mis insignias recientes"><h3>Mis insignias recientes</h3><div>{recent.map(grant=><span key={grant.id}><BadgeArtwork badgeId={grant.badge.id} symbol={grant.badge.symbol} className={s.profileBadgeArtwork}/><strong>{grant.badge.title}</strong></span>)}</div></section>}
          {isOwn&&<button className={s.profileCollectionLink} type="button" onClick={()=>{onClose();dispatch({type:'section',section:'achievements',achievementTab:'badges'})}}>Ver todas mis insignias</button>}
          <SocialProfileContent memberId={memberId} connection={connection} onClose={onClose}/>
        </div>
        {isOwn&&<div hidden={profileView!=='account'}><p className={s.profileGroup}>{[connection.user.program,connection.user.group].filter(Boolean).join(' · ')}</p>{connection.notice&&<p role="status">{connection.notice}</p>}<OwnProfileForm connection={connection}/><section className={s.accountActions} aria-label="Opciones de mi cuenta"><h3>Accesos de mi cuenta</h3><Link to="/mi-inscripcion" onClick={onClose}><CommunityIcon name="book" size={18}/> Mi inscripción <CommunityIcon name="arrow" size={16}/></Link>{onOpenNotifications&&<button type="button" onClick={onOpenNotifications}><CommunityIcon name="bell" size={18}/> Mis notificaciones ({connection.notices.filter(item=>!item.read).length}) <CommunityIcon name="arrow" size={16}/></button>}<button type="button" disabled={connection.busy||refreshing} onClick={async()=>{setRefreshing(true);try{await connection.refresh()}finally{setRefreshing(false)}}}><CommunityIcon name="reset" size={18}/>{refreshing?'Actualizando…':'Actualizar comunidad'}</button><button type="button" disabled={connection.busy} className={s.logoutAction} onClick={()=>{void connection.logout()}}>Cerrar sesión <CommunityIcon name="arrow" size={16}/></button>{connection.error&&<p role="alert">{connection.error}</p>}</section></div>}
      </div>
    </dialog>
  }

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
