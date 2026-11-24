import { useEffect, useId, useRef, useState } from 'react'
import { m } from 'motion/react'
import { MotionButton } from '../components/CommunityMotion'
import { useCommunityReducedMotion } from '../components/useCommunityReducedMotion'
import type { Attempt, Challenge } from '../types'
import { CommunityIcon } from '../components/ui'
import { useChallengeAnswer } from './useChallengeAnswer'
import s from './challenges.module.css'
import { useCommunity } from '../context'
import { CelebrationBurst } from '../components/CelebrationBurst'

export function ChallengeQuestionPanel({ challenge, attempt, expired = false, activityLabel }: { challenge: Challenge; attempt: Attempt | undefined; expired?: boolean;activityLabel?:string }) {
  const { connection }=useCommunity()
  const { selected, error, choose, submit,pending,unavailable } = useChallengeAnswer(challenge, attempt, expired)
  const id = useId()
  const reduced = useCommunityReducedMotion()
  const result = useRef<HTMLDivElement>(null)
  const [submittedHere,setSubmittedHere] = useState(false)
  const [alreadyAnswered] = useState(Boolean(attempt))
  useEffect(() => {
    if (attempt && submittedHere) result.current?.focus()
  }, [attempt,submittedHere])

  return <section className={s.questionPanel} aria-label="Reto del día compartido">
    <form className={s.questionForm} aria-label={`Reto ${challenge.day}: ${challenge.topic}`} onSubmit={(event) => { setSubmittedHere(selected !== null); void submit(event) }}>
      <div className={s.questionMeta}><span>{activityLabel??challenge.day} · {challenge.topic}</span><span>{attempt ? `+${attempt.points} PUNTOS OBTENIDOS` : 'HASTA +15 PUNTOS'}</span></div>
      <fieldset disabled={Boolean(attempt)||pending||unavailable} aria-describedby={`${id}-intro ${id}-help${error ? ` ${id}-error` : ''}`}>
        <legend>{challenge.question}</legend>
        <p className={s.questionIntro} id={`${id}-intro`}>{attempt ? 'Este reto ya está completado. Aquí puedes revisar tu respuesta y lo que aprendiste.' : `${challenge.instruction??'Una opción es correcta.'} Toca la que te suene mejor.`}</p>
        <div className={s.options}>
          {challenge.options.map((option, index) => {
            const correct = Boolean(attempt) && index === challenge.correctIndex
            const wrong = attempt ? index === attempt.answerIndex && !attempt.correct : false
            const chosen = index === selected
            return <m.label className={[s.option, chosen ? s.selected : '', correct ? s.correct : '', wrong ? s.incorrect : ''].join(' ')} key={option} whileTap={attempt || reduced ? undefined : { scale: .99 }}>
              <input type="radio" name={id} aria-label={option} checked={chosen} onChange={() => choose(index)} />
              <span className={s.optionLetter} aria-hidden="true">{String.fromCharCode(65 + index)}</span>
              <span className={s.optionText}>{option}</span>
              <span className={s.optionState} aria-hidden="true">{correct ? '✓ Correcta' : wrong ? '✕ Tu respuesta' : chosen ? '✓ Elegida' : '\u00a0'}</span>
            </m.label>
          })}
        </div>
      </fieldset>
      {error && <p className={s.error} id={`${id}-error`} role="alert">{error}</p>}
      <div className={s.checkRow}>
        {attempt ? <span className={s.completed} data-result={attempt.correct?'correct':'incorrect'}><CommunityIcon name={attempt.correct?"check":"close"} size={17} /> {attempt.correct?'Respondida · acierto':'Respondida · para repasar'}</span> : <MotionButton type="submit" disabled={pending||unavailable} className={s.checkButton}>{pending?'Guardando…':'¡Comprobar!'} <CommunityIcon name="arrow" size={17} /></MotionButton>}
        <p id={`${id}-help`}>{expired?'El día cambió. Actualiza antes de responder.':'Un intento por pregunta. Sin límite de tiempo.'}</p>
      </div>
      {attempt && <m.div ref={result} className={s.result} data-result={attempt.correct ? 'correct' : 'incorrect'} tabIndex={-1} role="status" aria-live="polite" aria-atomic="true" initial={{ opacity: reduced ? 1 : .65 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : .2 }}>
        {attempt.correct && !alreadyAnswered && submittedHere && <CelebrationBurst />}
        <span className={s.resultPoints}><b>+{attempt.points}</b><small>puntos guardados{connection?'':' en la demo'}</small></span>
        <strong>{attempt.correct ? '✓ ¡Respuesta correcta!' : '✕ Respuesta incorrecta. ¡Gracias por intentarlo!'}</strong>
        {!attempt.correct && <p>La respuesta correcta es: <b>{challenge.options[challenge.correctIndex]}</b></p>}
        <p>{challenge.explanation}</p>
        {challenge.example&&<p><b>Otro ejemplo:</b> {challenge.example}</p>}
        <span>+{attempt.points} puntos{connection?'':' ficticios'} · {attempt.correct ? '5 por participar y 10 por acertar' : '5 por participar, sin penalizaciones'}</span>
        <small>{connection?'Tu respuesta está guardada. Puedes repasarla cuando quieras, sin volver a sumar puntos.':'Este reto ya está registrado en la demo. No volverá a sumar puntos.'}</small>
      </m.div>}
    </form>
  </section>
}
