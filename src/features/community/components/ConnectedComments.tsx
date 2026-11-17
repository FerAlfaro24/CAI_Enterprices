import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { ApiError, commentsApi } from '../../local-access/api'
import { useCommunity } from '../context'
import { publicMember } from '../connection'
import type { Post } from '../types'
import type { CommentPage, OwnComment, PublicComment } from '../../../../server/contracts'
import { CommentItem } from './CommentItem'
import base from '../community.module.css'
import s from './connected-comments.module.css'

const labels={pendiente:'En revisión',publicado:'Publicado',rechazado:'No aprobado',retirado:'Retirado'}
export function ConnectedComments({post,autoFocus=false}:{post:Post;autoFocus?:boolean}){
 const {connection}=useCommunity()
 const id=useId(),heading=useRef<HTMLHeadingElement>(null),version=useRef(0),sending=useRef(false),mounted=useRef(false)
 const attempt=useRef<{body:string;key:string}|null>(null)
 const [conversation,setConversation]=useState<CommentPage<PublicComment>>({items:[],nextCursor:null})
 const [mine,setMine]=useState<CommentPage<OwnComment>>({items:[],nextCursor:null})
 const [open,setOpen]=useState(false),[loaded,setLoaded]=useState(false),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false)
 const [tab,setTab]=useState<'conversation'|'mine'>('conversation'),[body,setBody]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[confirm,setConfirm]=useState<string|null>(null)
 const fail=connection!.handleFailure,refresh=connection!.refresh
 const read=useCallback((mode:'reset'|'conversation'|'mine'='reset',cursor=0)=>{
  const current=++version.current
  const request=mode==='reset'?Promise.all([commentsApi.list(post.id),commentsApi.mine(post.id)]).then(([publicPage,ownPage])=>{
    if(current!==version.current)return
    setConversation(publicPage);setMine(ownPage);setOpen(publicPage.commentsOpen);setLoaded(true);setError('')
  }):mode==='conversation'?commentsApi.list(post.id,cursor).then(page=>{if(current!==version.current)return
    setConversation(old=>({items:[...old.items,...page.items.filter(item=>!old.items.some(existing=>existing.id===item.id))],nextCursor:page.nextCursor}));setOpen(page.commentsOpen)
  }):commentsApi.mine(post.id,cursor).then(page=>{if(current!==version.current)return
    setMine(old=>({items:[...old.items,...page.items.filter(item=>!old.items.some(existing=>existing.id===item.id))],nextCursor:page.nextCursor}))
  })
  return request.catch(e=>{
   if(current!==version.current)return
   setError(e instanceof Error?e.message:'No pudimos cargar la conversación.');setOpen(false)
   if(e instanceof ApiError&&[401,403,404].includes(e.status)){setConversation({items:[],nextCursor:null});setMine({items:[],nextCursor:null});setLoaded(false)}
   if(e instanceof ApiError&&e.status===401)fail(e)
  }).finally(()=>{if(current===version.current)setLoading(false)})
 },[post.id,fail])
 const notices=connection!.notices.length
 const globalOpen=connection!.commentsOpen
 const allowed=open&&globalOpen&&post.commentsOpen!==false
 useEffect(()=>{const sequence=version;mounted.current=true;void read();return()=>{mounted.current=false;sequence.current++}},[read,post.commentCount,notices,globalOpen,post.commentsOpen])
 useEffect(()=>{if(autoFocus){const frame=requestAnimationFrame(()=>{heading.current?.focus();heading.current?.scrollIntoView({block:'start',behavior:'instant'})});return()=>cancelAnimationFrame(frame)}},[autoFocus])
 const submit=async(event:FormEvent<HTMLFormElement>)=>{
  event.preventDefault();if(sending.current||!allowed||loading)return
  const text=body.trim()
  if(!text){setError('Escribe un comentario antes de enviarlo.');event.currentTarget.querySelector('textarea')?.focus();return}
  if(attempt.current?.body!==text)attempt.current={body:text,key:crypto.randomUUID()}
  sending.current=true;setBusy(true);setError('');setNotice('')
  try{
   await commentsApi.create(post.id,text,attempt.current.key);if(!mounted.current)return
   attempt.current=null;setBody('');setTab('mine');setNotice('Enviado a revisión. Tu grupo lo verá después de la aprobación de CAI.');await read();await refresh()
  }catch(e){if(mounted.current){setError(e instanceof Error?e.message:'No confirmamos el envío. Conservamos tu comentario para reintentar.');if(e instanceof ApiError&&[0,500,502,503,504].includes(e.status))setError('No pudimos confirmar el envío. Conservamos tu texto; puedes reintentar el mismo comentario sin duplicarlo.');if(e instanceof ApiError&&e.status===401)fail(e)}}
  finally{sending.current=false;if(mounted.current)setBusy(false)}
 }
 const withdraw=async(comment:OwnComment)=>{
  if(sending.current)return;sending.current=true;setBusy(true);setError('');setNotice('')
  try{await commentsApi.withdraw(comment);if(!mounted.current)return;setConfirm(null);setNotice('Comentario retirado. Ya no aparece en la conversación.');await read();await refresh()}
  catch(e){if(mounted.current){setError(e instanceof Error?e.message:'No confirmamos la retirada. Actualiza antes de repetir.');if(e instanceof ApiError&&e.status===401)fail(e);if(e instanceof ApiError&&e.status===409)await read()}}
  finally{sending.current=false;if(mounted.current)setBusy(false)}
 }
 return <section className={base.comments} aria-label={'Comentarios de '+post.title} aria-busy={loading||busy}>
  <div className={s.heading}><h3 ref={heading} tabIndex={-1} className={base.smallHeading}>La conversación</h3><button type="button" className={s.link} disabled={loading||busy} onClick={()=>{setLoading(true);void read()}}>Actualizar conversación</button></div>
  <p className={s.help}>Comparte una palabra de ánimo. CAI revisa los comentarios antes de mostrarlos al grupo.</p>
  <div className={s.tabs} role="group" aria-label="Vistas de comentarios"><button type="button" aria-pressed={tab==='conversation'} onClick={()=>setTab('conversation')}>Conversación ({post.commentCount??0})</button><button type="button" aria-pressed={tab==='mine'} onClick={()=>setTab('mine')}>Mis comentarios</button></div>
  {loading&&<p role="status" className={s.help}>Actualizando comentarios…</p>}
  {error&&<p id={id+'-error'} role="alert" className={base.fieldError}>{error}</p>}
  {notice&&<p role="status" className={s.receipt}>{notice}</p>}
  {loaded&&tab==='conversation'&&<div role="region" aria-label="Comentarios publicados">{conversation.items.length?conversation.items.map(item=><CommentItem key={item.id} comment={{...item,authorId:item.author.id}} member={publicMember(item.author)}/>):<p className={s.help}>Aún no hay comentarios publicados. Los envíos en revisión solo los ven su autor y CAI.</p>}{conversation.nextCursor!==null&&<button type="button" className={s.link} disabled={loading||busy} onClick={()=>{setLoading(true);void read('conversation',conversation.nextCursor!)}}>Ver comentarios anteriores</button>}</div>}
  {loaded&&tab==='mine'&&<div role="region" aria-label="Mis comentarios enviados">{mine.items.length?mine.items.map(item=><article className={s.own} key={item.id} aria-label={item.id}><div className={s.heading}><strong>{labels[item.status]}</strong><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString('es-MX')}</time></div><p className={s.body}>{item.body}</p>{item.reason&&<p className={s.help}>Indicación de CAI: {item.reason}</p>}{item.status!=='retirado'&&(confirm===item.id?<div className={s.confirm}><span>¿Retirar este comentario?</span><button type="button" className={s.link} disabled={busy} onClick={()=>{void withdraw(item)}}>Confirmar retirada</button><button type="button" className={s.link} disabled={busy} onClick={()=>setConfirm(null)}>Cancelar</button></div>:<button type="button" className={s.link} disabled={busy||loading} onClick={()=>setConfirm(item.id)}>Retirar mi comentario</button>)}</article>):<p className={s.help}>Todavía no has enviado comentarios en esta historia.</p>}{mine.nextCursor!==null&&<button type="button" className={s.link} disabled={loading||busy} onClick={()=>{setLoading(true);void read('mine',mine.nextCursor!)}}>Ver envíos anteriores</button>}</div>}
  {loaded&&!allowed&&<p role="status" className={s.receipt}>Los nuevos comentarios están pausados. Puedes leer y retirar los tuyos.</p>}
  {loaded&&<form className={base.commentForm} aria-label={'Comentar en '+post.title} noValidate onSubmit={event=>{void submit(event)}}>
   <label htmlFor={id}>Comenta como {connection!.user.displayName}</label>
   <textarea id={id} rows={3} value={body} maxLength={400} disabled={busy||!allowed} onChange={event=>setBody(event.target.value)} aria-invalid={Boolean(error&&!body.trim())} aria-describedby={id+'-help'+(error?' '+id+'-error':'')} placeholder="Acompaña esta historia con un comentario respetuoso…"/>
   <div className={base.commentFormFooter}><small id={id+'-help'}>{body.length}/400 · Se enviará a revisión</small><button className={base.smallPrimary} type="submit" disabled={busy||loading||!allowed}>{busy?'Guardando…':'Enviar a revisión'}</button></div>
  </form>}
 </section>
}

