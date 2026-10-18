import { useId, useState, type FormEvent } from 'react'
import { useCommunity } from '../context'
import { challenges } from '../data/fixtures'
import type { Attempt, Challenge } from '../types'
import s from '../community.module.css'
import { CommunityIcon } from './ui'

function ChallengeQuestion({ challenge, attempt }: { challenge: Challenge; attempt: Attempt | undefined }) {
  const { dispatch } = useCommunity()
  const [selected, setSelected] = useState<number | null>(attempt?.answerIndex ?? null)
  const [error, setError] = useState('')
  const id = useId()
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (selected === null) {
      setError('Elige una opción para participar en el reto.')
      event.currentTarget.querySelector<HTMLInputElement>('input[type="radio"]')?.focus()
      return
    }
    dispatch({ type: 'answer', challengeId: challenge.id, answerIndex: selected })
    setError('')
  }
  return (
    <form className={s.challengeForm} onSubmit={submit} aria-label={`Reto ${challenge.day}: ${challenge.topic}`}>
      <fieldset disabled={Boolean(attempt)} aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}>
        <legend>{challenge.question}</legend>
        {challenge.options.map((option, index) => <label className={[s.challengeOption, attempt && index === challenge.correctIndex ? s.correctOption : ''].join(' ')} key={option}>
          <input type="radio" name={id} value={index} checked={selected === index} onChange={() => { setSelected(index); setError('') }} />
          <span>{option}</span>{attempt && index === challenge.correctIndex && <CommunityIcon name="check" size={16} />}
        </label>)}
      </fieldset>
      <p className={s.challengeHelp} id={`${id}-help`}>+5 por participar · +10 por acertar<br />Sin tiempo límite ni penalizaciones.</p>
      {error && <p className={s.fieldError} id={`${id}-error`} role="alert">{error}</p>}
      {!attempt && <button className={s.primaryButton} type="submit">Probar mi respuesta <CommunityIcon name="arrow" size={16} /></button>}
      <div role="status" aria-live="polite" aria-atomic="true">
        {attempt && <div className={[s.challengeResult, attempt.correct ? s.correctResult : s.learningResult].join(' ')}>
          <strong>{attempt.correct ? '¡Respuesta correcta!' : 'Respuesta incorrecta. ¡Gracias por intentarlo!'}</strong>
          {!attempt.correct && <p>La respuesta correcta es: <b>{challenge.options[challenge.correctIndex]}</b></p>}
          <p>{challenge.explanation}</p>
          <span>+{attempt.points} puntos ficticios · {attempt.correct ? '5 por participar y 10 por acertar' : '5 por participar'}</span>
        </div>}
      </div>
    </form>
  )
}

export function DailyChallenge({ expanded = false }: { expanded?: boolean }) {
  const { state, dispatch } = useCommunity()
  const challenge = challenges.find((item) => item.id === state.challengeId) ?? challenges[0]!
  const days = Object.keys(state.attempts).length
  const points = Object.values(state.attempts).reduce((total, attempt) => total + attempt.points, 0)
  const selector = useId()
  return (
    <section className={[s.challengeCard, expanded ? s.expandedChallenge : ''].join(' ')} aria-label="Reto del día compartido">
      <div className={s.challengeHeading}><span className={s.challengeSymbol} aria-hidden="true">✦</span><div><span className={s.eyebrow}>UN RETO PARA TODOS</span><h2>El pequeño paso de hoy</h2></div></div>
      <p className={s.challengeIntro}>La misma pregunta para toda la comunidad. Aprendemos juntos, a nuestro ritmo.</p>
      <div className={s.daySelector}><label htmlFor={selector}>Cambiar día · Solo demo</label><select id={selector} value={challenge.id} onChange={(event) => dispatch({ type: 'challengeDay', id: event.target.value })}>{challenges.map((item) => <option key={item.id} value={item.id}>{item.day} · {item.topic}</option>)}</select></div>
      <ChallengeQuestion key={`${challenge.id}-${state.resetKey}`} challenge={challenge} attempt={state.attempts[challenge.id]} />
      <div className={s.challengeProgress}><span><b>{points}</b> puntos demo</span><span><b>{days}</b> {days === 1 ? 'día simulado' : 'días simulados'}</span></div>
      {days > 0 && <div className={s.consistencyBadge}><CommunityIcon name="award" size={19} /><span>{days >= 3 ? 'Constancia que inspira' : 'El primer paso ya cuenta'}<small>{days >= 3 ? 'Participaste en tres o más días de muestra.' : 'Celebramos que te hayas animado a participar.'}</small></span></div>}
    </section>
  )
}
