import { useEffect, useState } from 'react'
import { m } from 'motion/react'
import { useCommunity } from '../context'
import { CommunityIcon } from '../components/ui'
import { useCommunityReducedMotion } from '../components/useCommunityReducedMotion'
import { selectBadgeGrants } from './model'
import { findBadge } from './catalog'
import { BadgeArtwork } from './BadgeArtwork'
import s from './achievements.module.css'
import { connectedGrants } from './connectedBadges'

/** Celebrate only a new derived grant while this view is mounted. Returning to
 * a section initializes from current grants, so it never replays old awards.
 * Nothing is persisted, published, awarded or dispatched by this presentation.
 */
export function BadgeUnlockNotice() {
  const { state,connection } = useCommunity()
  const grants = connection?connectedGrants(connection):selectBadgeGrants(state)
  const signature = grants.map((grant) => grant.id).join('|')
  const [seen, setSeen] = useState(signature)
  const [badgeId, setBadgeId] = useState<string | null>(null)
  const reduced = useCommunityReducedMotion()
  if (signature !== seen) {
    const previous = new Set(seen.split('|'))
    const added = grants.find((grant) => !previous.has(grant.id))
    setSeen(signature)
    setBadgeId(added?.badgeId ?? null)
  }
  useEffect(() => {
    if (!badgeId) return
    const timer = window.setTimeout(() => setBadgeId(null), 4800)
    return () => window.clearTimeout(timer)
  }, [badgeId])
  const badge = badgeId ? findBadge(badgeId) : undefined
  if (!badge) return null
  return <m.aside key={badge.id} className={s.unlockNotice} aria-label="Insignia recién desbloqueada" initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .22 }}>
    <m.div initial={{ rotate: reduced ? 0 : -8 }} animate={{ rotate: 0 }} transition={{ duration: reduced ? 0 : .35 }}><BadgeArtwork badgeId={badge.id} symbol={badge.symbol} className={s.unlockArtwork} /></m.div>
    <div role="status" aria-live="polite" aria-atomic="true"><span>UN PASO QUE YA ES TUYO</span><strong>{badge.title}</strong><small>Insignia conseguida · Sigue siendo privada.</small></div>
    <button type="button" aria-label="Cerrar celebración de insignia" onClick={() => setBadgeId(null)}><CommunityIcon name="close" size={18} /></button>
  </m.aside>
}
