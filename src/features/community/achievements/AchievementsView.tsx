import { useState } from 'react'
import { useCommunity } from '../context'
import { CommunityIcon } from '../components/ui'
import { Composer } from '../components/Composer'
import { ModerationPanel, MySubmissions } from '../components/ModerationPanel'
import { findBadge } from './catalog'
import { selectBadgeGrants } from './model'
import { MyAchievements } from './MyAchievements'
import { CommunityAchievements } from './CommunityAchievements'
import { BadgeRequestDialog } from './BadgeRequestForm'
import type { BadgeGrant } from './types'
import s from './achievements.module.css'

type Tab = 'mine' | 'community'
export function AchievementsView() {
  const { state } = useCommunity()
  const [tab, setTab] = useState<Tab>('mine')
  const [requestBadgeId, setRequestBadgeId] = useState<string | null>(null)
  const [shareGrant, setShareGrant] = useState<BadgeGrant | null>(null)
  const grants = selectBadgeGrants(state)
  const goToCollection = () => {
    setTab('mine')
    requestAnimationFrame(() => {
      const element = document.getElementById(grants.length ? 'my-badge-collection' : 'badge-catalog')
      element?.focus({ preventScroll: true })
      element?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    })
  }
  const share = (grant: BadgeGrant) => { if (state.mode === 'student' && grants.some((item) => item.id === grant.id)) setShareGrant(grant) }
  const chooseTab = (next: Tab) => { setTab(next); document.getElementById(`achievement-tab-${next}`)?.focus() }
  const badgeToShare = shareGrant ? findBadge(shareGrant.badgeId) : undefined
  return <div className={s.achievements}>
    <header className={s.pageHeading}><div><span className={s.eyebrow}><span aria-hidden="true">{tab === 'mine' ? '🏆' : '✨'}</span> {tab === 'mine' ? 'TU COLECCIÓN PERSONAL' : 'HISTORIAS QUE NOS INSPIRAN'}</span><h1 id="community-title" tabIndex={-1}>{tab === 'mine' ? 'Cada logro cuenta. ¡Y estos son tuyos!' : 'La comunidad también celebra contigo'}</h1><p>{tab === 'mine' ? 'Insignias ganadas, aventuras por intentar y solicitudes en revisión.' : 'Descubre los logros e insignias que tus compañeros decidieron compartir.'}</p></div><aside className={s.shareCallout}><h2>{tab === 'mine' ? '¿Tienes algo que celebrar?' : '¿Quieres compartir tu avance?'}</h2><button type="button" onClick={goToCollection}>{grants.length ? 'Compartir un logro' : tab === 'mine' ? 'Explorar insignias' : 'Ver mis logros'} <span aria-hidden="true">↗</span></button></aside></header>
    <div className={s.tabs} role="tablist" aria-label="Vistas de Logros" onKeyDown={(event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); chooseTab(tab === 'mine' ? 'community' : 'mine') }
      if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); chooseTab(event.key === 'Home' ? 'mine' : 'community') }
    }}>{([{ id: 'mine', label: 'Mis logros', icon: '★' }, { id: 'community', label: 'La comunidad', icon: '♧' }] as const).map((item) => <button key={item.id} id={`achievement-tab-${item.id}`} type="button" role="tab" aria-selected={tab === item.id} aria-controls={`achievement-panel-${item.id}`} tabIndex={tab === item.id ? 0 : -1} onClick={() => setTab(item.id)}><span aria-hidden="true">{item.icon}</span> {item.label}</button>)}</div>
    <div role="tabpanel" id="achievement-panel-mine" aria-labelledby="achievement-tab-mine" tabIndex={0} hidden={tab !== 'mine'}>{tab === 'mine' && <><MyAchievements onRequest={setRequestBadgeId} onShare={share} /><MySubmissions /></>}</div>
    <div role="tabpanel" id="achievement-panel-community" aria-labelledby="achievement-tab-community" tabIndex={0} hidden={tab !== 'community'}>{tab === 'community' && <CommunityAchievements />}</div>
    <div className={s.publicationReview}><ModerationPanel /></div>
    <p className={s.prototypeFootnote}><CommunityIcon name="shield" size={15} /> Perfiles, insignias y solicitudes ficticios. Compartir siempre es voluntario; obtener una insignia no publica una historia.</p>
    {requestBadgeId && <BadgeRequestDialog badgeId={requestBadgeId} onBadgeChange={setRequestBadgeId} onClose={() => setRequestBadgeId(null)} />}
    {badgeToShare && <Composer badgeShare={{ badgeId: badgeToShare.id, title: badgeToShare.title }} onClose={() => setShareGrant(null)} />}
  </div>
}
