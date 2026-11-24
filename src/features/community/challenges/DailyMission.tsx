import type { ChallengeSnapshot } from '../../../../server/contracts'
import { dailyPractice,practiceAreas } from '../../../../shared/challenge-practice'
import { MotionButton } from '../components/CommunityMotion'
import { CommunityIcon } from '../components/ui'
import s from './challenges.module.css'

export function DailyMission({data,selectedId,onSelect}:{data:ChallengeSnapshot;selectedId?:string;onSelect:(id:string)=>void}) {
  const {progress}=data,today=dailyPractice(data.items)
  return <section className={s.mission} aria-label="Tu progreso en los retos">
    <div className={s.missionTop}><span className={s.sectionKicker}>TU PRÁCTICA DE HOY</span><span className={s.streakPill}><CommunityIcon name="spark" size={15}/>{progress.currentStreak} {progress.currentStreak===1?'día seguido':'días seguidos'}</span></div>
    <div className={s.score}><span className={s.scoreStar} aria-hidden="true">✦</span><div><strong key={today.points}>{today.points.toLocaleString('es-MX')}</strong><span>puntos de hoy · hasta 45</span></div></div>
    <p className={s.totalPoints}>Tu acumulado: <b>{progress.points.toLocaleString('es-MX')} puntos</b></p>
    <div className={s.missionProgress}><strong>Actividades completadas</strong><span>{progress.todayAnswered} de 3</span></div>
    <div className={s.progressTrack} role="progressbar" aria-label="Preguntas completadas hoy" aria-valuemin={0} aria-valuemax={3} aria-valuenow={progress.todayAnswered} aria-valuetext={`${progress.todayAnswered} de 3 respondidas; ${today.correct} aciertos; ${today.review} para repasar`}><span style={{width:`${Math.min(3,progress.todayAnswered)/3*100}%`}}/></div>
    <nav className={s.missionPath} aria-label="Preguntas de hoy">{data.items.map(question=><MotionButton type="button" key={question.id} onClick={()=>onSelect(question.id)} aria-current={question.id===selectedId?'step':undefined} data-completed={Boolean(question.attempt)} data-result={question.attempt?(question.attempt.correct?'correct':'incorrect'):'pending'} aria-label={`Pregunta ${question.slot+1}: ${question.topic}${question.attempt?(question.attempt.correct?' · Respuesta correcta':' · Respuesta incorrecta'):' · Sin responder'}`}>
      <span>{question.attempt?<CommunityIcon name={question.attempt.correct?'check':'close'} size={23}/>:question.slot+1}</span><small>{practiceAreas[question.slot]}</small><small>{question.attempt?(question.attempt.correct?'Acertaste':'Para repasar'):'Por responder'}</small>
    </MotionButton>)}</nav>
    <p>Responder completa una actividad. Acertar suma un extra.</p>
  </section>
}
