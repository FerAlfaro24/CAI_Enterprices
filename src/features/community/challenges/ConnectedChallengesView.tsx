import { useRef,useState } from 'react'
import { challengesApi,ApiError,type DailyQuestion,type ChallengeHistory } from '../../local-access/api'
import type { CommunityConnection } from '../connection'
import { CommunityIcon } from '../components/ui'
import { MotionButton } from '../components/CommunityMotion'
import { ChallengeQuestionPanel } from './ChallengeQuestionPanel'
import { ConnectedChallengeRewards } from './ChallengeRewards'
import s from './challenges.module.css'

const dateLabel=(day:string)=>new Intl.DateTimeFormat('es-MX',{dateStyle:'long',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'))
function adapter(q:DailyQuestion){return {...q,correctIndex:q.attempt?.correctIndex??-1,explanation:q.attempt?.explanation??'',example:q.attempt?.example??''}}
function PracticeHistory({connection}:{connection:CommunityConnection}){
 const [history,setHistory]=useState<ChallengeHistory|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('')
 const reading=useRef(false)
 const load=async(more=false)=>{
  if(reading.current)return
  reading.current=true;setLoading(true);setError('')
  try{const page=await challengesApi.history(more?history?.nextCursor??0:0);setHistory(old=>({items:more?[...(old?.items??[]),...page.items]:page.items,nextCursor:page.nextCursor}))}
  catch(error){if(error instanceof ApiError&&error.status===401)connection.handleFailure(error);setError(error instanceof Error?error.message:'No pudimos cargar tu repaso.')}
  finally{reading.current=false;setLoading(false)}
 }
 return <section className={s.history} aria-label="Mi cuaderno de repaso"><span className={s.eyebrow}>MI CUADERNO DE REPASO</span><h2>Lo que ya practicaste.</h2><p>Solo tú puedes consultar tus respuestas aquí. Abre una pregunta para recordar la explicación.</p><MotionButton type="button" className={s.textButton} disabled={loading} onClick={()=>{void load()}}>{loading?'Cargando…':history?'Actualizar mi repaso':'Ver mis respuestas anteriores'}</MotionButton>{error&&<p role="alert" className={s.error}>{error}</p>}
  {history?.items.length===0&&<p>Aún no hay respuestas guardadas. Empieza con las preguntas de hoy.</p>}
  {history?.items.map(q=><details className={s.review} key={q.id}><summary>{q.attempt?.correct?'✓':'↻'} {q.topic} · {dateLabel(q.day)}</summary><p><b>{q.question}</b></p><p>Elegiste: {q.options[q.attempt!.answerIndex]} · +{q.attempt!.points} puntos</p><p>Respuesta correcta: <b>{q.options[q.attempt!.correctIndex]}</b></p><p>{q.attempt!.explanation}</p><p><b>Otro ejemplo:</b> {q.attempt!.example}</p></details>)}
  {history?.nextCursor&&<MotionButton type="button" className={s.textButton} disabled={loading} onClick={()=>{void load(true)}}>Ver más respuestas</MotionButton>}
 </section>
}
export function ConnectedChallengesView({connection}:{connection:CommunityConnection}){
 const {challenges:data}=connection
 const [selection,setSelection]=useState(()=>data.items.find(q=>!q.attempt)?.id??data.items[0]?.id??'')
 const question=data.items.find(q=>q.id===selection)??data.items.find(q=>!q.attempt)??data.items[0]
 const next=data.items.find(q=>!q.attempt&&q.id!==question?.id)
 const progress=data.progress
 return <div className={`${s.challenges} ${s.connected}`}>
  <header className={s.pageHeading}><div><span className={s.eyebrow}><CommunityIcon name="spark" size={18}/> UN POQUITO CADA DÍA</span><h1 id="community-title" tabIndex={-1}>Pequeños retos.<br/><em>Inglés que se queda.</em></h1><p>Tres preguntas para practicar gramática, palabras que confunden y situaciones cotidianas. Equivocarte también es aprender.</p><p>{dateLabel(data.day)} · Cambian a medianoche, hora de Ciudad de México.</p></div>
  <section className={s.streakCard} aria-label="Tu progreso en los retos"><CommunityIcon name="spark" size={48}/><div><span className={s.sectionKicker}>TU RITMO, TUS PASOS</span><strong>{progress.currentStreak} {progress.currentStreak===1?'día seguido':'días seguidos'}</strong><p>Completa las tres preguntas para sumar un día de constancia. No necesitas acertar todas.</p><small><b>{progress.points}</b> puntos · <b>{progress.todayAnswered}/3</b> respuestas hoy</small></div>
  <nav className={`${s.dayTrack} ${s.dailyTrack}`} aria-label="Preguntas de hoy"><span>EL RECORRIDO DE HOY</span>{data.items.map(q=><MotionButton type="button" key={q.id} onClick={()=>setSelection(q.id)} aria-current={q.id===question?.id?'step':undefined} data-completed={Boolean(q.attempt)} aria-label={`Pregunta ${q.slot+1}: ${q.topic}${q.attempt?' · Respondida':''}`}>{q.attempt?<CommunityIcon name="check" size={16}/>:q.slot+1}<small>{['Gramática','Vocabulario','Vida diaria'][q.slot]}</small></MotionButton>)}</nav></section></header>
  {data.needsGroup&&<p className={s.error} role="status">Coordinación debe asignarte un grupo para que puedas responder. Tu progreso anterior se conserva.</p>}
  {!data.enabled&&<p className={s.error} role="status">Coordinación pausó los retos. Puedes seguir repasando tus respuestas guardadas.</p>}
  {progress.todayAnswered===3&&<section className={s.finished} role="status"><CommunityIcon name="check" size={22}/><div><h2>¡Por hoy, misión cumplida!</h2><p>Ya practicaste las tres preguntas. Repasa lo que aprendiste y vuelve mañana por otras nuevas.</p></div></section>}
  <div className={s.challengeGrid}><div>{question?<><ChallengeQuestionPanel key={question.id+'-'+question.revision} challenge={adapter(question)} attempt={question.attempt??undefined}/>{question.previousGroup&&<p className={s.questionIntro}>Respondiste esta pregunta antes de cambiar de grupo. Tu resultado se conserva.</p>}{question.attempt&&next&&<MotionButton type="button" className={s.checkButton} onClick={()=>{setSelection(next.id);document.getElementById('community-title')?.focus()}}>Siguiente pregunta <CommunityIcon name="arrow" size={17}/></MotionButton>}</>:<section className={s.bottomCard}><h2>Hoy no hay preguntas disponibles.</h2><p>Puedes volver más tarde o repasar lo que ya aprendiste.</p></section>}</div><ConnectedChallengeRewards progress={progress}/></div>
  <div className={s.bottomCards}><section className={s.bottomCard}><span className={s.eyebrow}>CONSTANCIA SIN PRESIÓN</span><h2>Un día a la vez.</h2><p>{progress.completedDays} días completos · Mejor serie: {progress.longestStreak} días</p><details className={s.streakRule}><summary>Cómo se calcula mi progreso</summary><p>Sumas 5 puntos por responder y 10 más si aciertas. Hay un intento por pregunta. Completar las tres cuenta como un día, aunque haya errores. La serie incluye hoy o se mantiene hasta ayer mientras empiezas; un día completo sin terminar corta la serie. Los puntos y tu mejor serie se conservan.</p><p>Los retos se renuevan según la fecha de Ciudad de México. Tu progreso es privado y no es una calificación ni un examen de nivel.</p></details></section><section className={s.bottomCard}><span className={s.eyebrow}>PRACTICAR PARA RECORDAR</span><h2>Vuelve con curiosidad.</h2><p>Los temas reaparecen en contextos diferentes: artículos, tiempos verbales, falsos amigos y expresiones que sí se usan.</p></section></div>
  <PracticeHistory connection={connection}/>
 </div>
}
