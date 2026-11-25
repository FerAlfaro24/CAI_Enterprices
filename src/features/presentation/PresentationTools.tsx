import { useState } from 'react'
import { Link } from 'react-router'
import { resetPresentation } from './store'
import styles from './presentation.module.css'

export function PresentationTools() {
  const [confirm, setConfirm] = useState(false)
  return <aside className={styles.tools} data-cai-presentation aria-label="Controles de la presentación">
    <div className={styles.label}><strong>Presentación CAI</strong><span>Datos ficticios · Cambios solo en este navegador</span></div>
    <nav aria-label="Explorar la muestra"><Link to="/">Página principal</Link><Link to="/community">Alumno</Link><Link to="/admin">Coordinación</Link><button type="button" onClick={() => setConfirm(true)}>Reiniciar</button></nav>
    {confirm && <div className={styles.confirm} role="alert"><p>¿Reiniciar esta muestra? Se borrarán únicamente los cambios de presentación guardados en este navegador.</p><button type="button" onClick={() => { resetPresentation(); window.location.assign('/community') }}>Sí, reiniciar muestra</button><button type="button" onClick={() => setConfirm(false)}>Cancelar</button></div>}
  </aside>
}
