import { useEffect, useRef, useState } from 'react'
import { googleApi } from './api'
import s from './google.module.css'

type GoogleClient = { accounts: { id: {
  initialize: (options: { client_id: string; nonce: string; callback: (data: { credential: string }) => void; auto_select: boolean }) => void
  renderButton: (parent: HTMLElement, options: { type: string; theme: string; size: string; text: string; width: number; locale: string }) => void
} } }
const googleClient = () => (window as Window & { google?: GoogleClient }).google
let scriptPromise: Promise<void> | undefined

function loadGoogle() {
  if (googleClient()) return Promise.resolve()
  if (!scriptPromise) scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.referrerPolicy = 'no-referrer-when-downgrade'
    const timer = window.setTimeout(() => fail(), 15_000)
    const fail = () => { window.clearTimeout(timer); script.remove(); scriptPromise = undefined; reject(new Error('No se pudo cargar Google. Revisa la conexión o usa el acceso con contraseña.')) }
    script.onload = () => { window.clearTimeout(timer); resolve() }
    script.onerror = fail
    document.head.append(script)
  })
  return scriptPromise
}

export function GoogleSignInButton() {
  const parent = useRef<HTMLDivElement>(null)
  const busyRef = useRef(false)
  const [busy, setBusy] = useState(false)
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    let observer: ResizeObserver | undefined
    const prepare = async () => {
      const config = await googleApi.config()
      if (!active || !config.enabled) return
      setEnabled(true); setError('')
      await loadGoogle()
      if (!active) return
      const challenge = await googleApi.challenge()
      if (!active || !parent.current) return
      googleClient()!.accounts.id.initialize({ client_id: challenge.clientId, nonce: challenge.nonce, auto_select: false,
        callback: (data) => {
          if (!active || busyRef.current) return
          busyRef.current = true; setBusy(true); setError('')
          void googleApi.signIn(data.credential).then(({ destination }) => {
            if (active) window.location.assign(destination)
          }).catch((error: unknown) => {
            if (!active) return
            observer?.disconnect()
            parent.current?.replaceChildren()
            setError(error instanceof Error ? error.message : 'No pudimos confirmar la cuenta con Google.')
            busyRef.current = false; setBusy(false)
          })
        },
      })
      let previousWidth = 0
      const render = () => {
        if (!active || !parent.current) return
        const width = Math.max(200, Math.min(260, Math.floor(parent.current.clientWidth)))
        if (width === previousWidth) return
        previousWidth = width
        parent.current.replaceChildren()
        googleClient()!.accounts.id.renderButton(parent.current, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', width, locale: 'es' })
      }
      render()
      observer = new ResizeObserver(render)
      observer.observe(parent.current)
    }
    void prepare().catch((error: unknown) => { if (active) setError(error instanceof Error ? error.message : 'Google no está disponible.') })
    return () => { active = false; observer?.disconnect() }
  }, [attempt])
  // Si CAI no ha configurado Google, el acceso habitual sigue disponible.
  if (!enabled) return null
  return (
    <section className={s.option} aria-label="Acceso con Google" aria-busy={busy}>
      <div ref={parent} inert={busy} className={s.button} />
      {busy && <p role="status">Confirmando tu cuenta…</p>}
      {error && <><p role="alert">{error}</p><button type="button" onClick={() => setAttempt((value) => value + 1)}>Volver a cargar Google</button></>}
      <p className={s.hint}>Completa tus datos y espera la aprobación de CAI la primera vez.</p>
    </section>
  )
}
