import { useCommunity } from '../context'
import { MotionButton } from '../components/CommunityMotion'
import { CommunityIcon } from '../components/ui'
import s from './home.module.css'

export function HomeActivityStrip() {
  const { connection, dispatch } = useCommunity()
  if (!connection) return null
  const { progress } = connection.challenges
  const badges = connection.badges.grants.filter(grant => grant.status === 'active').length
  return <section className={s.activityStrip} aria-label="Mis pequeños grandes pasos">
    <div><span className={s.sectionEyebrow}>A TU RITMO</span><strong>Tus pequeños<br />grandes pasos.</strong></div>
    <MotionButton type="button" onClick={() => dispatch({ type: 'section', section: 'challenges' })}><span className={s.activitySymbol} aria-hidden="true">✦</span><span><b>{progress.points.toLocaleString('es-MX')}</b><small>puntos acumulados</small></span></MotionButton>
    <MotionButton type="button" onClick={() => dispatch({ type: 'section', section: 'challenges' })}><span className={s.activitySymbol}><CommunityIcon name="check" size={22} /></span><span><b>{progress.todayAnswered}/3</b><small>preguntas de hoy</small></span></MotionButton>
    <MotionButton type="button" onClick={() => dispatch({ type: 'section', section: 'achievements' })}><span className={s.activitySymbol}><CommunityIcon name="award" size={23} /></span><span><b>{badges}</b><small>{badges === 1 ? 'insignia conseguida' : 'insignias conseguidas'}</small></span></MotionButton>
  </section>
}
