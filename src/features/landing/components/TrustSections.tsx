import { certifications, statistics } from '../data/content'
import s from '../landing.module.css'
import { cx } from '../utils'
import { ContentNote } from './ui'

export function CertificationStrip() {
  return (
    <section className={s.trust} aria-label="Áreas de preparación propuestas, pendientes de validación">
      <div className={cx(s.container, s.trust__inner)}>
        <p>Preparación propuesta para tus próximas metas</p>
        <ul>{certifications.map((name) => <li key={name}>{name}</li>)}</ul>
      </div>
    </section>
  )
}

export function StatisticsSection() {
  return (
    <section className={s.statline} aria-labelledby="statistics-title">
      <div className={s.container}>
        <ContentNote light>Cifras ficticias de la referencia original · No representan resultados verificados de CAI.</ContentNote>
        <h2 id="statistics-title" data-reveal>9 de cada 10 alumnos suben un nivel en su primer ciclo: así se presenta la propuesta</h2>
        <div className={s.stats}>
          {statistics.map(({ value, suffix, label }) => (
            <div className={s.stat} key={label} data-reveal>
              <strong><span aria-hidden="true" data-count={value}>{value.toLocaleString('es-MX')}</span><span className={s['sr-only']}>{value.toLocaleString('es-MX')}</span></strong><span>{suffix}</span>
              <p>{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
