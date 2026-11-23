import { useId, useState } from 'react'
import { useAdminModal } from '../useAdminModal'
import { Icon } from './ui'
import s from '../admin.module.css'

function ExpandedPhoto({ photos, start, onClose }: { photos: { id: string; imagePath: string; alt: string }[]; start: number; onClose: () => void }) {
  const ref = useAdminModal(), id = useId()
  const [index, setIndex] = useState(start)
  const photo = photos[index]
  const move = (direction: number) => setIndex(current => (current + direction + photos.length) % photos.length)
  return <dialog ref={ref} className={s.reviewPhotoDialog} aria-labelledby={id} onCancel={e => { e.preventDefault(); e.stopPropagation(); onClose() }} onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); move(e.key === 'ArrowRight' ? 1 : -1) } }}>
    <div className={s['dialog-head']}><h2 id={id}>Foto de revisión {index + 1} de {photos.length}</h2><button type="button" className={s['icon-btn']} aria-label="Cerrar foto de revisión" onClick={onClose}><Icon name="close" /></button></div>
    {photo && <figure><img src={photo.imagePath} alt={photo.alt} /><figcaption>{photo.alt}</figcaption></figure>}
    {photos.length > 1 && <div className={s['dialog-foot']}><button type="button" className={s.btn} onClick={() => move(-1)}>Anterior</button><button type="button" className={s.btn} onClick={() => move(1)}>Siguiente</button></div>}
  </dialog>
}
export function AdminReviewPhotos({ photos }: { photos: { id: string; imagePath: string; alt: string }[] }) {
  const [selected, setSelected] = useState<number | null>(null)
  if (!photos.length) return null
  return <section className={s.reviewPhotos} aria-label="Fotografías para revisar"><p>Revisa también las imágenes antes de decidir. Puedes ampliarlas.</p><div>{photos.map((photo, index) => <button key={photo.id} type="button" aria-label={`Ampliar foto de revisión ${index + 1}`} onClick={() => setSelected(index)}><img src={photo.imagePath} alt={photo.alt} loading="lazy" /><span>Ampliar {index + 1} / {photos.length}</span></button>)}</div>{selected !== null && <ExpandedPhoto photos={photos} start={selected} onClose={() => setSelected(null)} />}</section>
}
