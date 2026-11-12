import { useState } from 'react'
import type { Photo } from '../types'
import { CommunityIcon } from '../components/ui'
import s from './gallery.module.css'

/** Mount keyed by photo.src: both loading and failure belong to this resource. */
export function GalleryImage({ photo, eager = false }: { photo: Photo; eager?: boolean }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  return <div className={s.galleryImage} data-image-state={status} aria-busy={status === 'loading'}>
    {status !== 'error' && <img src={photo.src} alt={photo.alt} width="900" height="600" loading={eager ? 'eager' : 'lazy'} decoding="async" onLoad={() => setStatus('ready')} onError={() => setStatus('error')} />}
    {status === 'loading' && <span className={s.imagePlaceholder}><CommunityIcon name="gallery" size={26} /><span>Cargando fotografía…</span></span>}
    {status === 'error' && <div className={s.imageError} role="img" aria-label={`${photo.alt}. Fotografía no disponible`}><CommunityIcon name="gallery" size={28} /><strong>Fotografía no disponible</strong><span>{photo.alt}</span></div>}
  </div>
}
