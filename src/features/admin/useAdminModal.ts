import { useEffect, useRef } from 'react'

let openModals = 0
let originalOverflow = ''
/** Native modal lifecycle shared by admin sheets and nested confirmations. */
export function useAdminModal(open = true) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!open || !dialog) return
    const previous = document.activeElement
    if (!openModals) originalOverflow = document.body.style.overflow
    openModals++
    document.body.style.overflow = 'hidden'
    dialog.showModal()
    dialog.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      event.stopPropagation()
      const controls = [...dialog.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex]')].filter(node => node.tabIndex >= 0 && !node.matches(':disabled') && node.getClientRects().length)
      const first = controls[0], last = controls.at(-1)
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    }
    dialog.addEventListener('keydown', trap)
    return () => {
      dialog.removeEventListener('keydown', trap)
      dialog.close()
      openModals--
      if (!openModals) document.body.style.overflow = originalOverflow
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true })
    }
  }, [open])
  return ref
}
