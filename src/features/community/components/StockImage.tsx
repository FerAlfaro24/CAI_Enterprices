import { useState } from 'react'
import type { Photo } from '../types'
import s from '../community.module.css'
import { CommunityIcon } from './ui'

export function StockImage({ photo }: { photo: Photo }) {
  const [failed, setFailed] = useState(false)
  return failed
    ? <div className={s.imageFallback}><CommunityIcon name="gallery" /><span>Fotografía no disponible</span><span>{photo.alt}</span></div>
    : <img src={photo.src} alt={photo.alt} width="900" height="600" loading="lazy" decoding="async" onError={() => setFailed(true)} />
}
