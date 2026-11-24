import { dailyPractice,practiceAreas,practiceDateLabel } from '../../../../shared/challenge-practice'
import { useDailyRenewal } from './useDailyRenewal'
import { useRef,useState } from 'react'
import type { DailyQuestion } from '../../local-access/api'
import type { CommunityConnection } from '../connection'
import { CommunityIcon } from '../components/ui'
import { MotionButton } from '../components/CommunityMotion'
import { ChallengeQuestionPanel } from './ChallengeQuestionPanel'
import { ConnectedChallengeRewards } from './ChallengeRewards'
import { DailyMission } from './DailyMission'
import { DailyPracticeSummary } from './DailyPracticeSummary'
import { PracticeHistory } from './PracticeHistory'
import s from './challenges.module.css'

function adapter(q:DailyQuestion){return {...q,correctIndex:q.attempt?.correctIndex??-1,explanation:q.attempt?.explanation??'',example:q.attempt?.example??''}}
export function ConnectedChallengesView({connection}:{connection:CommunityConnection}) {
 const {challenges:data}=connection,progress=data.progress,today=dailyPractice(data.items)
 const [selection,setSelection]=useState(()=>today.nextId??data.items[0]?.id??'')
 const question=data.items.find(q=>q.id===selection)??data.items.find(q=>!q.attempt)??data.items[0]
 const next=data.items.find(q=>!q.attempt&&q.id!==question?.id)
 const [initialCompleted]=useState(progress.todayAnswered),[updating,setUpdating]=useState(false)
 const renewing=useRef(false),renewal=useDailyRenewal(data.serverTime,data.nextRefreshAt)
 const select=(id:string)=>{setSelection(id);requestAnimationFrame(()=>{const panel=document.getElementById('daily-question');panel?.focus();panel?.scrollIntoView({block:'start',behavior:'instant'})})}
 const refresh=async()=>{if(renewing.current||connection.busy)return;renewing.current=true;setUpdating(true);try{await connection.refresh()}finally{renewing.current=false;setUpdating(false)}}
 return <div className={`${s.challenges} ${s.connected}`}>
  <header className={s.pageHeading}><div><span className={s.eyebrow}><CommunityIcon name="spark" size={18}/> UN POQUITO CADA DÍA</span><h1 id="community-title" tabIndex={-1}>Pequeños retos.<br/><em>Inglés que se queda.</em></h1><p>Tres actividades de inglés: gramática, vocabulario y vida diaria. El mismo conjunto para toda la comunidad; tus respuestas y tu progreso son privados.</p>
   <div className={s.renewal} role="region" aria-label="Renovación de los retos"><span className={s.sectionKicker}>{practiceDateLabel(data.day)}</span><strong>Próximos retos: {renewal.label.toLowerCase()}</strong><p>Se renuevan a medianoche, hora de Ciudad de México, aunque estés en otra zona horaria.</p><button type="button" className={s.textButton} disabled={updating||connection.busy} onClick={()=>{void refresh()}}>{updating?'Actualizando…':'Actualizar mis retos'}</button></div>
   <details className={s.howItWorks}><summary>¿Cómo funcionan las tres actividades?</summary><ol><li>Elige una actividad del recorrido y responde una vez.</li><li>Sumas 5 puntos por intentarlo y 10 extra si aciertas: hasta 45 al día.</li><li>Lee la explicación. Repasar no cambia tu respuesta ni vuelve a sumar puntos.</li></ol><p>Completar las tres cuenta como un día de práctica, aunque haya errores. Los temas pueden reaparecer en otros contextos para reforzar lo aprendido. Es práctica de inglés, no una calificación de tu curso.</p></details>
  </div><DailyMission data={data} selectedId={question?.id} onSelect={select}/></header>
  {!data.enabled&&<p className={s.error} role="status">Coordinación pausó los retos. Puedes seguir repasando tus respuestas guardadas.</p>}
  {renewal.expired&&<p className={s.renewal} role="status">Ya cambió el día de práctica. Actualiza tus retos para ver las nuevas actividades; tu progreso está guardado.</p>}
  {progress.todayAnswered===3&&<DailyPracticeSummary data={data} celebrate={initialCompleted<3} onSelect={select}/>}
  <div className={s.challengeGrid}><div id="daily-question" role="region" aria-label="Actividad seleccionada" tabIndex={-1} className={s.questionStage}>{question?<><p className={s.activeActivity}>{practiceAreas[question.slot]} · Actividad {question.slot+1} de 3 · {question.attempt?'Tu respuesta guardada':'Elige una opción y compruébala'}</p><ChallengeQuestionPanel key={question.id+'-'+question.revision} challenge={adapter(question)} attempt={question.attempt??undefined} expired={renewal.expired} activityLabel={practiceAreas[question.slot]}/>{question.previousGroup&&<p className={s.questionIntro}>Este resultado pertenece a tu práctica anterior. Se conserva en tu recorrido.</p>}{question.attempt&&next&&<MotionButton type="button" className={`${s.checkButton} ${s.nextQuestion}`} disabled={renewal.expired||connection.busy} onClick={()=>select(next.id)}>Siguiente actividad: {practiceAreas[next.slot]} <CommunityIcon name="arrow" size={17}/></MotionButton>}</>:<section className={s.bottomCard}><h2>Hoy no hay preguntas disponibles.</h2><p>Puedes actualizar más tarde o repasar lo que ya aprendiste.</p></section>}{data.enabled&&data.items.length>0&&data.items.length<3&&<p className={s.questionIntro}>Hay {data.items.length} actividades disponibles. Cuando coordinación habilite las restantes, aparecerán aquí.</p>}</div><ConnectedChallengeRewards progress={progress}/></div>
  <div className={s.bottomCards}><section className={s.bottomCard}><span className={s.eyebrow}>CONSTANCIA SIN PRESIÓN</span><h2>Un día a la vez.</h2><p>{progress.completedDays} días completos · Mejor serie: {progress.longestStreak} días</p><details className={s.streakRule}><summary>Cómo se calcula mi progreso</summary><p>Completar las tres cuenta como un día, aunque haya errores. La serie incluye hoy o se mantiene hasta ayer mientras empiezas; un día sin completar las tres corta la serie. Los puntos y tu mejor serie se conservan.</p><p>Tu progreso es privado. Puedes revisar cualquier respuesta guardada sin volver a sumar puntos.</p></details></section><section className={s.bottomCard}><span className={s.eyebrow}>PRACTICAR PARA RECORDAR</span><h2>Vuelve con curiosidad.</h2><p>Artículos, tiempos verbales, falsos amigos y expresiones cotidianas. Lo importante es entender la explicación y probar una frase propia.</p><button type="button" className={s.textButton} onClick={()=>{const history=document.getElementById('practice-history');history?.focus();history?.scrollIntoView({block:'start',behavior:'instant'})}}>Abrir mi cuaderno de repaso</button></section></div>
  <PracticeHistory connection={connection}/>
 </div>
}
