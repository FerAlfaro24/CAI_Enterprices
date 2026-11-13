import { useState } from 'react'
import type { CommunityConnection } from '../connection'
import { useCommunity } from '../context'
import { Composer } from '../components/Composer'
import { MySubmissions } from '../components/ModerationPanel'
import { BadgeCollection,BadgeCatalog } from './BadgeCollection'
import { BadgeRequestDialog,BadgeRequestForm } from './BadgeRequestForm'
import { BadgeRequestHistory } from './BadgeRequestHistory'
import { PrivateBadgeHistory } from './ConnectedBadgeRequests'
import { ConnectedRecognitions } from './ConnectedRecognitions'
import type { BadgeGrant } from './types'
import s from './achievements.module.css'

export function ConnectedAchievementsView({connection}:{connection:CommunityConnection}){
 const {dispatch}=useCommunity(),[tab,setTab]=useState<'mine'|'community'>('mine'),[requestId,setRequestId]=useState<string|null>(null),[selected,setSelected]=useState('movie-explorer'),[share,setShare]=useState<BadgeGrant|null>(null)
 const grants=connection.badges.grants.filter(g=>g.status==='active'),toShare=share?grants.find(g=>g.id===share.id):undefined
 return <div className={`${s.achievements} ${s.connected}`}><header className={s.pageHeading}><div><span className={s.eyebrow}>TU ESFUERZO TIENE HISTORIA</span><h1 id="community-title" tabIndex={-1}>Cada logro cuenta.<br/><em>¡Y estos son tuyos!</em></h1><p>Descubre lo que ya conseguiste y tu siguiente aventura. Las insignias son privadas hasta que tú decidas compartir una historia.</p></div><aside className={s.shareCallout}><h2>Un pequeño paso también cuenta.</h2><button type="button" onClick={()=>dispatch({type:'section',section:'challenges'})}>Practicar en Retos →</button></aside></header>
 <div className={s.tabs} role="tablist" aria-label="Vistas de Logros" onKeyDown={e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'mine':e.key==='End'?'community':tab==='mine'?'community':'mine';setTab(next);document.getElementById('real-achievement-'+next)?.focus()}}}>{(['mine','community'] as const).map(value=><button key={value} type="button" role="tab" id={'real-achievement-'+value} aria-controls={'real-achievement-panel-'+value} aria-selected={tab===value} tabIndex={tab===value?0:-1} onClick={()=>setTab(value)}>{value==='mine'?'Mis logros':'La comunidad'}</button>)}</div>
 <section role="tabpanel" id="real-achievement-panel-mine" aria-labelledby="real-achievement-mine" hidden={tab!=='mine'}>{tab==='mine'&&<><section className={s.stats} aria-label="Mi resumen de insignias">{[{value:grants.length,label:'Insignias conseguidas'},{value:connection.badges.pendingBadgeIds.length,label:'Solicitudes en revisión'},{value:grants.filter(g=>g.source==='automatic').length,label:'Automáticas de Retos'},{value:connection.challenges.progress.completedDays,label:'Días completos de práctica'}].map(item=><div key={item.label}><div><strong>{item.value}</strong><span>{item.label}</span></div></div>)}</section>
 <BadgeCollection onShare={setShare}/><BadgeCatalog onRequest={setRequestId}/>
 <div className={s.requestGrid}><section className={s.requestCard} aria-label="Solicitar un reconocimiento"><span className={s.sectionKicker}>TAMBIÉN APRENDES FUERA DE AQUÍ</span><h2>Cuéntale tu aventura a CAI.</h2><p>Una película, una canción o una lectura pueden enseñarte algo nuevo. Explica qué practicaste y qué aprendiste.</p><BadgeRequestForm badgeId={selected} onBadgeChange={setSelected}/></section><aside className={s.requestPreview}><h2>Con revisión de coordinación</h2><p>CAI puede aprobar tu solicitud o indicarte qué reforzar. Si no se aprueba, puedes leer el motivo y volver a intentarlo.</p><p>Las distinciones de conversación, compañerismo y constancia las otorga coordinación directamente.</p></aside></div>
 <BadgeRequestHistory key={connection.badges.requests.items.map(r=>r.id+':'+r.revision).join('|')}/>
 <section className={s.history} aria-label="Historial de mis insignias"><h2>Tu colección conserva su historia.</h2><p>Consulta aquí los motivos privados de concesiones y correcciones. Una retirada no borra tu práctica ni tus puntos.</p>{connection.badges.grants.map(g=><article key={g.id} className={s.earnedCard}><h3>{g.badge.title} · {g.status==='active'?'Conseguida':'Retirada'}</h3>{g.reason&&<p>{g.reason}</p>}<PrivateBadgeHistory key={g.id+':'+g.revision} id={g.id} grant connection={connection}/></article>)}</section><MySubmissions/></>}</section>
 <section role="tabpanel" id="real-achievement-panel-community" aria-labelledby="real-achievement-community" hidden={tab!=='community'}>{tab==='community'&&<ConnectedRecognitions connection={connection}/>}</section>
 {requestId&&<BadgeRequestDialog badgeId={requestId} onBadgeChange={setRequestId} onClose={()=>setRequestId(null)}/>}{toShare&&<Composer badgeShare={{badgeId:toShare.badge.id,title:toShare.badge.title,grantId:toShare.id}} onClose={()=>setShare(null)}/>}
 </div>
}
