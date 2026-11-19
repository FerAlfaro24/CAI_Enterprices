import { useEffect, useId, useMemo, useState } from 'react'
import { useReducedMotionPreference } from '../useReducedMotionPreference'
import { useCommunity } from '../context'
import { useCommunityDialogs } from '../dialogContext'
import { CommunityIcon } from '../components/ui'
import { communityHighlights, type CommunityHighlight } from './highlights'
import s from './home.module.css'

export function ConnectedHomeHero() {
  const { state, connection, dispatch } = useCommunity(), { setDetail } = useCommunityDialogs()
  const reduced = useReducedMotionPreference(), id = useId()
  const gallery = connection!.gallery
  const slides = useMemo(() => communityHighlights(state.posts, gallery), [state.posts, gallery])
  const [selected, setSelected] = useState(() => slides[0]?.id ?? '')
  const [paused, setPaused] = useState(() => slides.some(slide => slide.kind === 'notice'))
  const [interacting, setInteracting] = useState(false), [hidden, setHidden] = useState(document.hidden)
  const index = Math.max(0, slides.findIndex(slide => slide.id === selected)), slide = slides[index]
  const notices = slides.filter(item => item.kind === 'notice'), moments = slides.filter(item => item.kind !== 'notice')
  const rotating = slides.length > 1 && !paused && !interacting && !reduced && !hidden
  useEffect(() => {
    const change = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', change)
    return () => document.removeEventListener('visibilitychange', change)
  }, [])
  useEffect(() => {
    if (!rotating) return
    const timer = setInterval(() => setSelected(current => {
      const currentIndex = Math.max(0, slides.findIndex(item => item.id === current))
      return slides[(currentIndex + 1) % slides.length]!.id
    }), 8000)
    return () => clearInterval(timer)
  }, [rotating, slides])
  const move = (next: number) => { setPaused(true); setSelected(slides[(next + slides.length) % slides.length]!.id) }
  const open = (item: CommunityHighlight) => {
    if (item.postId) setDetail({ postId: item.postId, comments: false })
    else dispatch({ type: 'section', section: 'gallery' })
  }
  return <section className={s.liveHero} aria-labelledby="community-title">
    <header className={s.liveWelcome}><div><span className={s.sectionEyebrow}>EL INGLÉS NOS CONECTA</span><h1 id="community-title" tabIndex={-1}>Tu comunidad, <em>al día.</em></h1><p>Avisos, historias y momentos para seguir conectados.</p></div><button className={s.navyButton} type="button" onClick={() => dispatch({ type: 'section', section: 'challenges' })}>Practicar inglés <CommunityIcon name="arrow" size={17} /></button></header>
    {slide ? <>
      {notices.length > 0 && moments.length > 0 && <div className={s.highlightChoices} role="group" aria-label="Contenido destacado"><button type="button" aria-pressed={slide.kind === 'notice'} onClick={() => { setPaused(true); setSelected(notices[0]!.id) }}><CommunityIcon name="pin" size={15} /> Avisos de CAI <span>{notices.length}</span></button><button type="button" aria-pressed={slide.kind !== 'notice'} onClick={() => { setPaused(true); setSelected(moments[0]!.id) }}><CommunityIcon name="gallery" size={15} /> Momentos <span>{moments.length}</span></button></div>}
      <div className={s.liveFeature} data-highlight-kind={slide.kind} role="region" aria-roledescription="carrusel" aria-label="Destacados de la comunidad" onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)} onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false) }}>
        {slide.photo ? <button className={s.livePhoto} type="button" onClick={() => open(slide)} aria-label={`Abrir: ${slide.title}`}><img className={s.liveBackdrop} src={slide.photo.src} alt="" aria-hidden="true" /><img className={s.liveMainPhoto} src={slide.photo.src} alt={slide.photo.alt} fetchPriority="high" /></button> : <button className={s.noticeVisual} type="button" onClick={() => open(slide)} aria-label={`Abrir aviso: ${slide.title}`}><span className={s.noticeVisualStamp}>CAI TE CUENTA</span><span className={s.noticeVisualIcon}><CommunityIcon name="pin" size={70} /></span><strong>Lo importante,<br /><em>aquí contigo.</em></strong><span>Tu espacio para estar al día.</span></button>}
        <div className={s.liveCaption} id={id} aria-live={rotating ? 'off' : 'polite'} aria-atomic="true"><span>{slide.label}</span><h2>{slide.title}</h2><p>{slide.description}</p><button type="button" className={s.yellowButton} onClick={() => open(slide)}>{slide.action} <CommunityIcon name="arrow" size={17} /></button>
          {slides.length > 1 && <div className={s.liveControls}><button type="button" aria-label="Destacado anterior" onClick={() => move(index - 1)}>←</button><span>{index + 1} / {slides.length}</span><button type="button" aria-label="Siguiente destacado" onClick={() => move(index + 1)}>→</button><button type="button" aria-label={paused ? 'Activar avance automático' : 'Pausar avance automático'} disabled={Boolean(reduced)} onClick={() => setPaused(value => !value)}>{paused || reduced ? '▶' : 'Ⅱ'}</button></div>}
        </div>
      </div>
    </> : <div className={s.liveEmpty}><CommunityIcon name="gallery" size={32} /><p>Aquí aparecerán los avisos, las fotografías y las historias que CAI comparta con tu comunidad.</p></div>}
  </section>
}
