import { useId, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { PhotoViewer } from './PhotoViewer'
import { StockImage } from './StockImage'
export { StockImage } from './StockImage'
import type { Post } from '../types'
import s from '../community.module.css'
import { CommunityIcon } from './ui'

export function PostMedia({ post }: { post: Post }) {
  const [index, setIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const captionId = useId()
  const photo = post.photos[index]
  if (!photo) return null
  const gallery = post.photos.length > 1
  const move = (direction: number) => setIndex((current) => (current + direction + post.photos.length) % post.photos.length)

  return (
    <>
    <figure className={[s.postMedia, post.layout === 'compact' ? s.compactMedia : '', gallery ? s.galleryMedia : ''].join(' ')}>
      <div className={s.imageFrame} role={gallery ? 'group' : undefined} aria-label={gallery ? `Galería: ${post.title}` : undefined} tabIndex={gallery ? 0 : undefined} aria-describedby={gallery ? captionId : undefined} onKeyDown={(event) => {
        if (!gallery) return
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) }
      }}>
        <button type="button" className={s.photoOpen} aria-label={`Ampliar imagen ${index + 1} de ${post.photos.length}: ${photo.alt}`} onClick={() => setExpanded(true)}><StockImage key={photo.id} photo={photo} /></button>
        <button type="button" className={s.expandPhoto} aria-label={`Ampliar foto de ${post.title}`} onClick={() => setExpanded(true)}><Maximize2 size={17} aria-hidden="true" />Ampliar</button>
        {gallery && <>
          <span className={s.imageCounter} aria-hidden="true">{index + 1} / {post.photos.length}</span>
          <button className={s.previousPhoto} type="button" aria-label={`Foto anterior de ${post.title}`} onClick={() => move(-1)}><CommunityIcon name="arrow" size={18} /></button>
          <button className={s.nextPhoto} type="button" aria-label={`Foto siguiente de ${post.title}`} onClick={() => move(1)}><CommunityIcon name="arrow" size={18} /></button>
        </>}
      </div>
      <figcaption id={captionId} aria-live={gallery ? 'polite' : undefined}>
        {gallery && <span className={s.galleryPosition}>Imagen {index + 1} de {post.photos.length}. </span>}{photo.caption}
      </figcaption>
    </figure>
    {expanded && <PhotoViewer photos={post.photos} index={index} onChange={setIndex} onClose={() => setExpanded(false)} />}
    </>
  )
}
