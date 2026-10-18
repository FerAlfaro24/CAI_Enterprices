import { useEffect, useId, useState } from 'react'
import { useCommunity } from '../context'
import { CommunityIcon } from '../components/ui'
import { heroSlides } from './data'
import s from './home.module.css'

export function HomeHero() {
  const { dispatch } = useCommunity()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [hidden, setHidden] = useState(() => document.hidden)
  const id = useId()
  const slide = heroSlides[index]!
  const rotating = !paused && !hovered && !focused && !reducedMotion && !hidden

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const changeMotion = () => setReducedMotion(media.matches)
    const changeVisibility = () => setHidden(document.hidden)
    media.addEventListener('change', changeMotion)
    document.addEventListener('visibilitychange', changeVisibility)
    return () => { media.removeEventListener('change', changeMotion); document.removeEventListener('visibilitychange', changeVisibility) }
  }, [])

  useEffect(() => {
    if (!rotating) return
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % heroSlides.length), 8000)
    return () => window.clearInterval(timer)
  }, [rotating])

  const go = (next: number) => { setPaused(true); setIndex((next + heroSlides.length) % heroSlides.length) }
  const explore = () => {
    const feed = document.getElementById('home-feed-title')
    feed?.focus({ preventScroll: true })
    feed?.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'instant' : 'smooth' })
  }

  return <section className={s.hero} aria-label="Lo que nos conecta" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false) }}>
    <div className={s.heroCopy}>
      <span className={s.heroEyebrow}>TU COMUNIDAD, TU MOMENTO <span aria-hidden="true">✦</span></span>
      <h1 id="community-title" tabIndex={-1}>¡Aquí pasan cosas<br className={s.heroBreak} /> que vale la pena contar!</h1>
      <p>Comparte tus logros, inspira a alguien y celebra lo que nos conecta: aprender inglés juntos.</p>
      <div className={s.heroActions}><button type="button" className={s.yellowButton} onClick={explore}>Explorar el feed <CommunityIcon name="arrow" size={17} /></button><button type="button" className={s.heroSecondary} onClick={() => dispatch({ type: 'section', section: 'challenges' })}>Jugar reto de hoy</button></div>
    </div>
    <div className={s.carousel} role="region" aria-roledescription="carrusel" aria-label="Historias ilustrativas de CAI" data-slide={slide.id}>
      <div className={s.carouselTop}>
        <span>ESCENAS ILUSTRATIVAS</span>
        <div className={s.carouselControls}><button type="button" className={s.playButton} aria-label={paused || reducedMotion ? 'Activar avance automático' : 'Pausar avance automático'} aria-pressed={!paused && !reducedMotion} disabled={reducedMotion} title={reducedMotion ? 'Avance automático desactivado por movimiento reducido' : undefined} onClick={() => setPaused(!paused)}><span aria-hidden="true">{paused || reducedMotion ? '▶' : 'Ⅱ'}</span></button><div className={s.dots} role="group" aria-label="Elegir diapositiva">{heroSlides.map((item, position) => <button type="button" key={item.id} aria-label={`Diapositiva ${position + 1}: ${item.title}`} aria-current={position === index ? 'true' : undefined} aria-controls={id} onClick={() => go(position)}><span /></button>)}</div></div>
      </div>
      <div className={s.slide} id={id} role="group" aria-roledescription="diapositiva" aria-label={`${index + 1} de ${heroSlides.length}`} aria-live={rotating ? 'off' : 'polite'} aria-atomic="true">
        {slide.image ? <img className={s.heroImage} src={slide.image.src} alt={slide.image.alt} /> : <div className={s.artwork} aria-hidden="true">{slide.cards.map((word, position) => <div className={s.artCard} key={word}><span>{position === 0 ? '✦' : position === 1 ? '✺' : '✧'}</span><strong>{word}</strong><i /></div>)}</div>}
        <div className={s.slideCaption}><span>{slide.category}</span><h2>{slide.title}</h2><p>{slide.description}</p></div>
      </div>
      <button type="button" className={`${s.carouselArrow} ${s.previous}`} aria-label="Diapositiva anterior" onClick={() => go(index - 1)}>‹</button><button type="button" className={`${s.carouselArrow} ${s.next}`} aria-label="Diapositiva siguiente" onClick={() => go(index + 1)}>›</button>
    </div>
  </section>
}
