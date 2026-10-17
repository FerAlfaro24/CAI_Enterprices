import emblem from '../../../assets/cai/logo-cai-emblema.svg'
import { milestones, photos } from '../data/content'
import s from '../landing.module.css'
import { cx } from '../utils'
import { ButtonLink, ContentNote } from './ui'

export function HistorySection() {
  return (
    <section className={s.feature} id="trayectoria" aria-labelledby="history-title">
      <div className={cx(s.container, s.feature__grid)}>
        <div className={s.feature__text} data-reveal>
          <span className={s.eyebrow}>Nuestra trayectoria · Muestra</span>
          <h2 id="history-title">Más de 15 años formando personas que se comunican en inglés</h2>
          <ContentNote>Historia y fechas ficticias tomadas del diseño original para validar su presentación. La trayectoria real está pendiente de confirmación.</ContentNote>
          <p>La propuesta de CAI combina conversación real, gramática aplicada y seguimiento personalizado. Una manera de aprender que conecta el inglés con los objetivos de cada persona.</p>
          <ol className={s.timeline}>{milestones.map(({ year, text }) => <li key={year}><b>{year}</b> {text}</li>)}</ol>
          <ButtonLink href="#contacto">Conoce CAI</ButtonLink>
        </div>
        <div className={s.feature__media} data-reveal>
          <div className={cx(s['media-card'], s['media-card--blue'])}>
            <img src={photos.meeting} alt="Adultos compartiendo ideas en una reunión; fotografía ilustrativa ajena a CAI" width="1000" height="750" loading="lazy" decoding="async" />
            <div className={s.seal}><img src={emblem} alt="CAI" width="150" height="140" /><span>2010 · Ejemplo</span></div>
          </div>
        </div>
      </div>
    </section>
  )
}
