import { audiences, programs } from '../data/content'
import { caiLife } from '../data/photos'
import s from '../landing.module.css'
import { cx } from '../utils'
import { CardCarousel } from './CardCarousel'
import { ButtonLink, ContentNote, Icon } from './ui'

export function CaiLifeSection() {
  return (
    <section className={cx(s.testimonials, s.life)} id="alumnos" aria-labelledby="cai-life-title">
      <div className={s.container}>
        <h2 className={s['section-title']} id="cai-life-title" data-reveal>Así se aprende en CAI</h2>
        <ContentNote>Fotografías oficiales del aula y la práctica en línea. Las convivencias y celebraciones están en la comunidad privada.</ContentNote>
        <CardCarousel label="Vida en CAI" kind="testimonials">
          {caiLife.map(({ title, text, image, alt, width, height }) => <figure className={s['t-card']} key={title} data-reveal>
            <img src={image} alt={alt} width={width} height={height} loading="lazy" decoding="async" />
            <div className={s['t-card__body']}><figcaption>{title}<small>{text}</small></figcaption></div>
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
        <div className={s.feature__text} data-reveal>
          <span className={s.eyebrow}>Para cada etapa</span>
          <h2 id="audience-title">De la primaria a la oficina: inglés para cada etapa</h2>
          <p>Aprender jugando, prepararse para el futuro académico o dar el siguiente paso profesional. La propuesta de CAI contempla una ruta para cada etapa y cada objetivo.</p>
          <ContentNote>Públicos y modalidades de muestra, pendientes de validación con CAI.</ContentNote>
          <ButtonLink href="#programas">Ver programas</ButtonLink>
        </div>
        <ul className={s.audiences} data-reveal>
          {audiences.map(({ icon, title, range, text }) => (
            <li key={title} className={s.audience}>
              <span className={s.icon}><Icon name={icon} /></span>
              <h3>{title}</h3>
              <p className={s.audience__range}>{range}</p>
              <p>{text}</p>
            </li>
          ))}
        </ul>
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
          {programs.map(({ id, title, audience, icon, text, details }) => (
            <article className={cx(s['p-card'], id === 'general' && s['p-card--featured'])} key={id} data-reveal>
              <div className={s['p-card__top']}>
                <span className={s['p-card__icon']}><Icon name={icon} /></span>
                <span className={s['p-card__audience']}>{audience}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <ul>{details.map((detail) => <li key={detail}><Icon name="check" size={16} />{detail}</li>)}</ul>
              <a href="#contacto" className={s['p-card__link']}>Pedir información<span className={s['sr-only']}> sobre {title}</span> <Icon name="arrow" size={16} /></a>
            </article>
          ))}
        </CardCarousel>
      </div>
    </section>
  )
}
