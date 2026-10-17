import { photos, programs, testimonials } from '../data/content'
import s from '../landing.module.css'
import { cx } from '../utils'
import { CardCarousel } from './CardCarousel'
import { ButtonLink, ContentNote, Icon } from './ui'

export function TestimonialsSection() {
  return (
    <section className={s.testimonials} id="alumnos" aria-labelledby="testimonials-title">
      <div className={s.container}>
        <h2 className={s['section-title']} id="testimonials-title" data-reveal>Lo que podrían contar nuestros alumnos</h2>
        <ContentNote>Testimonios ficticios de la propuesta original. Los retratos son fotografías ilustrativas y no corresponden a alumnos de CAI.</ContentNote>
        <CardCarousel label="Testimonios de muestra" kind="testimonials">
          {testimonials.map(({ name, detail, quote, portrait }) => <figure className={s['t-card']} key={name} data-reveal>
            <img src={portrait} alt="Retrato de stock de una persona adulta; imagen ilustrativa" width="600" height="420" loading="lazy" decoding="async" />
            <div className={s['t-card__body']}><blockquote><p>“{quote}”</p></blockquote><figcaption>{name}<small>{detail}</small></figcaption></div>
          </figure>)}
        </CardCarousel>
      </div>
    </section>
  )
}

export function AudienceSection() {
  return (
    <section className={s.feature} aria-labelledby="audience-title">
      <div className={cx(s.container, s.feature__grid)}>
        <div className={s.feature__media} data-reveal><div className={s['media-card']}>
          <img src={photos.meeting} alt="Personas adultas colaborando alrededor de una mesa; fotografía ilustrativa" width="1000" height="750" loading="lazy" decoding="async" />
          <svg className={s.doodle} viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" aria-hidden="true"><path d="M20 30c20 10 50 20 80 15M25 60c25 8 45 12 70 8M30 90c18 6 35 8 55 4" /></svg>
        </div></div>
        <div className={s.feature__text} data-reveal><h2 id="audience-title">De la primaria a la oficina: inglés para cada etapa</h2><p>Aprender jugando, prepararse para el futuro académico o dar el siguiente paso profesional. La propuesta de CAI contempla una ruta para cada etapa y cada objetivo.</p><ContentNote>Públicos y modalidades de muestra. No se utilizan fotografías de alumnos menores.</ContentNote></div>
      </div>
    </section>
  )
}

export function TrialClassSection() {
  return (
    <section className={s.cta} aria-labelledby="trial-title">
      <div className={s.container}><div className={s.cta__panel} data-reveal>
        <h2 id="trial-title">¿Listo para empezar a hablar inglés?</h2>
        <p>Conoce la propuesta de una primera clase y un examen de ubicación para encontrar tu punto de partida.</p>
        <ButtonLink href="#contacto" variant="white" large>Explora tu clase muestra <Icon name="arrow" size={18} /></ButtonLink>
        <ContentNote light>Disponibilidad y gratuidad por confirmar. El formulario es una demostración y no reserva una clase.</ContentNote>
      </div></div>
    </section>
  )
}

export function ProgramsSection() {
  return (
    <section className={s.programs} id="programas" aria-labelledby="programs-title">
      <div className={s.container}>
        <h2 className={cx(s['section-title'], s['section-title--left'])} id="programs-title" data-reveal>Nuestros programas</h2>
        <p className={s.lead}>Encuentra una propuesta para ti, para tu familia o para tu equipo.</p>
        <ContentNote>Catálogo de muestra. Edades, niveles y oferta definitiva pendientes de validación.</ContentNote>
        <CardCarousel label="Programas propuestos" kind="programs">
          {programs.map(({ id, title, audience, image, alt }) => <a className={s['p-card']} key={id} href="#contacto" data-reveal>
            <img src={image} alt={alt} width="700" height="840" loading="lazy" decoding="async" /><div className={s['p-card__shade']} aria-hidden="true" /><div className={s['p-card__body']}><span>{audience}</span><h3>{title}</h3></div>
          </a>)}
        </CardCarousel>
      </div>
    </section>
  )
}
