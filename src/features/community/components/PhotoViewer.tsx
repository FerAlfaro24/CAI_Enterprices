import { useId } from 'react'
import type { Photo } from '../types'
import { useCommunityDialog } from '../useCommunityDialog'
import { StockImage } from './StockImage'
import { CommunityIcon } from './ui'
import s from '../community.module.css'

/** A native modal over the post: private image URLs keep their existing authorization. */
export function PhotoViewer({ photos, index, onChange, onClose }: { photos: Photo[]; index: number; onChange: (index: number) => void; onClose: () => void }) {
  const dialog = useCommunityDialog()
  const id = useId()
  const photo = photos[index]
  if (!photo) return null
  const move = (direction: number) => onChange((index + direction + photos.length) % photos.length)
  return <dialog ref={dialog} className={s.photoViewer} aria-labelledby={id}
    onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose() }}
    onKeyDown={event => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        event.preventDefault(); event.stopPropagation(); move(event.key === 'ArrowRight' ? 1 : -1)
      }
    }}>
    <header className={s.photoViewerHeading}><h2 id={id}>Imagen {index + 1} de {photos.length}</h2><button className={s.iconButton} type="button" aria-label="Cerrar imagen ampliada" onClick={onClose}><CommunityIcon name="close" /></button></header>
    <figure><div className={s.photoViewerImage}><StockImage key={photo.id} photo={photo} /></div><figcaption aria-live="polite">{photo.caption || photo.alt}</figcaption></figure>
    {photos.length > 1 && <nav className={s.photoViewerControls} aria-label="Recorrer imágenes ampliadas"><button type="button" className={s.secondaryButton} onClick={() => move(-1)}><span className={s.photoViewerPrevious}><CommunityIcon name="arrow" /></span>Anterior</button><span aria-hidden="true">{index + 1} / {photos.length}</span><button type="button" className={s.secondaryButton} onClick={() => move(1)}>Siguiente<CommunityIcon name="arrow" /></button></nav>}
  </dialog>
}
