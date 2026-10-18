import { useEffect, useId, useState, useSyncExternalStore } from 'react'
import { m } from 'motion/react'
import { useCommunity } from '../context'
import { CommunityIcon } from '../components/ui'
import { MotionButton } from '../components/CommunityMotion'
import { heroSlides } from './data'
import { homeMedia } from './media'
import s from './home.module.css'

const reducedMotionSnapshot = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const subscribeReducedMotion = (notify: () => void) => {
  const media = matchMedia('(prefers-reduced-motion: reduce)')
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

export function HomeHero() {
  const { dispatch } = useCommunity()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  // Read again when subscribing: a preference change between render and effect
  // must not leave the carousel in its previous reduced-motion state.
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, reducedMotionSnapshot, () => true)
  const [hidden, setHidden] = useState(() => document.hidden)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const id = useId()
  const slide = heroSlides[index]!
  const artwork = homeMedia[slide.id]
  const image = slide.image ?? artwork
  const rotating = !paused && !hovered && !focused && !reducedMotion && !hidden

  useEffect(() => {
    const changeVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', changeVisibility)
    return () => document.removeEventListener('visibilitychange', changeVisibility)
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
    <m.div className={s.heroCopy} initial={{ opacity: reducedMotion ? 1 : .75 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : .35 }}>
      <span className={s.heroEyebrow}><span aria-hidden="true">✦</span> TU COMUNIDAD, TU MOMENTO</span>
      <h1 id="community-title" tabIndex={-1}>Aquí pasan cosas<br />que vale la pena<br /><em>contar.</em></h1>
      <p>El inglés nos conecta. Comparte un pequeño avance, encuentra inspiración y celebra el camino en comunidad.</p>
      <div className={s.heroActions}><MotionButton type="button" className={s.yellowButton} onClick={explore}>Explorar el feed <CommunityIcon name="arrow" size={18} /></MotionButton><MotionButton type="button" className={s.heroSecondary} onClick={() => dispatch({ type: 'section', section: 'challenges' })}>Jugar reto de hoy <CommunityIcon name="spark" size={16} /></MotionButton></div>
      <div className={s.heroNote}><span aria-hidden="true">EN</span><span>Aprender. Compartir. Volver a intentarlo.</span></div>
    </m.div>
    <div className={s.carousel} role="region" aria-roledescription="carrusel" aria-label="Historias ilustrativas de CAI" data-slide={slide.id}>
      <div className={s.carouselTop}>
        <span>EL INGLÉS NOS CONECTA <span aria-hidden="true">↗</span></span>
        <div className={s.carouselControls}><button type="button" className={s.playButton} aria-label={paused || reducedMotion ? 'Activar avance automático' : 'Pausar avance automático'} aria-pressed={!paused && !reducedMotion} disabled={reducedMotion} title={reducedMotion ? 'Avance automático desactivado por movimiento reducido' : undefined} onClick={() => setPaused(!paused)}><span aria-hidden="true">{paused || reducedMotion ? '▶' : 'Ⅱ'}</span></button><div className={s.dots} role="group" aria-label="Elegir diapositiva">{heroSlides.map((item, position) => <button type="button" key={item.id} aria-label={`Diapositiva ${position + 1}: ${item.title}`} aria-current={position === index ? 'true' : undefined} aria-controls={id} onClick={() => go(position)}><span /></button>)}</div></div>
      </div>
      <div className={s.slide} id={id} role="group" aria-roledescription="diapositiva" aria-label={`${index + 1} de ${heroSlides.length}`} aria-live={rotating ? 'off' : 'polite'} aria-atomic="true">
        <m.div className={s.artwork} key={slide.id} initial={{ opacity: reducedMotion ? 1 : .65, x: reducedMotion ? 0 : 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reducedMotion ? 0 : .32 }}>
          {failedSource === image.src ? <div className={s.heroImageFallback}><CommunityIcon name="comment" size={44} /><strong>{slide.cards.join(' · ')}</strong><span>Ilustración no disponible</span></div> : <img className={s.heroImage} src={image.src} alt={image.alt} width={artwork.width} height={artwork.height} fetchPriority="high" onError={() => setFailedSource(image.src)} />}
          <span className={s.artCredit}>{image.credit ?? 'Imagen ilustrativa'}</span>
        </m.div>
        <div className={s.slideCaption}><span>{slide.category}</span><h2>{slide.title}</h2><p>{slide.description}</p></div>
      </div>
      <button type="button" className={`${s.carouselArrow} ${s.previous}`} aria-label="Diapositiva anterior" onClick={() => go(index - 1)}>‹</button><button type="button" className={`${s.carouselArrow} ${s.next}`} aria-label="Diapositiva siguiente" onClick={() => go(index + 1)}>›</button>
      <span className={s.slideNumber} aria-hidden="true">0{index + 1} <span>/ 0{heroSlides.length}</span></span>
    </div>
  </section>
}
