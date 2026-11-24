import type {ChallengeSnapshot} from '../../../../server/contracts'
import {dailyPractice,practiceAreas} from '../../../../shared/challenge-practice'
import {CelebrationBurst} from '../components/CelebrationBurst'
import {CommunityIcon} from '../components/ui'
import s from './challenges.module.css'

export function DailyPracticeSummary({data,celebrate,onSelect}:{data:ChallengeSnapshot;celebrate:boolean;onSelect:(id:string)=>void}) {
 const today=dailyPractice(data.items),select=onSelect
 return <section className={s.finished} aria-label="Resultado de tu práctica de hoy" data-perfect={today.correct===3}>
   {celebrate&&<CelebrationBurst/>}<span className={s.finishMedal} aria-hidden="true">✦</span><div className={s.finishedContent}><span className={s.sectionKicker}>TRES ACTIVIDADES. UN GRAN PASO.</span><h2>¡Por hoy, misión cumplida!</h2><p>{today.correct===3?'¡Tres aciertos! Guarda lo aprendido y vuelve mañana.':`${today.correct} ${today.correct===1?'acierto':'aciertos'} y ${today.review} ${today.review===1?'actividad para repasar':'actividades para repasar'}. Completar también cuenta; ahora puedes reforzar lo que te costó.`}</p><strong>+{today.points} puntos de práctica hoy</strong>
    <div className={s.dailyResults} role="group" aria-label="Resultados de las tres actividades">{data.items.map(item=><button type="button" key={item.id} data-result={item.attempt?.correct?'correct':'incorrect'} onClick={()=>select(item.id)}><span aria-hidden="true">{item.attempt?.correct?'✓':'✕'}</span><b>{practiceAreas[item.slot]}</b><small>{item.attempt?.correct?'Acierto':'Para repasar'} · +{item.attempt?.points??0}</small></button>)}</div>
    {today.reviewId&&<button type="button" className={s.textButton} onClick={()=>select(today.reviewId!)}>{today.review?'Repasar lo que me costó':'Revisar mis tres respuestas'} <CommunityIcon name="arrow" size={17}/></button>}
   </div></section>
}
