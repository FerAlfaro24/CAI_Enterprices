import { useRef, type ReactNode } from 'react'
import s from '../landing.module.css'
import { Icon } from './ui'

export function CardCarousel({ label, kind, children }: { label: string; kind: 'testimonials' | 'programs'; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null)
  const move = (direction: number) => {
    const element = track.current
    if (!element) return
    const distance = element.firstElementChild?.getBoundingClientRect().width ?? element.clientWidth * 0.82
    const gap = parseFloat(getComputedStyle(element).columnGap) || 0
    element.scrollBy({ left: direction * (distance + gap), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  return (
    <div className={s.carousel} role="group" aria-label={label}>
      <div ref={track} className={kind === 'testimonials' ? s['t-grid'] : s['p-grid']} tabIndex={0} aria-label={`${label}; desplazamiento horizontal disponible en móvil`}>{children}</div>
      <div className={s['carousel-controls']}>
        <button type="button" aria-label={`Anterior en ${label}`} onClick={() => move(-1)}><span style={{ transform: 'rotate(180deg)', display: 'flex' }}><Icon name="arrow" size={18} /></span></button>
        <span>Desliza o usa las flechas</span>
        <button type="button" aria-label={`Siguiente en ${label}`} onClick={() => move(1)}><Icon name="arrow" size={18} /></button>
      </div>
    </div>
  )
}
