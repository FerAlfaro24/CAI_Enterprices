import { useCommunity } from '../context'
import { challenges } from '../data/fixtures'
import { CommunityIcon } from '../components/ui'
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
      <div><span className={s.eyebrow}><span aria-hidden="true">⚡</span> UN RETO PARA TODA LA COMUNIDAD</span><h1 id="community-title" tabIndex={-1}>¿Listo para poner a prueba tu inglés?</h1><p>Una pregunta al día, sin presión. Todos aprendemos juntos. <span aria-hidden="true">💙</span></p></div>
      <section className={s.streakCard} aria-label="Tu progreso en los retos"><span className={s.streakSymbol} aria-hidden="true">🔥</span><div><strong>{progress.currentStreak} {progress.currentStreak === 1 ? 'día seguido' : 'días seguidos'}</strong><p>{progress.currentStreak ? '¡Cada pequeño paso va formando una serie!' : 'Tu primer intento puede ser hoy.'}</p><small><b>{progress.points}</b> puntos demo · <b>{progress.answeredDays}</b> días respondidos</small></div></section>
    </header>
    <div className={s.challengeGrid}>
      <ChallengeQuestionPanel key={`${challenge.id}-${state.resetKey}`} challenge={challenge} attempt={state.attempts[challenge.id]} />
      <ChallengeRewards attempt={state.attempts[challenge.id]} badges={progress.badges} />
    </div>
    <div className={s.bottomCards}>
      <section className={s.bottomCard}><span className={s.eyebrow}><span aria-hidden="true">🗓️</span> MAÑANA HAY MÁS</span><h2>Vuelve por otro reto.</h2><p>Cada día una pregunta distinta.</p><button type="button" className={s.textButton} onClick={openDemo}>Cambiar día de demo <CommunityIcon name="arrow" size={15} /></button></section>
      <section className={`${s.bottomCard} ${s.consistency}`} aria-labelledby="challenge-consistency-title"><span className={s.eyebrow}><span aria-hidden="true">🔥</span> CONSTANCIA</span><h2 id="challenge-consistency-title">{progress.currentStreak ? `${progress.currentStreak} ${progress.currentStreak === 1 ? 'día' : 'días'} y contando` : 'Un día a la vez.'}</h2><p>Un poquito cada día hace la diferencia.</p><small>Respondidos: {progress.answeredDays}/{progress.totalDays} · Mejor serie: {progress.longestStreak}</small><details className={s.streakRule}><summary>Cómo se calcula la constancia</summary><p>Los días 1 a 5 representan días consecutivos ficticios. La serie cuenta hasta el día seleccionado; si aún no respondes, conserva la que termina el día anterior. Un día sin responder corta la serie. Acertar no es necesario. La mejor serie incluye todos tus intentos, aunque cambies de día.</p></details></section>
      <section className={s.bottomCard}><span className={s.eyebrow}><span aria-hidden="true">👏</span> EN COMUNIDAD</span><h2>¡Hoy también participamos!</h2><p>Comparte tu logro cuando tú quieras.</p><button type="button" className={s.textButton} onClick={() => dispatch({ type: 'section', section: 'home' })}>Volver al feed <CommunityIcon name="arrow" size={15} /></button></section>
    </div>
  </div>
}
