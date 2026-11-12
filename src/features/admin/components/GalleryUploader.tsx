import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { galleryApi, type CatalogGroup, type GalleryUpload } from '../../local-access/api'
import { galleryCategories, galleryLimits } from '../../../../server/contracts'
import s from '../admin.module.css'

function readImage(file: File) {
  return new Promise<string>((resolve,reject)=>{
    const reader=new FileReader()
    reader.onload=()=>resolve(String(reader.result).split(',')[1]??'')
    reader.onerror=()=>reject(new Error('No pudimos leer el archivo. Vuelve a elegirlo.'))
    reader.readAsDataURL(file)
  })
}

export function GalleryUploader({groups,onSaved,onAccessLost}:{groups:CatalogGroup[];onSaved:()=>Promise<void>;onAccessLost:()=>void}){
  const id=useId(),form=useRef<HTMLFormElement>(null),objectUrl=useRef(''),writing=useRef(false),attempt=useRef({fingerprint:'',key:crypto.randomUUID()})
  const [program,setProgram]=useState(''),[group,setGroup]=useState(''),[confirmed,setConfirmed]=useState(false)
  const [preview,setPreview]=useState(''),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false)
  const active=groups.filter(group=>group.active&&group.name!=='Por asignar')
  useEffect(()=>{const url=objectUrl;return()=>{if(url.current)URL.revokeObjectURL(url.current)}},[])
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();if(writing.current)return
    const values=new FormData(event.currentTarget),file=values.get('image')
    if(!(file instanceof File)||!file.size||file.size>galleryLimits.uploadBytes||!['image/jpeg','image/png'].includes(file.type)){setError('Elige una imagen JPEG o PNG de hasta 3 MB.');return}
    if(!confirmed){setError('Confirma la revisión y los permisos antes de publicar.');return}
    writing.current=true;setBusy(true);setError('');setNotice('')
    try{
      const draft:GalleryUpload={title:String(values.get('title')),description:String(values.get('description')),category:String(values.get('category')) as GalleryUpload['category'],alt:String(values.get('alt')),program,group,authorizationReference:String(values.get('authorizationReference')),confirmed,imageBase64:await readImage(file)}
      const fingerprint=JSON.stringify(draft)
      if(attempt.current.fingerprint!==fingerprint)attempt.current={fingerprint,key:crypto.randomUUID()}
      await galleryApi.upload(draft,attempt.current.key)
      form.current?.reset();setProgram('');setGroup('');setConfirmed(false);setPreview('');if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current=''
      attempt.current={fingerprint:'',key:crypto.randomUUID()};setNotice('Imagen guardada. Solo el programa y grupo elegido pueden verla.');await onSaved()
    }catch(error){if(error instanceof Error&&'status' in error&&error.status===401)onAccessLost();setError(error instanceof Error?error.message:'No pudimos guardar la imagen. El formulario conserva sus datos.')}
    finally{writing.current=false;setBusy(false)}
  }
  return <section className={s.card} aria-labelledby={`${id}-title`}>
    <div className={s['card-head']}><div><h2 id={`${id}-title`} className={s['card-title']}>Publicar imagen para un grupo</h2><p className={s['card-sub']}>JPEG o PNG · Hasta 3 MB y 12 millones de píxeles. Solo administración publica. En estas pruebas utiliza imágenes ficticias.</p></div></div>
    <form ref={form} onSubmit={event=>{void submit(event)}} aria-label="Publicar imagen privada" onChange={event=>{if(!(event.target instanceof HTMLInputElement)||event.target.name!=='confirmed')setConfirmed(false)}}>
      <fieldset className={s['gallery-fields']} disabled={busy}>
        <label htmlFor={`${id}-file`}>Imagen JPEG o PNG</label><input id={`${id}-file`} name="image" type="file" accept="image/jpeg,image/png" required onChange={event=>{if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);const file=event.target.files?.[0];objectUrl.current=file?URL.createObjectURL(file):'';setPreview(objectUrl.current);setError('')}}/>
        {preview&&<img className={s['upload-preview']} src={preview} alt="Vista previa del archivo elegido para revisión"/>}
        <label htmlFor={`${id}-name`}>Título</label><input id={`${id}-name`} name="title" required minLength={4} maxLength={100}/>
        <label htmlFor={`${id}-description`}>Descripción</label><input id={`${id}-description`} name="description" required minLength={10} maxLength={500}/>
        <label htmlFor={`${id}-alt`}>Texto alternativo</label><input id={`${id}-alt`} name="alt" required minLength={5} maxLength={240} placeholder="Describe la imagen para quien no pueda verla"/>
        <label htmlFor={`${id}-category`}>Categoría</label><select id={`${id}-category`} name="category">{Object.entries(galleryCategories).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        <label htmlFor={`${id}-program`}>Programa destinatario</label><select id={`${id}-program`} name="program" required value={program} onChange={event=>{setProgram(event.target.value);setGroup('')}}><option value="">Elige un programa</option>{[...new Set(active.map(group=>group.program))].map(program=><option key={program}>{program}</option>)}</select>
        <label htmlFor={`${id}-group`}>Grupo destinatario</label><select id={`${id}-group`} name="group" required value={group} onChange={event=>setGroup(event.target.value)}><option value="">Elige un grupo</option>{active.filter(group=>group.program===program).map(group=><option key={group.id}>{group.name}</option>)}</select>
        <label htmlFor={`${id}-authorization`}>Referencia de autorización</label><input id={`${id}-authorization`} name="authorizationReference" required minLength={8} maxLength={240} placeholder="Referencia interna del permiso; no incluyas datos personales"/>
        <label className={s.confirm}><input name="confirmed" type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)}/>Revisé la imagen, los permisos de las personas que aparecen y el grupo destinatario</label>
        <button type="submit" className={`${s.btn} ${s['btn--primary']}`} disabled={!confirmed||!active.length}>{busy?'Procesando…':'Publicar imagen'}</button>
      </fieldset>
      {error&&<p className={s.alert} role="alert">{error}</p>}{notice&&<p className={`${s.alert} ${s['alert--ok']}`} role="status">{notice}</p>}
    </form>
  </section>
}
