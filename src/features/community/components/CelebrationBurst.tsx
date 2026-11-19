import { m } from 'motion/react'
import { useCommunityReducedMotion } from './useCommunityReducedMotion'
import s from './celebration.module.css'

/** Ornamental, brief and local to the confirmed result. No timers, sound or dependencies. */
export function CelebrationBurst() {
  const reduced = useCommunityReducedMotion()
  if (reduced) return null
  return <span className={s.burst} aria-hidden="true" data-celebration="confetti">
    {Array.from({ length: 18 }, (_, index) => {
      const angle = (index / 18) * Math.PI * 2
      return <m.i key={index} className={s.particle} data-tone={index % 4}
        initial={{ x: 0, y: 0, rotate: 0, opacity: 0, scale: .4 }}
        animate={{ x: Math.cos(angle) * (90 + index % 3 * 24), y: Math.sin(angle) * 100 - 30, rotate: index * 41, opacity: [0, 1, 1, 0], scale: 1 }}
        transition={{ duration: 1.15, delay: index % 4 * .025, ease: 'easeOut' }} />
    })}
  </span>
}
