import { useRef, useState } from 'react';
import type { CommunityConnection } from '../connection';
import { useCommunity } from '../context';
import { Composer } from '../components/Composer';
import { BadgeCollection, BadgeCatalog } from './BadgeCollection';
import { BadgeRequestHistory } from './BadgeRequestHistory';
import { PrivateBadgeHistory } from './ConnectedBadgeRequests';
import { ConnectedRecognitions } from './ConnectedRecognitions';
import { LearningStudio } from './LearningStudio';
import type { BadgeGrant } from './types';
import s from './achievements.module.css';
const tabs = [['mine', 'Mis logros'], ['badges', 'Insignias'], ['community', 'La comunidad']] as const;
export function ConnectedAchievementsView({ connection }: {
    connection: CommunityConnection;
}) {
    const { dispatch, state } = useCommunity(), [share, setShare] = useState<BadgeGrant | null>(null), buttons = useRef<(HTMLButtonElement | null)[]>([]);
    const tab = state.achievementTab ?? 'mine', setTab = (tab: 'mine' | 'badges' | 'community') => dispatch({ type: 'achievementTab', tab });
    const grants = connection.badges.grants.filter(grant => grant.status === 'active'), toShare = share ? grants.find(grant => grant.id === share.id) : undefined;
    return <div className={`${s.achievements} ${s.connected}`}><header className={s.pageHeading}><div><span className={s.eyebrow}>TU ESFUERZO TIENE HISTORIA</span><h1 id="community-title" tabIndex={-1}>Cada logro cuenta.<br /><em>A tu manera.</em></h1><p>Registra lo que aprendes, elige qué compartir y descubre las insignias que vas ganando.</p></div><aside className={s.shareCallout}><h2>Pequeños pasos, grandes descubrimientos.</h2><button type="button" onClick={() => dispatch({ type: 'section', section: 'challenges' })}>Practicar en Retos</button></aside></header>
 <div className={s.tabs} role="tablist" aria-label="Vistas de Logros" onKeyDown={event => { if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const current = tabs.findIndex(([value]) => value === tab), index = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (current + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
        setTab(tabs[index]![0]);
        buttons.current[index]?.focus();
    } }}>{tabs.map(([value, label], index) => <button ref={element => { buttons.current[index] = element; }} key={value} type="button" role="tab" id={'learning-tab-' + value} aria-controls={'learning-panel-' + value} aria-selected={tab === value} tabIndex={tab === value ? 0 : -1} onClick={() => setTab(value)}>{label}</button>)}</div>
 {tabs.map(([value]) => <section role="tabpanel" key={value} id={'learning-panel-' + value} aria-labelledby={'learning-tab-' + value} hidden={tab !== value}>{tab === value && (value === 'mine' ? <LearningStudio connection={connection}/> : value === 'community' ? <ConnectedRecognitions connection={connection}/> : <><section className={s.stats} aria-label="Mi resumen de insignias">{[{ value: grants.length, label: 'Insignias conseguidas' }, { value: connection.challenges.progress.completedDays, label: 'Días de práctica' }, { value: connection.badges.catalog.length, label: 'Reconocimientos disponibles' }].map(item => <div key={item.label}><div><strong>{item.value}</strong><span>{item.label}</span></div></div>)}</section><BadgeCollection onShare={setShare}/><BadgeCatalog onRequest={() => { }}/><details className={s.history}><summary>Historial y solicitudes anteriores</summary><p>Las insignias ahora se obtienen por progreso. Conservamos las solicitudes anteriores y los motivos privados.</p><BadgeRequestHistory />{connection.badges.grants.map(grant => <article key={grant.id} className={s.earnedCard}><h3>{grant.badge.title} · {grant.status === 'active' ? 'Conseguida' : 'Retirada'}</h3>{grant.reason && <p>{grant.reason}</p>}<PrivateBadgeHistory id={grant.id} grant connection={connection}/></article>)}</details></>)}</section>)}
 {toShare && <Composer badgeShare={{ badgeId: toShare.badge.id, title: toShare.badge.title, grantId: toShare.id }} onClose={() => setShare(null)}/>}
 </div>;
}
