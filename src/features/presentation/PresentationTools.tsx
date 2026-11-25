import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { localApi, studentApi } from '../local-access/api'
import { resetPresentation } from './store'
import { AccessFrame } from '../login/AccessFrame'
import access from '../login/login.module.css'
import styles from './presentation.module.css'

export function PresentationTools() {
  const [confirm, setConfirm] = useState(false)
  return <aside className={styles.tools} data-cai-presentation aria-label="Controles de la presentación">
    <div className={styles.label}><strong>Presentación CAI</strong><span>Datos ficticios · Cambios solo en este navegador</span></div>
    <nav aria-label="Explorar la muestra"><Link to="/">Página principal</Link><Link to="/community">Alumno</Link><Link to="/admin">Coordinación</Link><button type="button" onClick={() => setConfirm(true)}>Reiniciar</button></nav>
    {confirm && <div className={styles.confirm} role="alert"><p>¿Reiniciar esta muestra? Se borrarán únicamente los cambios de presentación guardados en este navegador.</p><button type="button" onClick={() => { resetPresentation(); window.location.assign('/community') }}>Sí, reiniciar muestra</button><button type="button" onClick={() => setConfirm(false)}>Cancelar</button></div>}
  </aside>
}
export function PresentationAccess({ admin = false }: { admin?: boolean }) {
  const navigate = useNavigate(), [error, setError] = useState('')
  const enter = async (coordinator: boolean) => {
    try {
      if (coordinator) await localApi.login('', '')
      else await studentApi.login('', '')
      navigate(coordinator ? '/admin' : '/community')
    } catch { setError('No se pudo abrir la muestra. Comprueba el almacenamiento del navegador.') }
  }
  return <AccessFrame><span className={access.kicker}>EXPLORA CAI</span><h1>Una comunidad<br/>llena de posibilidades.</h1><p className={access.lead}>Conoce la experiencia con perfiles, historias y actividad de ejemplo.</p><p className={access.notice}>Esta es una presentación interactiva. No necesitas correo ni contraseña. Tus cambios solo se guardan en este navegador; Google y los correos reales quedan fuera de esta muestra.</p><div className={styles.access}><button className={access.primary} type="button" onClick={() => { void enter(admin) }}>{admin ? 'Explorar como coordinación' : 'Explorar como alumno'} →</button><button className={access.primary} type="button" onClick={() => { void enter(!admin) }}>{admin ? 'Ver la experiencia del alumno' : 'Ver el panel de coordinación'} →</button></div>{error && <p role="alert">{error}</p>}<p className={access.footnote}><Link to="/registro">Probar el formulario con datos ficticios</Link></p></AccessFrame>
}
