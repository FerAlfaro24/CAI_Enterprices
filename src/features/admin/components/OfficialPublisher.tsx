import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { ApiError, galleryApi, institutionalApi, type CatalogGroup, type GalleryReview, type ReviewPost } from '../../local-access/api'
import type { InstitutionalDraft } from '../../../../server/contracts'
import s from '../admin.module.css'

const readFile=(file:File)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]??'');reader.onerror=()=>reject(Error('No pudimos leer la imagen.'));reader.readAsDataURL(file)})
function Preview({file}:{file:File}){
  const image=useRef<HTMLImageElement>(null)
  useEffect(()=>{const next=URL.createObjectURL(file);if(image.current)image.current.src=next;return()=>URL.revokeObjectURL(next)},[file])
  return <img ref={image} className={s['gallery-thumbnail']} alt="Vista previa de la foto que vas a publicar"/>
}

export function OfficialPublisher({groups,onAccessLost}:{groups:CatalogGroup[];onAccessLost:()=>void}){
  const id=useId(),form=useRef<HTMLFormElement>(null),writing=useRef(false),uploads=useRef(new Map<string,{id?:string;key:string}>()),attempt=useRef({fingerprint:'',key:crypto.randomUUID()})
  const [images,setImages]=useState<GalleryReview[]>([]),[posts,setPosts]=useState<ReviewPost[]>([]),[files,setFiles]=useState<File[]>([])
  const [kind,setKind]=useState<InstitutionalDraft['kind']>('story'),[audience,setAudience]=useState<'group'|'community'>('community'),[program,setProgram]=useState('')
  const [loadedAt,setLoadedAt]=useState(()=>Date.now())
  const [galleryChecked,setGalleryChecked]=useState(false)
  const [confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[withdrawId,setWithdrawId]=useState<string|null>(null)
  const failure=useCallback((error:unknown)=>{if(error instanceof ApiError&&error.status===401)onAccessLost();setError(error instanceof Error?error.message:'No pudimos completar la acción.')},[onAccessLost])
  const refresh=useCallback(()=>Promise.all([galleryApi.list(),institutionalApi.list()]).then(([gallery,official])=>{setImages(gallery.images);setPosts(official.posts);setLoadedAt(Date.now())}).catch(failure),[failure])
  useEffect(()=>{void refresh()},[refresh])
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();if(writing.current||!confirmed)return
    writing.current=true;setBusy(true);setError('');setNotice('')
    try{
      const values=new FormData(event.currentTarget),selected=values.getAll('existing').map(String)
      if(files.length+selected.length>12)throw Error('Elige como máximo doce fotos por publicación.')
      const title=String(values.get('title')),body=String(values.get('body')),group=audience==='group'?String(values.get('group')):'',programName=audience==='group'?program:''
      for(const [index,file]of files.entries()){
        if(file.size>3*1024*1024||!['image/jpeg','image/png'].includes(file.type))throw Error('Usa fotos JPEG o PNG de hasta 3 MB cada una.')
        const upload={title,description:body.slice(0,500),alt:String(values.get(`alt-${index}`)),category:'activities' as const,audience,program:programName,group,authorizationReference:String(values.get('authorization')),confirmed:true,draft:true,imageBase64:await readFile(file)}
        const fingerprint=JSON.stringify(upload)
        let uploadAttempt=uploads.current.get(fingerprint)
        if(!uploadAttempt){uploadAttempt={key:crypto.randomUUID()};uploads.current.set(fingerprint,uploadAttempt)}
        if(!uploadAttempt.id){const result=await galleryApi.upload(upload,uploadAttempt.key);uploadAttempt.id=result.image.id}
        selected.push(uploadAttempt.id)
      }
      const end=String(values.get('expiresAt')??'')
      const draft:InstitutionalDraft={title,body,kind,audience,program:programName,group,imageIds:selected,showInGallery:kind==='album'||values.get('showInGallery')==='on',highlighted:values.get('highlighted')==='on',expiresAt:end?new Date(end).toISOString():null,confirmed:true}
      const fingerprint=JSON.stringify(draft)
      if(attempt.current.fingerprint!==fingerprint)attempt.current={fingerprint,key:crypto.randomUUID()}
      await institutionalApi.create(draft,attempt.current.key)
      form.current?.reset();setFiles([]);setConfirmed(false);setGalleryChecked(false);setKind('story');setAudience('community');setProgram('');uploads.current.clear();attempt.current={fingerprint:'',key:crypto.randomUUID()}
      setNotice('Publicación guardada. Inicio, fotos y conversación usan el mismo contenido.');await refresh()
    }catch(error){failure(error)}finally{writing.current=false;setBusy(false)}
  }
  const update=async(post:ReviewPost,withdraw=false)=>{
    if(writing.current)return;writing.current=true;setBusy(true);setError('');setNotice('')
    try{await institutionalApi.update(post,withdraw);setWithdrawId(null);await refresh();setNotice(withdraw?'Publicación retirada de Inicio, Galería y destacados.':'Destacado actualizado.')}catch(error){failure(error)}finally{writing.current=false;setBusy(false)}
  }
  const active=groups.filter(group=>group.active&&group.name!=='Por asignar')
  return <section className={s.card} aria-labelledby={`${id}-heading`}>
    <div className={s['card-head']}><div><h2 id={`${id}-heading`} className={s['card-title']}>Publicar como Equipo CAI</h2><p className={s['card-sub']}>Crea una historia, un aviso o un álbum. Las fotos se guardan una vez y la conversación es la misma desde Inicio y Galería.</p></div></div>
    <details className={s.officialComposer}><summary>Crear publicación de CAI</summary><form ref={form} aria-label="Nueva publicación de coordinación" onSubmit={event=>{void submit(event)}} onChange={event=>{if(!(event.target instanceof HTMLInputElement)||event.target.name!=='confirmed')setConfirmed(false)}}>
      <fieldset className={s['gallery-fields']} disabled={busy}>
        <label htmlFor={`${id}-kind`}>¿Qué vas a compartir?</label><select id={`${id}-kind`} value={kind} onChange={event=>setKind(event.target.value as InstitutionalDraft['kind'])}><option value="story">Una historia</option><option value="notice">Un aviso de CAI</option><option value="album">Un álbum de fotos</option></select>
        <label htmlFor={`${id}-title`}>Título de la publicación</label><input id={`${id}-title`} name="title" minLength={4} maxLength={100} required/>
        <label htmlFor={`${id}-body`}>Cuéntale a la comunidad</label><textarea id={`${id}-body`} name="body" minLength={10} maxLength={1200} required rows={3}/>
        <label htmlFor={`${id}-audience`}>Destinatarios de la publicación</label><select id={`${id}-audience`} value={audience} onChange={event=>{setAudience(event.target.value as 'group'|'community');setProgram('')}}><option value="community">Todos los alumnos aprobados</option><option value="group">Un grupo específico</option></select>
        {audience==='group'&&<><label htmlFor={`${id}-program`}>Programa</label><select id={`${id}-program`} required value={program} onChange={event=>setProgram(event.target.value)}><option value="">Elige programa</option>{[...new Set(active.map(g=>g.program))].map(name=><option key={name}>{name}</option>)}</select><label htmlFor={`${id}-group`}>Grupo</label><select id={`${id}-group`} name="group" required><option value="">Elige grupo</option>{active.filter(g=>g.program===program).map(g=><option key={g.id}>{g.name}</option>)}</select></>}
        <label htmlFor={`${id}-images`}>Añadir fotos nuevas (opcional, hasta 12)</label><input id={`${id}-images`} name="images" type="file" multiple accept="image/jpeg,image/png" onChange={event=>setFiles(Array.from(event.target.files??[]))}/>
        {files.map((file,index)=><div key={`${file.name}-${index}`}><Preview file={file}/><label htmlFor={`${id}-alt-${index}`}>Describe la foto {index+1} para quien no pueda verla</label><input id={`${id}-alt-${index}`} name={`alt-${index}`} required minLength={5} maxLength={240}/></div>)}
        {files.length>0&&<><label htmlFor={`${id}-authorization`}>Referencia interna de autorización de las fotos</label><input id={`${id}-authorization`} name="authorization" required minLength={8} maxLength={240}/></>}
        {images.some(image=>image.status==='publicada'&&!image.linkedPostId)&&<details><summary>Usar fotos que ya están en Galería</summary><div className={s.officialPhotoChoices}>{images.filter(image=>image.status==='publicada'&&!image.linkedPostId).map(image=><label key={image.id}><input type="checkbox" name="existing" value={image.id}/><img src={image.imagePath} alt={image.alt} loading="lazy"/><span>{image.title}<small>{image.audience==='community'?'Toda la comunidad':`${image.program} · ${image.group}`}</small></span></label>)}</div></details>}
        <label className={s.confirm}><input type="checkbox" name="showInGallery" checked={kind==='album'||galleryChecked} disabled={kind==='album'} onChange={event=>setGalleryChecked(event.target.checked)}/>Guardar también las fotos en Galería</label>
        <label className={s.confirm}><input type="checkbox" name="highlighted"/>Destacar en Inicio</label>
        <label htmlFor={`${id}-end`}>Dejar de mostrar esta publicación el (opcional)</label><input id={`${id}-end`} name="expiresAt" type="datetime-local"/>
        <label className={s.confirm}><input name="confirmed" type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>Revisé el contenido, los permisos de las fotos y sus destinatarios</label>
        <button type="submit" className={`${s.btn} ${s['btn--primary']}`} disabled={!confirmed}>{busy?'Guardando…':'Publicar en la comunidad'}</button>
      </fieldset>
    </form></details>
    {error&&<p className={s.alert} role="alert">{error}</p>}{notice&&<p className={`${s.alert} ${s['alert--ok']}`} role="status">{notice}</p>}
    <details className={s.officialRecords}><summary>Publicaciones de coordinación ({posts.length})</summary><ul className={s.queue}>{posts.map(post=><li key={post.id}><div><strong>{post.title}</strong><span>{post.kind==='notice'?'Aviso':post.kind==='album'?'Álbum':'Historia'} · {post.status} · {post.audience==='community'?'Todos los aprobados':post.group}</span><span>{post.expiresAt?`Finaliza: ${new Date(post.expiresAt).toLocaleString('es-MX')}`:'Sin fecha de finalización'}</span></div>{post.status==='publicada'&&<div className={s['head-actions']}><button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy||Boolean(post.expiresAt&&Date.parse(post.expiresAt)<loadedAt)} onClick={()=>{void update(post)}}>{post.highlighted?'Quitar de destacados':'Destacar en Inicio'}</button>{withdrawId===post.id?<><button type="button" className={`${s.btn} ${s['btn--reject']}`} disabled={busy} onClick={()=>{void update(post,true)}}>Confirmar retirada</button><button type="button" className={s.btn} onClick={()=>setWithdrawId(null)}>Cancelar</button></>:<button type="button" className={s.btn} onClick={()=>setWithdrawId(post.id)}>Retirar publicación</button>}</div>}</li>)}</ul></details>
  </section>
}
