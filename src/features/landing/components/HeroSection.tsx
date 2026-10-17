import { commercialNotice, portraits, photos } from '../data/content'
import s from '../landing.module.css'
import { cx } from '../utils'
import { ButtonLink, ContentNote, Icon } from './ui'

export function HeroSection() {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <img className={s.hero__img} src={photos.hero} alt="Grupo de adultos conversando en una cafetería; fotografía ilustrativa" width="1920" height="1280" fetchPriority="high" />
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
          <div className={s.avatars} aria-hidden="true">{portraits.slice(0, 3).map(({ thumbnail }) => <img key={thumbnail} src={thumbnail} alt="" width="42" height="42" />)}</div>
          <p><b>+5,000 alumnos · Cifra ficticia</b><br /><span className={s.stars} aria-hidden="true">★★★★★</span> 4.9 · Valoración de ejemplo</p>
        </div>
        <ContentNote light>{commercialNotice} Fotografías ilustrativas.</ContentNote>
      </div>
      <div className={cx(s.hero__float, s['hero__float--a'])} aria-hidden="true">
        <span className={s['hf-icon']}>🎓</span><div><b>95 % de aprobación</b><small>Cifra ficticia de la propuesta</small></div>
      </div>
      <div className={cx(s.hero__float, s['hero__float--b'])} aria-hidden="true">
        <span className={cx(s['hf-icon'], s['hf-icon--blue'])}>💬</span><div><b>Una clase para conocernos</b><small>Disponibilidad por confirmar</small></div>
      </div>
    </section>
  )
}
