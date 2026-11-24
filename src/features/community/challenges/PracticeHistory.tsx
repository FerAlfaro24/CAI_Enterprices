import {useRef,useState} from 'react'
import {challengesApi,ApiError,type ChallengeHistory} from '../../local-access/api'
import type {CommunityConnection} from '../connection'
import {MotionButton} from '../components/CommunityMotion'
import {practiceDateLabel} from '../../../../shared/challenge-practice'
import s from './challenges.module.css'

export function PracticeHistory({connection}:{connection:CommunityConnection}){
 const [history,setHistory]=useState<ChallengeHistory|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState(''),[onlyReview,setOnlyReview]=useState(false)
 const reading=useRef(false)
 const load=async(more=false)=>{
  if(reading.current)return
  reading.current=true;setLoading(true);setError('')
  try{const page=await challengesApi.history(more?history?.nextCursor??0:0);setHistory(old=>({items:more?[...(old?.items??[]),...page.items]:page.items,nextCursor:page.nextCursor}))}
  catch(error){if(error instanceof ApiError&&error.status===401)connection.handleFailure(error);setError(error instanceof Error?error.message:'No pudimos cargar tu repaso.')}
  finally{reading.current=false;setLoading(false)}
 }
 return <section id="practice-history" tabIndex={-1} className={s.history} aria-label="Mi cuaderno de repaso"><span className={s.eyebrow}>MI CUADERNO DE REPASO</span><h2>Lo que ya practicaste.</h2><p>Solo tú puedes consultar tus respuestas aquí. Abre una pregunta para recordar la explicación.</p><MotionButton type="button" className={s.textButton} disabled={loading} onClick={()=>{void load()}}>{loading?'Cargando…':history?'Actualizar mi repaso':'Ver mis respuestas anteriores'}</MotionButton>{error&&<p role="alert" className={s.error}>{error}</p>}
  {history?.items.length===0&&<p>Aún no hay respuestas guardadas. Empieza con las preguntas de hoy.</p>}
  {history&&<div className={s.historyFilters} role="group" aria-label="Filtrar mi repaso"><button type="button" aria-pressed={!onlyReview} onClick={()=>setOnlyReview(false)}>Todas mis respuestas</button><button type="button" aria-pressed={onlyReview} onClick={()=>setOnlyReview(true)}>Para repasar</button></div>}
  {history&&onlyReview&&!history.items.some(q=>!q.attempt?.correct)&&<p>No hay respuestas incorrectas entre las que has cargado.{history.nextCursor?' Puedes ver las anteriores.':''}</p>}
  {history?.items.filter(q=>!onlyReview||!q.attempt?.correct).map(q=><details className={s.review} data-result={q.attempt?.correct?'correct':'incorrect'} key={q.id}><summary>{q.attempt?.correct?'✓ Acierto:':'✕ Para repasar:'} {q.topic} · {practiceDateLabel(q.day)}</summary><p><b>{q.question}</b></p><p>Elegiste: {q.options[q.attempt!.answerIndex]} · +{q.attempt!.points} puntos</p><p>Respuesta correcta: <b>{q.options[q.attempt!.correctIndex]}</b></p><p>{q.attempt!.explanation}</p><p><b>Otro ejemplo:</b> {q.attempt!.example}</p></details>)}
  {history?.nextCursor&&<MotionButton type="button" className={s.textButton} disabled={loading} onClick={()=>{void load(true)}}>Ver más respuestas</MotionButton>}
 </section>
}
