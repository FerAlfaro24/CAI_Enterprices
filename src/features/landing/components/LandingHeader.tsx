import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import emblem from '../../../assets/cai/logo-cai-emblema.svg'
import { navigation } from '../data/content'
import s from '../landing.module.css'
import { cx } from '../utils'
import { Icon } from './ui'
import { ThemeSelector } from '../../../components/ThemeSelector'

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [programsOpen, setProgramsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(() => window.scrollY > 10)
  const header = useRef<HTMLElement>(null)
  const nav = useRef<HTMLElement>(null)
  const burger = useRef<HTMLButtonElement>(null)
  const dropdown = useRef<HTMLDivElement>(null)
  const programsButton = useRef<HTMLButtonElement>(null)

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    setProgramsOpen(false)
    burger.current?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    const desktop = matchMedia('(min-width: 1101px)')
    const onResize = () => {
      if (desktop.matches) {
        setMenuOpen(false)
        setProgramsOpen(false)
      }
    }
    const onOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !dropdown.current?.contains(event.target)) setProgramsOpen(false)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    desktop.addEventListener('change', onResize)
    document.addEventListener('pointerdown', onOutsideClick)
    return () => {
      window.removeEventListener('scroll', onScroll)
      desktop.removeEventListener('change', onResize)
      document.removeEventListener('pointerdown', onOutsideClick)
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const previousOverflow = document.body.style.overflow
    const backgrounds = [...(header.current?.parentElement?.querySelectorAll<HTMLElement>('[data-landing-background]') ?? [])]
    const previousInert = backgrounds.map((element) => element.inert)
    document.body.style.overflow = 'hidden'
    backgrounds.forEach((element) => { element.inert = true })
    // Visibility changes immediately; only opacity and position are animated.
    nav.current?.querySelector<HTMLElement>('a,button')?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = previousOverflow
      backgrounds.forEach((element, index) => { element.inert = previousInert[index] ?? false })
    }
  }, [menuOpen])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && (menuOpen || programsOpen)) {
        event.preventDefault()
        if (menuOpen) closeMenu()
        else { setProgramsOpen(false); programsButton.current?.focus() }
      }
      if (event.key !== 'Tab' || !menuOpen) return
      const focusable = [...(nav.current?.querySelectorAll<HTMLElement>('a,button') ?? []), burger.current]
        .filter((element): element is HTMLElement => element !== null && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden')
      const first = focusable[0]
      const last = focusable.at(-1)
      const outside = !focusable.some((element) => element === document.activeElement)
      if (outside || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault(); first?.focus()
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen, programsOpen, closeMenu])

  const onNavigate = () => {
    if (menuOpen) closeMenu()
    else setProgramsOpen(false)
  }

  return (
    <>
      <header ref={header} className={cx(s.nav, scrolled && s['is-scrolled'])} id="top">
        <div className={s.nav__inner}>
          <a href="#top" className={s.logo} aria-label="CAI · Centro de Asesorías Integrales, inicio" onClick={onNavigate}>
            <img className={s.logo__img} src={emblem} alt="" width="62" height="58" />
            <span className={s.logo__text}>Centro de Asesorías<br />Integrales</span>
          </a>
          <nav ref={nav} className={cx(s.nav__links, menuOpen && s['is-open'])} id="landing-navigation" aria-label="Secciones institucionales">
            <a href="#top" onClick={onNavigate}>Inicio</a>
            <div ref={dropdown} className={cx(s.dropdown, programsOpen && s['is-open'])} onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setProgramsOpen(false)
            }}>
              <button ref={programsButton} className={s.dropdown__toggle} type="button" aria-expanded={programsOpen} aria-controls="landing-programs" onClick={() => setProgramsOpen(!programsOpen)}>
                Programas <Icon name="chevron" size={12} />
              </button>
              <div className={s.dropdown__menu} id="landing-programs">
                <a href="#programas" onClick={onNavigate}>Inglés para niños</a>
                <a href="#programas" onClick={onNavigate}>Inglés para adolescentes y adultos</a>
                <a href="#programas" onClick={onNavigate}>Inglés empresarial</a>
                <a href="#servicios" onClick={onNavigate}>Preparación de certificaciones</a>
              </div>
            </div>
            {navigation.map(({ href, label }) => <a key={href} href={href} onClick={onNavigate}>{label}{href === '#plataforma' && <span className={s.pill}>Propuesta</span>}</a>)}
            <a href="#faq" className={s['nav__mobile-only']} onClick={onNavigate}>Preguntas frecuentes</a>
            <Link to="/login" className={s['nav__mobile-only']} onClick={onNavigate}>Iniciar sesión / Registrarse</Link>
            <Link to="/registro" className={s['nav__mobile-only']} onClick={onNavigate}>Solicitar acceso</Link>
            <a href="#contacto" className={s['nav__mobile-only']} onClick={onNavigate}>Contacto</a>
            <div className={s['nav__mobile-cta']}><a href="#contacto" className={cx(s.btn, s['btn--primary'], s['btn--lg'])} onClick={onNavigate}>Explora la clase muestra</a></div>
          </nav>
          <div className={s.nav__actions}>
            <Link to="/login" className={cx(s.btn, s['btn--ghost'])} onClick={onNavigate}>Iniciar sesión / Registrarse</Link>
            <ThemeSelector />
            <a href="#contacto" className={cx(s.btn, s['btn--primary'], s['btn--sm'])} onClick={onNavigate}>Contacto</a>
            <button ref={burger} className={s.nav__burger} type="button" aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={menuOpen} aria-controls="landing-navigation" onClick={() => {
              if (menuOpen) closeMenu()
              else {
                header.current?.scrollIntoView({ block: 'start', behavior: 'instant' })
                setMenuOpen(true)
              }
            }}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
      <button className={cx(s.nav__backdrop, menuOpen && s['is-open'])} tabIndex={-1} type="button" aria-label="Cerrar menú desde el fondo" onClick={closeMenu} />
    </>
  )
}
