import { useCallback, useEffect, useRef, useState } from 'react'
import { galleryApi, ApiError, type GalleryReview } from '../features/local-access/api'
import { galleryCategories, galleryLimits } from '../../server/contracts'
import { useAdmin } from '../features/admin/state'
import { GalleryUploader } from '../features/admin/components/GalleryUploader'
import s from '../features/admin/admin.module.css'

export function AdminGalleryPage(){
  const {connection}=useAdmin()
  const [images,setImages]=useState<GalleryReview[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false)
  const [retired,setRetired]=useState(false),[confirmId,setConfirmId]=useState<string|null>(null)
  const generation=useRef(0),writing=useRef(false),onAccessLost=connection?.refresh
  const failure=useCallback((error:unknown)=>{if(error instanceof ApiError&&error.status===401){setImages([]);setConfirmId(null);void onAccessLost?.()}setError(error instanceof Error?error.message:'No pudimos cargar la galería.')},[onAccessLost])
  const refresh=useCallback(()=>{const current=++generation.current;return galleryApi.list().then(({images})=>{if(current===generation.current){setImages(images);setError('')}}).catch((error:unknown)=>{if(current===generation.current)failure(error)}).finally(()=>{if(current===generation.current)setLoading(false)})},[failure])
  useEffect(()=>{const sequence=generation;void refresh();return()=>{sequence.current++}},[refresh])
  const withdraw=async(image:GalleryReview)=>{
    if(writing.current)return
    writing.current=true;setBusy(true);setError('')
    try{await galleryApi.withdraw(image);setConfirmId(null);await refresh()}
    catch(error){failure(error);if(error instanceof ApiError&&error.status===409){await refresh();setError(error.message)}}finally{writing.current=false;setBusy(false)}
  }
  return <>
    <div className={s['page-head']}><div><p className={s.eyebrow}>Imágenes de la comunidad</p><h1 className={s['page-title']}>Galería privada</h1><p className={s['page-lead']}>Publica imágenes revisadas para un programa y grupo. La referencia de autorización queda solo en administración.</p></div><button type="button" disabled={busy} className={`${s.btn} ${s['btn--ghost']}`} onClick={()=>{void refresh()}}>Actualizar galería</button></div>
    {connection?.configuration&&<GalleryUploader groups={connection.configuration.groups} onSaved={refresh} onAccessLost={()=>{void onAccessLost?.()}}/>}
    <section className={`${s.card} ${s['gallery-records']}`} aria-label="Imágenes publicadas y retiradas">
      <div className={s.toolbar}><div className={s.tabs} role="group" aria-label="Estado de imágenes"><button className={s.tab} type="button" aria-pressed={!retired} onClick={()=>setRetired(false)}>Publicadas<span>{images.filter(image=>image.status==='publicada').length}</span></button><button className={s.tab} type="button" aria-pressed={retired} onClick={()=>setRetired(true)}>Retiradas<span>{images.filter(image=>image.status==='retirada').length}</span></button></div></div>
      <p className={s.footnote}>Almacenamiento local: {(images.reduce((sum,image)=>sum+image.byteSize,0)/1048576).toFixed(1)} de {galleryLimits.totalBytes/1048576} MB. La retirada impide nuevas consultas; se conserva el historial.</p>
      {error&&<p className={s.alert} role="alert">{error}</p>}
      {loading?<p role="status">Cargando imágenes…</p>:<ul className={`${s.queue} ${s['inbox-records']}`} aria-label="Imágenes de administración">{images.filter(image=>image.status===(retired?'retirada':'publicada')).map(image=><li key={image.id} data-image-id={image.id}><div>{image.status==='publicada'&&<img className={s['gallery-thumbnail']} src={image.imagePath} alt={image.alt} loading="lazy"/>}<strong>{image.title}</strong><span>{image.program} · {image.group}</span><span>{galleryCategories[image.category]} · {image.width} × {image.height} px</span><span>Autorización: {image.authorizationReference}</span></div>{image.status==='publicada'&&<div className={s['head-actions']}>{confirmId===image.id?<><p>Dejará de estar disponible para el grupo. ¿Confirmas la retirada?</p><button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={()=>setConfirmId(null)}>Cancelar</button><button type="button" className={`${s.btn} ${s['btn--reject']}`} disabled={busy} onClick={()=>{void withdraw(image)}}>Confirmar retirada</button></>:<button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} aria-label={`Retirar imagen ${image.title}`} onClick={()=>setConfirmId(image.id)}>Retirar imagen</button>}</div>}</li>)}</ul>}
      {!loading&&!error&&!images.some(image=>image.status===(retired?'retirada':'publicada'))&&<p className={s.empty}>No hay imágenes con este estado.</p>}
    </section>
  </>
}
