import { useEffect, type RefObject } from 'react'

/** Enhancement only: content and final numbers remain readable without motion. */
export function useLandingMotion(root: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const elements = root.current?.querySelectorAll<HTMLElement>('[data-reveal]')
    if (!elements || !('IntersectionObserver' in window)) return

    const animations = new Set<Animation>()
    const frames = new Set<number>()
    const numbers = root.current?.querySelectorAll<HTMLElement>('[data-count]')
    const finish = () => {
      animations.forEach((animation) => animation.cancel())
      frames.forEach(cancelAnimationFrame)
      frames.clear()
      numbers?.forEach((element) => {
        element.textContent = Number(element.dataset.count).toLocaleString('es-MX')
      })
    }
    const count = (element: HTMLElement) => {
      const target = Number(element.dataset.count)
      const start = performance.now()
      const tick = (now: number) => {
        const progress = Math.min((now - start) / 1100, 1)
        element.textContent = Math.round(target * (1 - (1 - progress) ** 3)).toLocaleString('es-MX')
        if (progress < 1) schedule(tick)
      }
      const schedule = (callback: FrameRequestCallback) => {
        const id = requestAnimationFrame((now) => { frames.delete(id); callback(now) })
        frames.add(id)
      }
      schedule(tick)
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return
        observer.unobserve(target)
        if (media.matches) return
        const animation = target.animate(
          [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'none' }],
          { duration: 500, easing: 'ease-out' },
        )
        animations.add(animation)
        animation.onfinish = () => animations.delete(animation)
        target.querySelectorAll<HTMLElement>('[data-count]').forEach(count)
      })
    }, { threshold: 0.15 })
    if (!media.matches) elements.forEach((element) => observer.observe(element))
    const onMotionChange = () => { if (media.matches) { observer.disconnect(); finish() } }
    media.addEventListener('change', onMotionChange)
    return () => {
      observer.disconnect()
      media.removeEventListener('change', onMotionChange)
      finish()
    }
  }, [root])
}
