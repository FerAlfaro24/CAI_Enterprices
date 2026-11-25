import { DemoStoreProvider } from '../app/DemoStoreProvider'
import { useEffect } from 'react'
import { Link } from 'react-router'
import emblem from '../assets/cai/logo-cai-blanco.svg'
import { PrototypeNotice } from '../components/PrototypeNotice'
import { SignupForm, type GoogleSignup } from '../features/signup/SignupForm'
import { GoogleSignInButton } from '../features/local-access/GoogleSignInButton'
import { googleApi } from '../features/local-access/api'
import s from '../features/signup/signup.module.css'

const benefits = [
  { title: 'Comparte tus logros', text: 'Publica tus avances, certificaciones y experiencias en inglés.' },
  { title: 'Celebra en comunidad', text: 'Conoce lo que logran tus compañeros y maestros.' },
  { title: 'Un espacio cuidado', text: 'CAI revisa cada solicitud y cada publicación antes de mostrarla.' },
]

export function SignupPage({ local: localOption = false, google }: { local?: boolean; google?: GoogleSignup }) {
  const local = localOption || Boolean(google)
  useEffect(() => { document.title = 'Solicitar acceso · Comunidad CAI' }, [])

  return (
    <DemoStoreProvider>
    <div className={s.page}>
      <a className={s['skip-link']} href="#signup-content">Saltar al formulario</a>
      {local ? <aside className={s['local-notice']}>{import.meta.env.MODE === 'presentation' ? 'Presentación: usa únicamente datos ficticios. La solicitud se guarda solo en este navegador y puedes revisarla en Coordinación; no se envían correos.' : google ? 'Completa los datos del alumno y espera la aprobación de CAI. Todos los alumnos aprobados comparten la comunidad.' : 'Primero envía tu solicitud. CAI debe aprobarla y compartirte un enlace para que elijas tu contraseña. Por ahora no se envían correos automáticos.'}</aside> : <PrototypeNotice />}
      <div className={s.layout}>
        <aside className={s.aside} aria-label="Sobre la comunidad CAI">
          <Link to="/" className={s.brand}>
            <img src={emblem} alt="" width="44" height="41" />
            <span>Centro de Asesorías<br />Integrales</span>
          </Link>
          <div className={s['aside-body']}>
            <span className={s.eyebrow}>Comunidad de alumnos</span>
            <h1>Únete a la comunidad CAI</h1>
            <p>Solicita tu acceso. Cuando CAI confirme tu inscripción, podrás entrar a la comunidad.</p>
            <ul className={s.benefits}>
              {benefits.map(({ title, text }) => (
                <li key={title}><strong>{title}</strong><span>{text}</span></li>
              ))}
            </ul>
          </div>
          <p className={s['aside-note']}>{google ? 'Google confirma la cuenta utilizada. CAI revisa por separado los datos del alumno y su inscripción.' : local ? 'Tu acceso estará disponible después de que CAI apruebe la solicitud y actives tu cuenta.' : 'Prototipo: usa datos ficticios. No se crean cuentas ni se guarda información.'}</p>
        </aside>

        <main id="signup-content" tabIndex={-1} className={s.main}>
          <div className={s.topline}>
            <Link to="/" className={s.link}>← Volver al sitio</Link>
            {local ? <Link to="/login" className={s.link}>Entrar · Alumnos</Link> : <span>¿Ya tienes acceso? <Link to="/login" className={s.link}>Entrar · Demo</Link></span>}
          </div>
          <div className={s.card}>
            {local && !google && <GoogleSignInButton />}
            {google && <p className={s.hint} style={{ overflowWrap: 'anywhere' }}>Continuaste con {google.email}. <button type="button" className={s.link} onClick={() => { void googleApi.logout().then(() => window.location.assign('/login')).catch(() => window.location.assign('/solicitud-google')) }}>Usar otra cuenta</button></p>}
            <SignupForm local={local} google={google} />
          </div>
        </main>
      </div>
    </div>
    </DemoStoreProvider>
  )
}
