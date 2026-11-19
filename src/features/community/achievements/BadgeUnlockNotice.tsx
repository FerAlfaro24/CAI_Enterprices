import { useId, useState } from 'react'
import { m } from 'motion/react'
import { useCommunity } from '../context'
import { CommunityIcon } from '../components/ui'
import { useCommunityReducedMotion } from '../components/useCommunityReducedMotion'
import { useCommunityDialog } from '../useCommunityDialog'
import { CelebrationBurst } from '../components/CelebrationBurst'
import { selectBadgeGrants } from './model'
import { findBadge } from './catalog'
import { BadgeArtwork } from './BadgeArtwork'
import { connectedGrants } from './connectedBadges'
import type { BadgeDefinition, BadgeGrant } from './types'
import s from './achievements.module.css'

function BadgeCelebration({ badge, grant, remaining, onClose, onCollection }: {
  badge: BadgeDefinition; grant: BadgeGrant; remaining: number; onClose: () => void; onCollection: () => void
}) {
  const dialog = useCommunityDialog(), id = useId(), reduced = useCommunityReducedMotion()
  return <m.dialog ref={dialog} className={s.celebrationDialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-reason`} onCancel={event => { event.preventDefault(); onClose() }} initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }}>
    <CelebrationBurst />
    <button type="button" className={s.celebrationClose} aria-label="Cerrar celebración de insignia" onClick={onClose}><CommunityIcon name="close" size={21} /></button>
    <span className={s.celebrationEyebrow}>UN PASO QUE YA ES TUYO</span>
    <m.div className={s.celebrationMedal} initial={{ scale: reduced ? 1 : .6, rotate: reduced ? 0 : -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', duration: .7, bounce: .3 }}><BadgeArtwork badgeId={badge.id} symbol={badge.symbol} className={s.celebrationArtwork} /></m.div>
    <p className={s.celebrationLabel}>¡Nueva insignia!</p><h2 id={`${id}-title`}>{badge.title}</h2>
    <p id={`${id}-reason`}>{grant.condition || badge.description}</p>
    <p className={s.celebrationPrivacy}><CommunityIcon name="shield" size={15} /> Es tuya y es privada. Tú decides si compartirla.</p>
    <div className={s.celebrationActions}><button type="button" onClick={onClose}>{remaining > 1 ? `Siguiente insignia (${remaining - 1})` : '¡A seguir aprendiendo!'}</button><button type="button" onClick={onCollection}>Ver mis insignias <CommunityIcon name="arrow" size={17} /></button></div>
  </m.dialog>
}

/** Only new confirmed grants while mounted. Existing grants never replay on reload. */
export function BadgeUnlockNotice() {
  const { state, connection, dispatch } = useCommunity()
  const grants = connection ? connectedGrants(connection) : selectBadgeGrants(state)
  const signature = grants.map(grant => grant.id).join('|')
  const [seen, setSeen] = useState(signature)
  const [queue, setQueue] = useState<BadgeGrant[]>([])
  if (signature !== seen) {
    const previous = new Set(seen.split('|')), active = new Set(grants.map(grant => grant.id))
    setSeen(signature)
    setQueue(current => [...current.filter(grant => active.has(grant.id)), ...grants.filter(grant => !previous.has(grant.id))])
  }
  const grant = queue[0], badge = grant ? findBadge(grant.badgeId) : undefined
  if (!grant || !badge) return null
  return <BadgeCelebration key={grant.id} badge={badge} grant={grant} remaining={queue.length} onClose={() => setQueue(current => current.slice(1))} onCollection={() => { setQueue([]); dispatch({ type: 'section', section: 'achievements' }) }} />
}
