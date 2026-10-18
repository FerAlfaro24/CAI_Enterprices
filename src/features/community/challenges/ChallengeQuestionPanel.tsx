import { useEffect, useId, useRef } from 'react'
import type { Attempt, Challenge } from '../types'
import { CommunityIcon } from '../components/ui'
import { useChallengeAnswer } from './useChallengeAnswer'
import s from './challenges.module.css'

export function ChallengeQuestionPanel({ challenge, attempt }: { challenge: Challenge; attempt: Attempt | undefined }) {
  const { selected, error, choose, submit } = useChallengeAnswer(challenge, attempt)
  const id = useId()
  const result = useRef<HTMLDivElement>(null)
  const submittedHere = useRef(false)
  useEffect(() => {
    if (attempt && submittedHere.current) result.current?.focus()
  }, [attempt])

  return <section className={s.questionPanel} aria-label="Reto del día compartido">
    <form className={s.questionForm} aria-label={`Reto ${challenge.day}: ${challenge.topic}`} onSubmit={(event) => { submittedHere.current = selected !== null; submit(event) }}>
      <div className={s.questionMeta}><span>{challenge.day} · {challenge.topic}</span><span>{attempt ? `+${attempt.points} PUNTOS OBTENIDOS` : 'HASTA +15 PUNTOS'}</span></div>
      <fieldset disabled={Boolean(attempt)} aria-describedby={`${id}-intro ${id}-help${error ? ` ${id}-error` : ''}`}>
        <legend>{challenge.question}</legend>
        <p className={s.questionIntro} id={`${id}-intro`}>{attempt ? 'Este reto ya está completado. Aquí puedes revisar tu respuesta y lo que aprendiste.' : 'Una opción es correcta. Toca la que te suene mejor.'}</p>
        <div className={s.options}>
          {challenge.options.map((option, index) => {
            const correct = Boolean(attempt) && index === challenge.correctIndex
            const wrong = attempt ? index === attempt.answerIndex && !attempt.correct : false
            const chosen = index === selected
            return <label className={[s.option, chosen ? s.selected : '', correct ? s.correct : '', wrong ? s.incorrect : ''].join(' ')} key={option}>
              <input type="radio" name={id} aria-label={option} checked={chosen} onChange={() => choose(index)} />
              <span className={s.optionLetter} aria-hidden="true">{String.fromCharCode(65 + index)}</span>
              <span className={s.optionText}>{option}</span>
              {(correct || wrong || chosen) && <span className={s.optionState} aria-hidden="true">{correct ? '✓ Correcta' : wrong ? '✕ Tu respuesta' : '✓ Elegida'}</span>}
            </label>
          })}
        </div>
      </fieldset>
      {error && <p className={s.error} id={`${id}-error`} role="alert">{error}</p>}
      <div className={s.checkRow}>
        {attempt ? <span className={s.completed}><CommunityIcon name="check" size={17} /> Reto ya completado</span> : <button type="submit" className={s.checkButton}>¡Comprobar! <CommunityIcon name="arrow" size={17} /></button>}
        <p id={`${id}-help`}>Sin reloj. Sin castigos. Solo aprender.</p>
      </div>
      {attempt && <div ref={result} className={s.result} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true">
        <strong>{attempt.correct ? '✓ ¡Respuesta correcta!' : '✕ Respuesta incorrecta. ¡Gracias por intentarlo!'}</strong>
        {!attempt.correct && <p>La respuesta correcta es: <b>{challenge.options[challenge.correctIndex]}</b></p>}
        <p>{challenge.explanation}</p>
        <span>+{attempt.points} puntos ficticios · {attempt.correct ? '5 por participar y 10 por acertar' : '5 por participar, sin penalizaciones'}</span>
        <small>Este reto ya está registrado en la demo. No volverá a sumar puntos.</small>
      </div>}
    </form>
  </section>
}
