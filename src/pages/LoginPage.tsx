import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { localApi, studentApi, type LocalUser } from '../features/local-access/api'
import { GoogleSignInButton } from '../features/local-access/GoogleSignInButton'
import emblem from '../assets/cai/logo-cai-blanco.svg'
import s from '../features/login/login.module.css'
import { ThemeSelector } from '../components/ThemeSelector'

export function LoginPage({ admin=false,onAdminLogin }: {admin?:boolean;onAdminLogin?:(user:LocalUser)=>void}) {
  const navigate = useNavigate()
  const form = useRef<HTMLFormElement>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [busy,setBusy]=useState(false),[error,setError]=useState('')

  useEffect(() => {
    document.title = admin ? 'Acceso de administración · CAI' : 'Acceso de alumnos · CAI'
    window.scrollTo({ top: 0, behavior: 'instant' })
    heading.current?.focus({ preventScroll: true })
  }, [admin])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if(busy)return
    const data=new FormData(event.currentTarget)
    setBusy(true);setError('')
    try {
      if(admin) {const {user}=await localApi.login(String(data.get('email')),String(data.get('password')));form.current?.reset();onAdminLogin?.(user)}
      else {await studentApi.login(String(data.get('email')),String(data.get('password')));form.current?.reset();navigate('/alumnos')}
    }catch(error){setError(error instanceof Error?error.message:'No pudimos iniciar sesión.')}
    finally{setBusy(false)}
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
          <span className={s.kicker}>{admin?'ADMINISTRACIÓN CAI':'TU ESPACIO CAI'}</span>
          <h1 ref={heading} tabIndex={-1}>Qué gusto verte<br />de nuevo.</h1>
          <p className={s.lead}>Entra y sigue compartiendo tu camino.</p>
          <p className={s.notice} id="login-demo-notice"><ShieldCheck size={20} aria-hidden="true" /><span><strong>Acceso local · Pruebas</strong>Usa cuentas ficticias activadas. La autorización se comprueba en el servidor.</span></p>
          {!admin && <GoogleSignInButton />}
          <form ref={form} onSubmit={(event)=>{void submit(event)}} aria-busy={busy} aria-label={admin?'Acceso de administración':'Acceso de alumnos'} aria-describedby="login-demo-notice">
            <label htmlFor="login-email">Correo electrónico</label>
            <input id="login-email" name="email" type="email" placeholder="tu.nombre@example.com" autoComplete="off" required maxLength={160} />
            <label htmlFor="login-password">Contraseña</label>
            <div className={s.password}>
              <input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="off" placeholder="Usa una contraseña ficticia" required maxLength={64} />
              <button type="button" className={s.reveal} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} aria-controls="login-password">{showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}</button>
            </div>
            {error && <p role="alert">{error}</p>}
            <button type="submit" className={s.primary} disabled={busy}>{busy?'Entrando…':admin?'Entrar al panel':'Entrar a mi espacio'} <ArrowRight size={18} aria-hidden="true" /></button>
          </form>
          {!admin && <><p className={s.signup}>¿Es tu primera visita? <Link to="/registro">Solicita tu acceso</Link></p><p className={s.footnote}><Link to="/recuperar-acceso">Olvidé mi contraseña</Link></p></>}
          <p className={s.footnote}><Link to={admin?'/login':'/admin'}>{admin?'Acceso de alumnos':'Acceso de administración'}</Link></p>
        </div>
        <p className={s.footer}>CAI · El inglés nos conecta.</p>
      </main>
    </div>
  )
}
