import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { ApiError, commentsApi } from '../../local-access/api'
import { useAdmin } from '../state'
import { Avatar, Switch } from './ui'
import type { CommentCounts, CommentHistory, CommentReview, CommentStatus } from '../../../../server/contracts'
import s from '../admin.module.css'

const labels:Record<CommentStatus,string>={pendiente:'En revisión',publicado:'Publicados',rechazado:'No aprobados',retirado:'Retirados'}
const historyLabels:Record<string,string>={'comment.submitted':'Enviado a revisión','comment.approve':'Aprobado','comment.reject':'No aprobado','comment.undo':'Devuelto a revisión','comment.withdraw':'Retirado por coordinación','comment.withdrawn':'Retirado por su autor','comment.held':'Nueva revisión de privacidad'}
export function AdminCommentsPanel(){
 const {connection}=useAdmin(),fail=connection!.handleFailure,refresh=connection!.refresh
 const [status,setStatus]=useState<CommentStatus>('pendiente'),[items,setItems]=useState<CommentReview[]>([]),[next,setNext]=useState<number|null>(null)
 const [counts,setCounts]=useState<CommentCounts>({pendiente:0,publicado:0,rechazado:0,retirado:0}),[loading,setLoading]=useState(true),[error,setError]=useState(''),[selected,setSelected]=useState<string|null>(null)
 const version=useRef(0)
 const read=useCallback((append=false,before=0)=>{
  const current=++version.current
  return commentsApi.reviews(status,before).then(page=>{if(current!==version.current)return;setItems(old=>append?[...old,...page.items.filter(item=>!old.some(existing=>existing.id===item.id))]:page.items);setNext(page.nextCursor);setCounts(page.counts);setError('')}).catch(e=>{if(current===version.current){setError(e instanceof Error?e.message:'No pudimos cargar comentarios.');if(e instanceof ApiError&&e.status===401){setItems([]);fail(e)}}}).finally(()=>{if(current===version.current)setLoading(false)})
 },[status,fail])
 useEffect(()=>{const sequence=version;void read();return()=>{sequence.current++}},[read])
 return <section aria-label="Moderación de comentarios">
  <div className={s['page-head']}><div><h2 className={s['card-title']}>Comentarios del grupo</h2><p className={s['card-sub']}>Comprueba el contenido, su historia y el grupo antes de publicar. El motivo de una decisión solo lo ve su autor y coordinación.</p></div><button type="button" className={s.btn} disabled={loading} onClick={()=>{setLoading(true);void read();void refresh()}}>Actualizar comentarios</button></div>
  <div className={s.toolbar}><div className={s.tabs} role="group" aria-label="Filtrar comentarios por estado">{(Object.keys(labels) as CommentStatus[]).map(value=><button key={value} type="button" className={s.tab} disabled={loading} aria-pressed={status===value} onClick={()=>{setLoading(true);setItems([]);setNext(null);setStatus(value);if(status===value)void read()}}>{labels[value]} ({counts[value]})</button>)}</div></div>
  {loading&&<p role="status">Cargando comentarios…</p>}{error&&<p role="alert" className={s.alert}>{error}</p>}
  {!loading&&!items.length&&!error&&<p className={s.card}>No hay comentarios con este estado.</p>}
  <div className={s['post-grid']}>{items.map(comment=><article key={comment.id} className={s.card} aria-label={comment.id}><p className={s['card-sub']}>{comment.publication.program} · {comment.publication.group}</p><h3 className={s['card-title']}>{comment.publication.title}</h3><p className={s['post-body']} style={{whiteSpace:'pre-wrap'}}>{comment.body}</p><div className={s['post-author']}><Avatar name={comment.author.displayName} small/><div><strong>{comment.author.displayName}</strong><span>{new Date(comment.createdAt).toLocaleString('es-MX')}</span></div></div>{(!comment.authorActive||comment.publication.status!=='publicada')&&<p className={s.alert}>Revisar disponibilidad de autor e historia antes de aprobar.</p>}<button type="button" className={s.btn+' '+s['btn--ghost']} onClick={()=>setSelected(comment.id)}>Revisar comentario {comment.id}</button></article>)}</div>
  {next!==null&&<button type="button" className={s.btn} disabled={loading} onClick={()=>{setLoading(true);void read(true,next)}}>Ver comentarios anteriores</button>}
  {selected&&<CommentReviewDialog key={selected} id={selected} onClose={()=>setSelected(null)} onSaved={()=>{setSelected(null);void read();void refresh()}}/>}
 </section>
}

