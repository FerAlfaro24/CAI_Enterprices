import { useCommunity } from '../context'
import { challenges } from '../data/fixtures'
import s from './challenges.module.css'

export function ChallengeDemoSelector() {
  const { state, dispatch } = useCommunity()
  return <div className={s.demoDay}>
    <label htmlFor="community-challenge-day">Cambiar día · Solo demo</label>
    <select id="community-challenge-day" value={state.challengeId} onChange={(event) => dispatch({ type: 'challengeDay', id: event.target.value })}>
      {challenges.map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.day} · {challenge.topic}</option>)}
    </select>
    <small>Una pregunta compartida por día. Cambiar de día no borra intentos ni suma puntos.</small>
  </div>
}
