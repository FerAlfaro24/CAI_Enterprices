import { useEffect, useRef } from 'react'

let openDialogs = 0
let originalOverflow = ''

/** Native modals, with shared scroll locking for a profile over a story. */
export function useCommunityDialog() {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement
    if (openDialogs === 0) originalOverflow = document.body.style.overflow
    openDialogs += 1
    document.body.style.overflow = 'hidden'
    element?.showModal()
    element?.querySelector<HTMLButtonElement>('button')?.focus()
    const containFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !element) return
      const controls = [...element.querySelectorAll<HTMLElement>('button, input, select, textarea, a[href], [tabindex]')]
        .filter((control) => control.tabIndex >= 0 && !control.hasAttribute('disabled') && control.getClientRects().length > 0)
      const first = controls[0]
      const last = controls.at(-1)
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    }
    element?.addEventListener('keydown', containFocus)
    return () => {
      element?.removeEventListener('keydown', containFocus)
      element?.close()
      openDialogs -= 1
      if (openDialogs === 0) document.body.style.overflow = originalOverflow
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true })
    }
  }, [])
  return dialog
}
