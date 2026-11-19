import { commercialNotice } from '../data/content'
import { photos } from '../data/photos'
import s from '../landing.module.css'
import { cx } from '../utils'
import { ButtonLink, ContentNote, Icon } from './ui'

export function HeroSection() {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <img className={s.hero__img} src={photos.hero} alt="Taza de CAI con lápices, plumas y materiales de estudio." width="1080" height="1080" fetchPriority="high" />
      <div className={s.hero__overlay} aria-hidden="true" />
      <div className={cx(s.container, s.hero__content)}>
        <span className={s.hero__chip}><span className={s.dot} aria-hidden="true" /> Una nueva etapa para aprender · Prototipo</span>
        <h1 id="hero-title">Habla inglés con <span className={s.hl}>confianza</span> y abre nuevas oportunidades</h1>
        <p>En CAI queremos acompañarte desde tu primera palabra hasta tus nuevas metas. Una propuesta de clases dinámicas para niños, jóvenes, adultos y empresas.</p>
        <div className={s.hero__ctas}>
          <ButtonLink href="#contacto" large>Explora tu clase muestra <Icon name="arrow" size={18} /></ButtonLink>
          <ButtonLink href="#programas" variant="light" large>Ver programas</ButtonLink>
        </div>
        <div className={s.hero__proof}>
          <span className={s['hf-icon']} aria-hidden="true"><Icon name="book" size={24} /></span>
          <p><b>Conoce el espacio de CAI</b><br />Materiales, práctica y comunidad</p>
        </div>
        <ContentNote light>{commercialNotice} Fotografía oficial de CAI.</ContentNote>
      </div>
      <div className={cx(s.hero__float, s['hero__float--a'])} aria-hidden="true">
        <span className={s['hf-icon']}><Icon name="award" size={22} /></span><div><b>Un espacio para aprender</b><small>Conoce CAI desde dentro</small></div>
      </div>
      <div className={cx(s.hero__float, s['hero__float--b'])} aria-hidden="true">
        <span className={cx(s['hf-icon'], s['hf-icon--blue'])}><Icon name="chat" size={22} /></span><div><b>Una clase para conocernos</b><small>Disponibilidad por confirmar</small></div>
      </div>
    </section>
  )
}
