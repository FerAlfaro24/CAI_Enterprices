import { Link } from 'react-router'
import { faqs, photos } from '../data/content'
import s from '../landing.module.css'
import { cx } from '../utils'
import { DemoForm } from './DemoForm'
import { ContentNote, Icon } from './ui'

export function PlatformPreviewSection() {
  return (
    <section className={s.band} id="plataforma" aria-labelledby="platform-title">
      <div className={cx(s.container, s.feature__grid)}>
        <div className={s.feature__text} data-reveal>
          <span className={s.badge}>Propuesta futura · Sin fecha de lanzamiento</span>
          <h2 id="platform-title">Plataforma de cursos CAI</h2>
          <p>Imagina aprender desde cualquier lugar: lecciones en vídeo, ejercicios interactivos, seguimiento de progreso y clases en vivo. Son ideas para una siguiente etapa, pendientes de aprobación.</p>
          <ContentNote>Esta plataforma de cursos no está implementada. Es distinta de la comunidad privada de alumnos, que requiere acceso aprobado por CAI.</ContentNote>
          <p><Link className={s['demo-link']} to="/community">Entrar a la comunidad de alumnos →</Link></p>
          <p><Link className={s['demo-link']} to="/registro">¿Ya eres alumno? Solicita tu acceso →</Link></p>
          <DemoForm variant="waitlist" />
        </div>
        <div className={s.feature__media} data-reveal><div className={s['media-card']}>
          <img src={photos.online} alt="Detalle de un ordenador portátil en una mesa de trabajo; imagen ilustrativa" width="1000" height="667" loading="lazy" decoding="async" />
          <svg className={cx(s.doodle, s['doodle--tl'])} viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round" aria-hidden="true"><path d="M20 20l60 70M45 15l55 60" /></svg>
        </div></div>
      </div>
    </section>
  )
}

export function FaqSection() {
  return (
    <section className={s.faq} id="faq" aria-labelledby="faq-title">
      <div className={cx(s.container, s.faq__grid)}>
        <div className={s.faq__intro}>
          <span className={s.eyebrow}>Preguntas frecuentes</span>
          <h2 id="faq-title">Resolvemos tus dudas</h2>
          <p>Conoce lo que contempla la propuesta. Las respuestas comerciales son provisionales.</p>
          <div className={s.faq__help}><span className={s.icon}><Icon name="chat" /></span><div><h3>¿Quieres conocer el siguiente paso?</h3><p>Explora cómo se solicitaría información en la demostración.</p><a href="#contacto" className={s.faq__link}>Ver contacto de muestra <Icon name="arrow" size={16} /></a></div></div>
        </div>
        <div className={s.faq__list} data-reveal>
          {faqs.map(({ question, answer }, index) => (
            <details name="cai-landing-faq" key={question} open={index === 0}>
              <summary>{question}</summary><div className={s.faq__answer}><p>{answer}</p></div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ContactSection() {
  return (
    <section className={s.contact} id="contacto" aria-labelledby="contact-title">
      <div className={cx(s.container, s.contact__grid)}>
        <div>
          <span className={s.eyebrow}>Da el primer paso</span>
          <h2 id="contact-title">Explora tu clase muestra</h2>
          <p>Solicita información para conocer CAI. Durante estas pruebas locales utiliza datos ficticios.</p>
          <ul className={s.contact__info}>
            <li><b>Teléfono:</b> Pendiente de confirmar</li>
            <li><b>WhatsApp:</b> Pendiente de confirmar</li>
            <li><b>Dirección:</b> Sede y ubicación por validar</li>
            <li><b>Horario:</b> Disponibilidad por confirmar</li>
          </ul>
          <ContentNote>Las consultas se guardan para coordinación en este equipo; no se reservan clases ni se envían correos. Las condiciones de la clase muestra y los medios de contacto deben validarse con CAI.</ContentNote>
          <Link className={s['demo-link']} to="/community">Entrar a la comunidad de alumnos →</Link>
          <Link className={s['demo-link']} to="/registro">¿Ya eres alumno? Solicita tu acceso →</Link>
        </div>
        <DemoForm variant="contact" />
      </div>
    </section>
  )
}
