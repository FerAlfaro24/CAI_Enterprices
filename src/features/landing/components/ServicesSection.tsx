import emblem from '../../../assets/cai/logo-cai-emblema.svg'
import { services } from '../data/content'
import s from '../landing.module.css'
import { cx } from '../utils'
import { ButtonLink, ContentNote, Icon } from './ui'

function LearningPreview() {
  return (
    <div className={s.mock} aria-label="Ilustración ficticia de una posible experiencia de aprendizaje; no es una función disponible">
      <div className={s.mock__head}><span className={s.mock__logo}><img src={emblem} alt="" width="30" height="30" /></span><h3>Mi progreso</h3></div>
      <ContentNote light>Vista ilustrativa · Datos ficticios · Función futura por validar</ContentNote>
      <div className={s.mock__body}>
        <div className={s.mock__row}>
          <div className={s.ring}><span>72%</span></div>
          <div><p className={s.mock__label}>Nivel de muestra</p><p className={s.mock__title}>B1 · Intermediate</p><div className={s.chips}><span className={cx(s.chip, s['chip--ok'])}>Speaking ✓</span><span className={cx(s.chip, s['chip--ok'])}>Listening ✓</span><span className={s.chip}>Writing</span></div></div>
        </div>
        <div className={s.mock__card}><p className={s.mock__label}>Ejemplo de clase</p><p className={s.mock__title}>Conversation Club: Travel &amp; Culture</p><p className={s.mock__meta}>Jueves · 6:00 pm · Docente de muestra</p></div>
        <div className={s.mock__card}><p className={s.mock__label}>Práctica ilustrativa</p><p className={s.mock__q}>“I ____ to London last summer.”</p><div className={s.mock__answers}><span className={cx(s.ans, s['ans--bad'])}>✕ go</span><span className={cx(s.ans, s['ans--good'])}>✓ went</span></div></div>
      </div>
    </div>
  )
}

export function ServicesSection() {
  return (
    <section className={s.feature} id="servicios" aria-labelledby="services-title">
      <div className={cx(s.container, s.feature__grid, s['feature__grid--reverse'])}>
        <div className={s.feature__media} data-reveal><LearningPreview /></div>
        <div className={s.feature__text} data-reveal>
          <span className={s.eyebrow}>Servicios</span>
          <h2 id="services-title">Todo lo que necesitas para dominar el inglés</h2>
          <p>Una propuesta según tu edad, tu objetivo y tu ritmo. Tú pones las ganas; juntos trazamos el camino.</p>
          <ContentNote>Servicios y metodología propuestos; su disponibilidad requiere confirmación.</ContentNote>
          <ul className={s['icon-list']}>{services.map(({ icon, title, text }) => <li key={title}><span className={s.icon}><Icon name={icon} /></span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ul>
          <ButtonLink href="#contacto">Explora la propuesta</ButtonLink>
        </div>
      </div>
    </section>
  )
}
