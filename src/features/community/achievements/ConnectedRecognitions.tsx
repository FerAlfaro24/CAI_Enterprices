import { useState } from 'react'
import { useCommunity } from '../context'
import { useCommunityDialogs } from '../dialogContext'
import type { CommunityConnection } from '../connection'
import { MemberLink } from '../components/MemberLink'
import { BadgeArtwork } from './BadgeArtwork'
import { MotionCard } from '../components/CommunityMotion'
import s from './achievements.module.css'

export function ConnectedRecognitions({connection}:{connection:CommunityConnection}){
 const {state}=useCommunity(),{setDetail}=useCommunityDialogs(),[expanded,setExpanded]=useState(false)
 const stories=state.posts.filter(p=>p.category==='achievement'),recognitions=stories.filter(p=>p.recognition)
 return <><section className={s.recentSection}><header className={s.sectionHeading}><div><h2>Lo que el grupo decidió compartir.</h2><p>Solo aparecen historias aprobadas del grupo. Tus solicitudes y el resto de tu colección siguen en privado.</p></div></header><div className={s.recentGrid} role="region" aria-label="Reconocimientos compartidos">{(expanded?recognitions:recognitions.slice(0,4)).map(p=><MotionCard key={p.id} className={s.publicBadge}><header><MemberLink member={connection.resolveMember(p.authorId)} avatar small/><strong><MemberLink member={connection.resolveMember(p.authorId)}/></strong></header><button className={s.publicBadgeTitle} type="button" onClick={()=>setDetail({postId:p.id,comments:false})}><BadgeArtwork badgeId={p.recognition!.badgeId} symbol="" className={s.publicArtwork}/><strong>{p.recognition!.title}</strong></button><p>{p.title}</p><small>Compartida voluntariamente · {new Date(p.recognition!.awardedAt).toLocaleDateString('es-MX')}</small></MotionCard>)}</div>{!recognitions.length&&<p className={s.emptyHistory}>Todavía no hay insignias compartidas con tu grupo. Tu colección personal es independiente de esta sección.</p>}{recognitions.length>4&&<button className={s.catalogToggle} type="button" onClick={()=>setExpanded(!expanded)}>{expanded?'Ver menos reconocimientos':'Ver más reconocimientos'}</button>}</section>
 <section className={s.storiesSection}><header className={s.sectionHeading}><div><h2>Historias de logros del grupo</h2><p>Compartir una historia no concede una insignia automáticamente.</p></div></header><div className={s.storiesGrid}>{stories.map(p=><MotionCard key={p.id} className={s.storyCard}><MemberLink member={connection.resolveMember(p.authorId)}/><button className={s.storyTitle} type="button" onClick={()=>setDetail({postId:p.id,comments:false})}><h3>{p.title}</h3></button><p>{p.body}</p></MotionCard>)}</div>{!stories.length&&<p className={s.emptyHistory}>No hay historias de logros aprobadas en tu grupo.</p>}</section></>
}
