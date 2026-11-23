import type { ChallengeSnapshot } from '../../../../server/contracts'
import { MotionButton } from '../components/CommunityMotion'
import { CommunityIcon } from '../components/ui'
import s from './challenges.module.css'

export function DailyMission({ data, selectedId, onSelect }: {
  data: ChallengeSnapshot
  selectedId?: string
  onSelect: (id: string) => void
}) {
  const { progress } = data
  return <section className={s.mission} aria-label="Tu progreso en los retos">
    <div className={s.missionTop}><span className={s.sectionKicker}>CADA PASO SUMA</span><span className={s.streakPill}><CommunityIcon name="spark" size={15} /> {progress.currentStreak} {progress.currentStreak === 1 ? 'día seguido' : 'días seguidos'}</span></div>
    <div className={s.score}><span className={s.scoreStar} aria-hidden="true">✦</span><div><strong key={progress.points}>{progress.points.toLocaleString('es-MX')}</strong><span>puntos que cuentan tu historia</span></div></div>
    <div className={s.missionProgress}><strong>Tu misión de hoy</strong><span>{progress.todayAnswered} de 3</span></div>
    <div className={s.progressTrack} role="progressbar" aria-label="Preguntas completadas hoy" aria-valuemin={0} aria-valuemax={3} aria-valuenow={progress.todayAnswered}><span style={{ width: `${Math.min(3, progress.todayAnswered) / 3 * 100}%` }} /></div>
    <nav className={s.missionPath} aria-label="Preguntas de hoy">{data.items.map(question => <MotionButton type="button" key={question.id} onClick={() => onSelect(question.id)} aria-current={question.id === selectedId ? 'step' : undefined} data-completed={Boolean(question.attempt)} data-result={question.attempt?(question.attempt.correct?'correct':'incorrect'):'pending'} aria-label={`Pregunta ${question.slot + 1}: ${question.topic}${question.attempt ? (question.attempt.correct?' · Respuesta correcta':' · Respuesta incorrecta') : ' · Sin responder'}`}>
      <span>{question.attempt ? <CommunityIcon name={question.attempt.correct?"check":"close"} size={23} /> : question.slot + 1}</span><small>{['Gramática', 'Vocabulario', 'Vida diaria'][question.slot]}</small>
    </MotionButton>)}</nav>
    <p>Completa las tres a tu ritmo. Cada intento cuenta.</p>
  </section>
}
