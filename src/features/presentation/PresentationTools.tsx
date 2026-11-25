import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { resetPresentation } from './store'
import { presentationGoogle } from './google'
import styles from './presentation.module.css'

export function PresentationTools() {
  const [confirm, setConfirm] = useState(false)
  const [verified, setVerified] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const { pathname } = useLocation()
  useEffect(() => {
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      void presentationGoogle<{ verified: boolean; expiresAt?: number }>('session').then(result => {
        if (!active) return
        setVerified(result.verified)
        clearTimeout(timer)
        if (result.verified && result.expiresAt) timer = setTimeout(() => setVerified(false), Math.max(0, result.expiresAt - Date.now()))
      }).catch(() => { if (active) setVerified(false) })
    }
    refresh()
    window.addEventListener('focus', refresh)
    return () => { active = false; clearTimeout(timer); window.removeEventListener('focus', refresh) }
  }, [pathname])
  const logout = async () => {
    setBusy(true); setError('')
    try { await presentationGoogle('logout', 'POST', {}); setVerified(false) }
    catch { setError('No se pudo cerrar Google. Vuelve a intentarlo.') }
    finally { setBusy(false) }
  }
  return <aside className={styles.tools} data-cai-presentation aria-label="Controles de la presentación">
    <div className={styles.label}><strong>Presentación CAI</strong><span>Datos ficticios · Cambios solo en este navegador</span>{verified && <span role="status">✓ Cuenta de Google verificada <button type="button" disabled={busy} onClick={() => { void logout() }}>Salir de Google</button></span>}{error && <span role="alert">{error}</span>}</div>
    <nav aria-label="Explorar la muestra"><Link to="/">Página principal</Link><Link to="/community">Alumno</Link><Link to="/admin">Coordinación</Link><button type="button" onClick={() => setConfirm(true)}>Reiniciar</button></nav>
    {confirm && <div className={styles.confirm} role="alert"><p>¿Reiniciar esta muestra? Se borrarán únicamente los cambios de presentación guardados en este navegador.</p><button type="button" onClick={() => { resetPresentation(); window.location.assign('/community') }}>Sí, reiniciar muestra</button><button type="button" onClick={() => setConfirm(false)}>Cancelar</button></div>}
  </aside>
}
