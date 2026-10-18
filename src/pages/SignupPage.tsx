import { useEffect } from 'react'
import { Link } from 'react-router'
import emblem from '../assets/cai/logo-cai-blanco.svg'
import { PrototypeNotice } from '../components/PrototypeNotice'
import { SignupForm } from '../features/signup/SignupForm'
import s from '../features/signup/signup.module.css'

const benefits = [
  { title: 'Comparte tus logros', text: 'Publica tus avances, certificaciones y experiencias en inglés.' },
  { title: 'Celebra con tu grupo', text: 'Conoce lo que logran tus compañeros y maestros.' },
  { title: 'Un espacio cuidado', text: 'CAI revisa cada solicitud y cada publicación antes de mostrarla.' },
]

export function SignupPage() {
  useEffect(() => { document.title = 'Solicitar acceso · Comunidad CAI · Prototipo' }, [])

  return (
    <div className={s.page}>
      <a className={s['skip-link']} href="#signup-content">Saltar al formulario</a>
      <PrototypeNotice />
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
          <p className={s['aside-note']}>Prototipo: usa datos ficticios. No se crean cuentas ni se guarda información.</p>
        </aside>

        <main id="signup-content" tabIndex={-1} className={s.main}>
          <div className={s.topline}>
            <Link to="/" className={s.link}>← Volver al sitio</Link>
            <span>¿Ya tienes acceso? <Link to="/community" className={s.link}>Entrar a la comunidad demo</Link></span>
          </div>
          <div className={s.card}>
            <SignupForm />
          </div>
        </main>
      </div>
    </div>
  )
}
