import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import emblem from '../../assets/cai/logo-cai-blanco.svg'
import { ThemeSelector } from '../../components/ThemeSelector'
import s from './login.module.css'

/** Composición original v1.0 compartida por acceso, activación y recuperación. */
export function AccessFrame({ children }: { children: ReactNode }) {
  return <div className={s.page}>
    <a className={s.skip} href="#login-content">Saltar al acceso</a>
    <aside className={s.story} aria-label="Bienvenido a CAI">
      <Link to="/" className={s.brand} aria-label="CAI, volver al sitio institucional"><img src={emblem} width="52" height="49" alt="" /><span>Centro de Asesorías<br />Integrales</span></Link>
      <div className={s.storyContent}><span className={s.eyebrow}>APRENDEMOS. COMPARTIMOS. CRECEMOS.</span><p className={s.statement}>Un idioma.<br /> Muchas <em>historias.</em></p><p className={s.intro}>Cada pequeño avance merece un lugar. Descubre lo que podemos construir juntos en CAI.</p><div className={s.paths} aria-hidden="true"><span>01 / Aprende</span><span>02 / Conecta</span><span>03 / Celebra</span></div></div>
      <p className={s.storyFooter}>Tu siguiente paso empieza aquí.</p>
    </aside>
    <main className={s.main} id="login-content" tabIndex={-1}>
      <div className={s.topline}><Link to="/" className={s.back}><ArrowLeft size={16} aria-hidden="true" /> Volver al sitio</Link><ThemeSelector /></div>
      <div className={s.card}>{children}</div>
      <p className={s.footer}>CAI · El inglés nos conecta.</p>
    </main>
  </div>
}
