import type { ReactNode } from 'react'
import s from '../landing.module.css'
import { cx } from '../utils'

type IconName = 'arrow' | 'chevron' | 'chat' | 'award' | 'briefcase' | 'pencil'

export function Icon({ name, size = 24 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {name === 'arrow' && <path d="M5 12h14M13 6l6 6-6 6" />}
      {name === 'chevron' && <path d="m6 9 6 6 6-6" />}
      {name === 'chat' && <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />}
      {name === 'award' && <><circle cx="12" cy="8" r="6" /><path d="m15.5 13.5 1.5 8.5-5-3-5 3 1.5-8.5" /></>}
      {name === 'briefcase' && <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></>}
      {name === 'pencil' && <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4Z" /></>}
    </svg>
  )
}

export function ButtonLink({ href, children, variant = 'primary', large = false }: {
  href: string
  children: ReactNode
  variant?: 'primary' | 'light' | 'white' | 'ghost'
  large?: boolean
}) {
  return <a href={href} className={cx(s.btn, s[`btn--${variant}`], large && s['btn--lg'])}>{children}</a>
}

export function ContentNote({ children, light = false }: { children?: ReactNode; light?: boolean }) {
  return <p className={cx(s['content-note'], light && s['light-note'])}>{children ?? 'Contenido de muestra · Pendiente de validación con CAI.'}</p>
}
