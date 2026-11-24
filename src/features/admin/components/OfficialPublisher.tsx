import { useCallback, useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError, galleryApi, institutionalApi, type GalleryReview } from '../../local-access/api'
import type { InstitutionalDraft } from '../../../../server/contracts'
import s from '../admin.module.css'

const readFile=(file:File)=>new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]??'');reader.onerror=()=>reject(Error('No pudimos leer la imagen.'));reader.readAsDataURL(file)})
function Preview({file}:{file:File}){
  const image=useRef<HTMLImageElement>(null)
  useEffect(()=>{const next=URL.createObjectURL(file);if(image.current)image.current.src=next;return()=>URL.revokeObjectURL(next)},[file])
  return <img ref={image} className={s['gallery-thumbnail']} alt="Vista previa de la foto que vas a publicar"/>
}

export function OfficialPublisher({ onAccessLost,onPublished }: { onAccessLost: () => void;onPublished?:()=>Promise<void> }) {
  const id = useId(), form = useRef<HTMLFormElement>(null), writing = useRef(false)
  const uploads = useRef(new Map<string, { id?: string; key: string }>())
  const attempt = useRef({ fingerprint: '', key: crypto.randomUUID() })
  const [images, setImages] = useState<GalleryReview[]>([]), [files, setFiles] = useState<File[]>([])
  const [kind, setKind] = useState<'story' | 'notice'>('story'), [confirmed, setConfirmed] = useState(false)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('')
  const accessLost = useRef(onAccessLost)
  useEffect(() => { accessLost.current = onAccessLost }, [onAccessLost])
  const failure = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) accessLost.current()
    setError(error instanceof Error ? error.message : 'No pudimos completar la publicación.')
  }, [])
  const refresh = useCallback(() => galleryApi.list().then(gallery => setImages(gallery.images)).catch(failure), [failure])
  useEffect(() => { void refresh() }, [refresh])
  const available = images.filter(image => image.audience === 'community' && image.status === 'publicada' && !image.linkedPostId)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (writing.current || !confirmed) return
    writing.current = true; setBusy(true); setError(''); setNotice('')
    try {
      const values = new FormData(event.currentTarget), selected = values.getAll('existing').map(String)
      if (files.length + selected.length > 12) throw Error('Elige como máximo doce fotos por publicación.')
      if (files.some(file => file.size > 3 * 1024 * 1024 || !['image/jpeg', 'image/png'].includes(file.type))) throw Error('Usa fotos JPEG o PNG de hasta 3 MB cada una.')
      const title = String(values.get('title')), body = String(values.get('body'))
      for (const [index, file] of files.entries()) {
        const upload = { title, description: body.slice(0, 500), alt: String(values.get(`alt-${index}`)), category: 'activities' as const,
          audience: 'community' as const, program: '', group: '', authorizationReference: String(values.get('authorization')),
          confirmed: true, draft: true, imageBase64: await readFile(file) }
        const fingerprint = JSON.stringify(upload)
        let uploadAttempt = uploads.current.get(fingerprint)
        if (!uploadAttempt) { uploadAttempt = { key: crypto.randomUUID() }; uploads.current.set(fingerprint, uploadAttempt) }
        if (!uploadAttempt.id) { const result = await galleryApi.upload(upload, uploadAttempt.key); uploadAttempt.id = result.image.id }
        selected.push(uploadAttempt.id)
      }
      const end = String(values.get('expiresAt') ?? '')
      const draft: InstitutionalDraft = { title, body, kind, audience: 'community', program: '', group: '', imageIds: selected,
        showInGallery: kind === 'story' && selected.length > 0, highlighted: kind === 'notice', expiresAt: end ? new Date(end).toISOString() : null, confirmed: true }
      const fingerprint = JSON.stringify(draft)
      if (attempt.current.fingerprint !== fingerprint) attempt.current = { fingerprint, key: crypto.randomUUID() }
      await institutionalApi.create(draft, attempt.current.key)
      setNotice(kind === 'notice' ? 'Aviso publicado. Ya aparece en el carrusel de Inicio.' : 'Publicación guardada en la comunidad. Sus fotos también están en Galería.')
      form.current?.reset(); setFiles([]); setConfirmed(false); uploads.current.clear(); attempt.current = { fingerprint: '', key: crypto.randomUUID() }
      await refresh();await onPublished?.()
    } catch (error) { failure(error) } finally { writing.current = false; setBusy(false) }
  }
  return <section className={s.card} aria-labelledby={id + '-heading'}>
    <h2 className={s['card-title']} id={id + '-heading'}>¿Qué quieres compartir?</h2>
    <form ref={form} className={s.officialComposer} aria-label="Nueva publicación de coordinación" onSubmit={event => { void submit(event) }} onChange={event => { if (!(event.target instanceof HTMLInputElement) || event.target.name !== 'confirmed') setConfirmed(false) }}>
      <fieldset className={s['gallery-fields']} disabled={busy}>
        <div className={s.publisherChoices} role="group" aria-label="Tipo de publicación">
          <button type="button" aria-pressed={kind === 'story'} onClick={() => { setKind('story'); setConfirmed(false) }}><strong>Publicación normal</strong><span>Comparte una experiencia o fotos con la comunidad.</span></button>
          <button type="button" aria-pressed={kind === 'notice'} onClick={() => { setKind('notice'); setConfirmed(false) }}><strong>Aviso de CAI</strong><span>Comunica algo importante en el carrusel de Inicio.</span></button>
        </div>
        <p role="status">{kind === 'notice' ? 'Se verá en el carrusel de avisos y en las publicaciones de la comunidad.' : 'Se verá en las publicaciones. Si añades fotos, también estarán en Galería.'}</p>
        <label htmlFor={id + '-title'}>{kind === 'notice' ? 'Título del aviso' : 'Título de la publicación'}</label><input id={id + '-title'} name="title" required minLength={4} maxLength={100}/>
        <label htmlFor={id + '-body'}>{kind === 'notice' ? '¿Qué necesita saber la comunidad?' : 'Cuéntale a la comunidad'}</label><textarea id={id + '-body'} name="body" required minLength={10} maxLength={1200} rows={5}/>
        <label htmlFor={id + '-images'}>Añadir imágenes <small>Opcional · hasta 12 JPEG/PNG · 3 MB cada una</small></label><input id={id + '-images'} type="file" multiple accept="image/jpeg,image/png" onChange={event => setFiles(Array.from(event.target.files ?? []))}/>
        {files.map((file, index) => <div key={file.name + '-' + index}><Preview file={file}/><label htmlFor={id + '-alt-' + index}>Describe la imagen {index + 1}</label><input id={id + '-alt-' + index} name={'alt-' + index} required minLength={5} maxLength={240}/><button type="button" className={s.btn} onClick={() => { setFiles(old => old.filter((_, i) => i !== index)); setConfirmed(false) }}>Quitar imagen {index + 1}</button></div>)}
        {files.length > 0 && <><label htmlFor={id + '-authorization'}>Permiso o referencia interna para usar las imágenes</label><input id={id + '-authorization'} name="authorization" required minLength={8} maxLength={240}/></>}
        {available.length > 0 && <details><summary>Elegir imágenes existentes de Galería</summary><div className={s.officialPhotoChoices}>{available.map(image => <label key={image.id}><input type="checkbox" name="existing" value={image.id}/><img src={image.imagePath} alt={image.alt} loading="lazy"/><span>{image.title}</span></label>)}</div></details>}
        <label htmlFor={id + '-end'}>Dejar de mostrar el {kind === 'notice' ? 'aviso' : 'contenido'} el <small>Opcional; vacío significa que seguirá visible.</small></label><input id={id + '-end'} name="expiresAt" type="datetime-local"/>
        <p>Lo podrán ver todos los alumnos aprobados. Las imágenes privadas de grupos anteriores conservan sus permisos y no se incluyen en este selector.</p>
        <label className={s.confirm}><input type="checkbox" name="confirmed" checked={confirmed} onChange={event => setConfirmed(event.target.checked)}/>Revisé el contenido y tengo permiso para compartir las imágenes con la comunidad.</label>
        <button type="submit" className={`${s.btn} ${s['btn--primary']}`} disabled={!confirmed}>{busy ? 'Publicando…' : kind === 'notice' ? 'Publicar aviso de CAI' : 'Publicar en la comunidad'}</button>
      </fieldset>
    </form>
    {error && <p role="alert" className={s.alert}>{error}</p>}{notice && <div role="status" className={`${s.alert} ${s['alert--ok']}`}>{notice} <Link to="/admin/publicaciones">Ver publicaciones</Link></div>}
  </section>
}
