import { Link } from 'react-router'
import logoWhite from '../../../assets/cai/logo-cai-blanco.svg'
import { footerGroups } from '../data/content'
import s from '../landing.module.css'
import { ContentNote } from './ui'

export function LandingFooter() {
  return (
    <footer className={s.footer} data-landing-background>
      <div className={s.container}>
        <div className={s.footer__brand}><a href="#top" className={s.footer__logo} aria-label="CAI, volver al inicio"><img src={logoWhite} alt="Centro de Asesorías Integrales" width="190" height="177" loading="lazy" /></a><p>Inglés que te abre puertas.</p></div>
        <div className={s.footer__cols}>
          {footerGroups.map(({ title, links }) => <div key={title}><h3>{title}</h3>{links.map(({ href, label }) => href.startsWith('/') ? <Link key={label} to={href}>{label}</Link> : <a key={label} href={href}>{label}</a>)}</div>)}
          <div><h3>Contacto</h3><a href="#contacto">Explorar formulario demo</a><span className={s['footer-pending']}>Datos oficiales por confirmar</span></div>
        </div>
        <ContentNote>Aviso de privacidad, términos y redes sociales: pendientes de validación. Esta demostración no recopila datos ni admite cuentas reales.</ContentNote>
        <div className={s.footer__bottom}><p>© {new Date().getFullYear()} CAI · Centro de Asesorías Integrales</p><a href="#top">Volver al inicio ↑</a></div>
      </div>
    </footer>
  )
}
