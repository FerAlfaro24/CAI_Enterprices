import { useRef } from 'react'
import { useCommunity } from '../context'
import type { FeedFilter } from '../types'
import s from './home.module.css'

export function HomeFeedFilters({ photosOnly, onChange }: {
  photosOnly: boolean
  onChange: (filter: FeedFilter, photos?: boolean) => void
}) {
  const { state } = useCommunity()
  const more = useRef<HTMLDetailsElement>(null)
  const close = () => {
    if (!more.current) return
    more.current.open = false
    more.current.querySelector('summary')?.focus()
  }
  const choose = (filter: FeedFilter) => { onChange(filter); close() }
  const extra = state.filter === 'experiences' || state.filter === 'celebrated'
  return <div className={s.filters} role="group" aria-label="Filtrar publicaciones">
    <button type="button" aria-pressed={state.filter === 'recent' && !photosOnly} onClick={() => onChange('recent')}>Recientes</button>
    <button type="button" aria-pressed={state.filter === 'achievements'} onClick={() => onChange('achievements')}>Logros</button>
    <button type="button" aria-pressed={photosOnly} onClick={() => onChange('recent', true)}>Fotos</button>
    <details ref={more} className={s.moreFilters} onKeyDown={(event) => { if (event.key === 'Escape') close() }}>
      <summary className={extra ? s.activeFilter : ''}>{state.filter === 'experiences' ? 'Experiencias' : state.filter === 'celebrated' ? 'Más celebradas' : 'Más +'}</summary>
      <div>
        <button type="button" aria-pressed={state.filter === 'experiences'} onClick={() => choose('experiences')}>Experiencias</button>
        <button type="button" aria-pressed={state.filter === 'celebrated'} onClick={() => choose('celebrated')}>Más celebradas</button>
      </div>
    </details>
  </div>
}
