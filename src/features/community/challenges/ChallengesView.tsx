import { useCommunity } from '../context'
import { challenges } from '../data/fixtures'
import { CommunityIcon } from '../components/ui'
import { MotionButton, MotionFeedback } from '../components/CommunityMotion'
import { BadgeArtwork } from '../achievements/BadgeArtwork'
import { BadgeUnlockNotice } from '../achievements/BadgeUnlockNotice'
import { ChallengeQuestionPanel } from './ChallengeQuestionPanel'
import { ChallengeRewards } from './ChallengeRewards'
import { selectChallengeProgress } from './progress'
import s from './challenges.module.css'

export function ChallengesView() {
  const { state, dispatch } = useCommunity()
  const challenge = challenges.find((item) => item.id === state.challengeId) ?? challenges[0]!
  const progress = selectChallengeProgress(state)
  const openDemo = () => {
    const details = document.getElementById('community-demo-controls')
    if (details instanceof HTMLDetailsElement) details.open = true
    document.getElementById('community-challenge-day')?.focus()
  }
  return <div className={s.challenges}>
    <header className={s.pageHeading}>
      <div><span className={s.eyebrow}><CommunityIcon name="spark" size={18} /> UN RETO PARA TODA LA COMUNIDAD</span><h1 id="community-title" tabIndex={-1}>¿Listo para poner a prueba <em>tu inglés?</em></h1><p>Una pregunta al día, sin presión. Todos aprendemos juntos.</p></div>
      <section className={s.streakCard} aria-label="Tu progreso en los retos"><BadgeArtwork badgeId="three-consecutive" symbol="" className={s.streakSymbol} /><div><span className={s.sectionKicker}>TU RITMO, TUS PASOS</span><strong>{progress.currentStreak} {progress.currentStreak === 1 ? 'día seguido' : 'días seguidos'}</strong><p>{progress.currentStreak ? '¡Cada pequeño paso va formando una serie!' : 'Tu primer intento puede ser hoy.'}</p><small><MotionFeedback key={progress.points}><b>{progress.points}</b> puntos demo</MotionFeedback> · <b>{progress.answeredDays}</b> días respondidos</small></div><div className={s.dayTrack} role="group" aria-label="Recorrido de cinco días ficticios"><span>RECORRIDO · SOLO DEMO</span>{challenges.map((item, index) => <MotionButton type="button" key={item.id} onClick={() => dispatch({ type: 'challengeDay', id: item.id })} aria-label={`Ir al ${item.day} · Demo${state.attempts[item.id] ? ' · Respondido' : ''}`} aria-current={item.id === challenge.id ? 'step' : undefined} data-completed={Boolean(state.attempts[item.id])}>{state.attempts[item.id] ? <CommunityIcon name="check" size={16} /> : index + 1}</MotionButton>)}</div></section>
    </header>
    <div className={s.challengeGrid}>
      <ChallengeQuestionPanel key={`${challenge.id}-${state.resetKey}`} challenge={challenge} attempt={state.attempts[challenge.id]} />
      <ChallengeRewards attempt={state.attempts[challenge.id]} badges={progress.badges} />
    </div>
    <div className={s.bottomCards}>
      <section className={s.bottomCard}><span className={s.eyebrow}><CommunityIcon name="book" size={17} /> MAÑANA HAY MÁS</span><h2>Vuelve por otro reto.</h2><p>Cada día una pregunta distinta.</p><MotionButton type="button" className={s.textButton} onClick={openDemo}>Cambiar día de demo <CommunityIcon name="arrow" size={15} /></MotionButton></section>
      <section className={`${s.bottomCard} ${s.consistency}`} aria-labelledby="challenge-consistency-title"><span className={s.eyebrow}><CommunityIcon name="spark" size={17} /> CONSTANCIA</span><h2 id="challenge-consistency-title">{progress.currentStreak ? `${progress.currentStreak} ${progress.currentStreak === 1 ? 'día' : 'días'} y contando` : 'Un día a la vez.'}</h2><p>Un poquito cada día hace la diferencia.</p><small>Respondidos: {progress.answeredDays}/{progress.totalDays} · Mejor serie: {progress.longestStreak}</small><details className={s.streakRule}><summary>Cómo se calcula la constancia</summary><p>Los días 1 a 5 representan días consecutivos ficticios. La serie cuenta hasta el día seleccionado; si aún no respondes, conserva la que termina el día anterior. Un día sin responder corta la serie. Acertar no es necesario. La mejor serie incluye todos tus intentos, aunque cambies de día.</p></details></section>
      <section className={s.bottomCard}><span className={s.eyebrow}><CommunityIcon name="users" size={17} /> EN COMUNIDAD</span><h2>¡Hoy también participamos!</h2><p>Comparte tu logro cuando tú quieras.</p><MotionButton type="button" className={s.textButton} onClick={() => dispatch({ type: 'section', section: 'home' })}>Volver al feed <CommunityIcon name="arrow" size={15} /></MotionButton></section>
    </div>
    <BadgeUnlockNotice />
  </div>
}
