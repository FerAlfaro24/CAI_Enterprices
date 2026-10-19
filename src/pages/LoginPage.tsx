import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, Eye, EyeOff, GraduationCap, ShieldCheck } from 'lucide-react'
import emblem from '../assets/cai/logo-cai-blanco.svg'
import s from '../features/login/login.module.css'
import { ThemeSelector } from '../components/ThemeSelector'

export function LoginPage() {
  const navigate = useNavigate()
  const form = useRef<HTMLFormElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    document.title = 'Bienvenido · Acceso demo · CAI'
    window.scrollTo({ top: 0, behavior: 'instant' })
    heading.current?.focus({ preventScroll: true })
  }, [])

  const enterDemo = (destination: '/community' | '/admin') => {
    form.current?.reset()
    navigate(destination)
  }
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    enterDemo('/community')
  }

  return (
    <div className={s.page}>
      <a className={s.skip} href="#login-content">Saltar al acceso</a>
      <aside className={s.story} aria-label="Bienvenido a CAI">
        <Link to="/" className={s.brand} aria-label="CAI, volver al sitio institucional">
          <img src={emblem} width="52" height="49" alt="" />
          <span>Centro de Asesorías<br />Integrales</span>
        </Link>
        <div className={s.storyContent}>
          <span className={s.eyebrow}>APRENDEMOS. COMPARTIMOS. CRECEMOS.</span>
          <p className={s.statement}>Un idioma.<br /> Muchas <em>historias.</em></p>
          <p className={s.intro}>Cada pequeño avance merece un lugar. Descubre lo que podemos construir juntos en CAI.</p>
          <div className={s.paths} aria-hidden="true"><span>01 / Aprende</span><span>02 / Conecta</span><span>03 / Celebra</span></div>
        </div>
        <p className={s.storyFooter}>Tu siguiente paso empieza aquí.</p>
      </aside>
      <main className={s.main} id="login-content" tabIndex={-1}>
        <div className={s.topline}><Link to="/" className={s.back}><ArrowLeft size={16} aria-hidden="true" /> Volver al sitio</Link><ThemeSelector /></div>
        <div className={s.card}>
          <span className={s.kicker}>TU ESPACIO CAI</span>
          <h1 ref={heading} tabIndex={-1}>Qué gusto verte<br />de nuevo.</h1>
          <p className={s.lead}>Entra y sigue compartiendo tu camino.</p>
          <p className={s.notice} id="login-demo-notice"><ShieldCheck size={20} aria-hidden="true" /><span><strong>Acceso simulado · Prototipo</strong>No se validan, envían ni guardan credenciales. Usa únicamente datos ficticios.</span></p>
          <form ref={form} onSubmit={submit} autoComplete="off" aria-label="Acceso simulado" aria-describedby="login-demo-notice">
            <label htmlFor="login-email">Correo electrónico</label>
            <input id="login-email" name="email" type="email" placeholder="tu.nombre@example.com" autoComplete="off" required maxLength={160} />
            <label htmlFor="login-password">Contraseña de muestra</label>
            <div className={s.password}>
              <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="off" placeholder="Usa una contraseña ficticia" required maxLength={64} />
              <button type="button" className={s.reveal} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} aria-controls="login-password">{showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}</button>
            </div>
            <button type="submit" className={s.primary}>Entrar a la comunidad demo <ArrowRight size={18} aria-hidden="true" /></button>
          </form>
          <p className={s.signup}>¿Es tu primera visita? <Link to="/registro">Solicita tu acceso</Link></p>
          <div className={s.divider}><span>O explora sin llenar el formulario</span></div>
          <div className={s.demoChoices}>
            <button type="button" onClick={() => enterDemo('/community')}><GraduationCap size={23} aria-hidden="true" /><span><strong>Demo estudiante</strong><small>Descubre la comunidad</small></span><ArrowRight size={17} aria-hidden="true" /></button>
            <button type="button" onClick={() => enterDemo('/admin')}><ShieldCheck size={23} aria-hidden="true" /><span><strong>Demo administrador</strong><small>Explora el panel de gestión</small></span><ArrowRight size={17} aria-hidden="true" /></button>
          </div>
          <p className={s.footnote}>Sin cuentas reales. Ambos accesos están abiertos para esta demostración.</p>
        </div>
        <p className={s.footer}>CAI · El inglés nos conecta.</p>
      </main>
    </div>
  )
}
