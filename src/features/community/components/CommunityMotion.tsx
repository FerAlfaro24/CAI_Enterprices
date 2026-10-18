import { LazyMotion, MotionConfig, m, useReducedMotion, type HTMLMotionProps } from 'motion/react'
import type { ReactNode } from 'react'

const loadFeatures = () => import('./motionFeatures').then((module) => module.default)

// Keep the scope inside CommunityShell: other areas keep their own motion policy.
export function CommunityMotion({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user" transition={{ duration: .18, ease: [.22, 1, .36, 1] }}><LazyMotion features={loadFeatures} strict>{children}</LazyMotion></MotionConfig>
}

/** Native button semantics, handlers, disabled state and refs are preserved. */
export function MotionButton({ disabled, ...props }: HTMLMotionProps<'button'>) {
  const reduced = useReducedMotion()
  return <m.button {...props} disabled={disabled} whileTap={disabled || reduced ? undefined : { scale: .97 }} />
}

/** Lift only on deliberate interaction, never as a page entrance sequence. */
export function MotionCard(props: HTMLMotionProps<'article'>) {
  const reduced = useReducedMotion()
  return <m.article {...props} whileHover={reduced ? undefined : { y: -3 }} />
}

/** Small contextual feedback; no exit delay or hidden essential content. */
export function MotionFeedback(props: HTMLMotionProps<'span'>) {
  const reduced = useReducedMotion()
  return <m.span {...props} initial={{ opacity: reduced ? 1 : .7 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : .16 }} />
}