function CommentReviewDialog({id,onClose,onSaved}:{id:string;onClose:()=>void;onSaved:()=>void}){
 const {connection}=useAdmin(),fail=connection!.handleFailure,refresh=connection!.refresh
 const ref=useRef<HTMLDialogElement>(null),sending=useRef(false),mounted=useRef(false),titleId=useId()
 const [comment,setComment]=useState<CommentReview|null>(null),[history,setHistory]=useState<CommentHistory[]>([]),[busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[uncertain,setUncertain]=useState(false)
 const [decision,setDecision]=useState<''|'approve'|'reject'|'undo'|'withdraw'>(''),[reason,setReason]=useState(''),[checked,setChecked]=useState(false)
 const load=useCallback(()=>{
  return commentsApi.detail(id).then(value=>{if(!mounted.current)return;setComment(value.comment);setHistory(value.history);setUncertain(false);setDecision('');setReason('');setChecked(false);setError('')}).catch(e=>{if(mounted.current){setError(e instanceof Error?e.message:'No pudimos abrir el comentario.');if(e instanceof ApiError&&e.status===401)fail(e)}}).finally(()=>{if(mounted.current)setLoading(false)})
 },[id,fail])
 useEffect(()=>{mounted.current=true;ref.current?.showModal();void load();return()=>{mounted.current=false}},[load])
 const save=async()=>{
  if(!comment||sending.current)return
  if(!decision||!checked||(decision!=='approve'&&reason.trim().length<5)){setError('Elige una decisión, escribe el motivo cuando corresponda y confirma la revisión.');return}
  sending.current=true;setBusy(true);setError('')
  try{await commentsApi.decide(comment,decision,reason.trim());if(mounted.current)onSaved()}
  catch(e){if(mounted.current){setError(e instanceof Error?e.message:'No confirmamos la decisión. Carga el estado actual antes de repetir.');if(e instanceof ApiError&&e.status===401)fail(e);setUncertain(true)}}
  finally{sending.current=false;if(mounted.current)setBusy(false)}
 }
 const toggle=async(open:boolean)=>{
  if(!comment||sending.current)return;sending.current=true;setBusy(true);setError('')
  try{await commentsApi.configure(comment.publication,open);if(!mounted.current)return;const data=await commentsApi.detail(id);if(mounted.current)setComment(data.comment);await refresh()}
  catch(e){if(mounted.current){setError(e instanceof Error?e.message:'No confirmamos el cambio. Carga el estado actual.');setUncertain(true);if(e instanceof ApiError&&e.status===401)fail(e)}}
  finally{sending.current=false;if(mounted.current)setBusy(false)}
 }
 return <dialog ref={ref} className={s.dialog} aria-labelledby={titleId} onCancel={event=>{event.preventDefault();if(!busy)onClose()}}>
  <div className={s['dialog-head']}><div><h2 id={titleId}>Revisar comentario {id}</h2><p>Decisión privada de coordinación</p></div><button type="button" className={s['icon-btn']} disabled={busy} aria-label="Cerrar revisión de comentario" onClick={onClose}>×</button></div>
  <div className={s['dialog-body']}>{loading&&<p role="status">Cargando comentario…</p>}{error&&<p role="alert" className={s.alert}>{error}</p>}
   {comment&&<><dl className={s.details}><dt>Autor visible</dt><dd>{comment.author.displayName}</dd><dt>Historia</dt><dd>{comment.publication.title}</dd><dt>Grupo</dt><dd>{comment.publication.program} · {comment.publication.group}</dd><dt>Estado</dt><dd>{{pendiente:'En revisión',publicado:'Publicado',rechazado:'No aprobado',retirado:'Retirado'}[comment.status]}</dd></dl><blockquote className={s.alert} style={{whiteSpace:'pre-wrap',marginInline:0,overflowWrap:'anywhere'}}>{comment.body}</blockquote>
    {comment.publication.status!=='retirada'&&<Switch label="Recibir comentarios en esta historia" description="Solo afecta a nuevos envíos. El ajuste general de Configuración también debe estar activo." checked={comment.publication.commentsOpen} disabled={busy||loading||uncertain} onChange={open=>{void toggle(open)}}/>}
    {(!comment.authorActive||comment.publication.status!=='publicada')&&<p className={s.alert}>Para aprobar, el autor debe conservar el acceso y el grupo, y la historia debe estar publicada.</p>}
    {comment.reason&&<p className={s.alert}>Indicación anterior: {comment.reason}</p>}
    {comment.status!=='retirado'&&<form className={s['comment-decision']} aria-label="Decisión sobre comentario" noValidate onSubmit={event=>{event.preventDefault();void save()}}>
     <label htmlFor={titleId+"-decision"}>Decisión</label><select id={titleId+"-decision"} value={decision} disabled={busy||loading||uncertain} onChange={event=>{setDecision(event.target.value as typeof decision);setChecked(false)}}><option value="">Elige una acción</option>{comment.status==='pendiente'?<><option value="approve" disabled={!comment.authorActive||comment.publication.status!=='publicada'}>Publicar comentario</option><option value="reject">No aprobar</option></>:<><option value="undo">Devolver a revisión</option>{comment.status==='publicado'&&<option value="withdraw">Retirar de la conversación</option>}</>}</select>
     {decision&&decision!=='approve'&&<><label htmlFor={titleId+"-reason"}>Motivo para el autor</label><textarea id={titleId+"-reason"} rows={3} maxLength={240} value={reason} disabled={busy||uncertain} onChange={event=>setReason(event.target.value)}/></>}
     <label className={s.confirm}><input type="checkbox" checked={checked} disabled={busy||uncertain} onChange={event=>setChecked(event.target.checked)}/>Revisé el comentario y la privacidad del grupo.</label>
     <button type="submit" className={s.btn+' '+s['btn--primary']} disabled={busy||loading||uncertain}>{busy?'Guardando…':'Confirmar decisión'}</button>
    </form>}
    {comment.status==='retirado'&&<p>El comentario está retirado y no puede volver a publicarse.</p>}
    <details className={s['record-history']}><summary>Historial privado</summary><ul>{history.map((entry,index)=><li key={index}>{new Date(entry.createdAt).toLocaleString('es-MX')} · {entry.actor} · {historyLabels[entry.action]??'Cambio de estado'}{entry.reason?' · '+entry.reason:''}</li>)}</ul></details>
   </>}
   {uncertain&&<p className={s.alert}>Revisa el resultado actual antes de volver a decidir. Cargarlo descarta la decisión y el motivo que estabas preparando.</p>}
   {(uncertain||(!comment&&!loading))&&<button type="button" className={s.btn} disabled={busy||loading} onClick={()=>{setLoading(true);void load()}}>Cargar estado actual</button>}
  </div>
 </dialog>
}

