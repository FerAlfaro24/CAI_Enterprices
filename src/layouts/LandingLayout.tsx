import { useEffect, useRef, type MouseEvent } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { LandingFooter } from '../features/landing/components/LandingFooter'
import { LandingHeader } from '../features/landing/components/LandingHeader'
import { useLandingMotion } from '../features/landing/hooks/useLandingMotion'
import s from '../features/landing/landing.module.css'

export function LandingLayout() {
  const root = useRef<HTMLDivElement>(null)
  const { hash, key } = useLocation()
  const navigate = useNavigate()
  useLandingMotion(root)

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const target = hash ? document.getElementById(hash.slice(1)) : null
      if (!target) { window.scrollTo({ top: 0, behavior: 'instant' }); return }
      target.tabIndex = -1
      target.focus({ preventScroll: true })
      target.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    })
    return () => cancelAnimationFrame(id)
  }, [hash, key])

  useEffect(() => () => window.scrollTo({ top: 0, behavior: 'instant' }), [])

  const onAnchorClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return
    const anchor = event.target.closest<HTMLAnchorElement>('a[href^="#"]')
    const href = anchor?.getAttribute('href')
    if (href && href.length > 1 && document.getElementById(href.slice(1))) {
      event.preventDefault()
      navigate(href)
    }
  }

  return (
    <div ref={root} className={s.landing} onClick={onAnchorClick}>
      <a className={s['skip-link']} href="#main-content">Saltar al contenido</a>
      <LandingHeader />
      <main id="main-content" tabIndex={-1} data-landing-background><Outlet /></main>
      <LandingFooter />
    </div>
  )
}
