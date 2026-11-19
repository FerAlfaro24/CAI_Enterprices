import type { Photo } from '../types'
import { albumCategoryLabels, type Album, type AlbumCategory } from './albums'
import { GalleryImage } from './GalleryImage'
import s from './gallery.module.css'

export type GalleryPhoto = {
  photo: Photo
  title: string
  category: AlbumCategory
  createdAt: string
  album: Album
}

export function PhotoGrid({ photos, onOpen }: {
  photos: GalleryPhoto[]
  onOpen: (album: Album, photoId: string) => void
}) {
  return <div className={s.photoGrid} aria-label="Fotografías de la comunidad">
    {photos.map((item, index) => <button
      type="button"
      key={item.photo.id}
      className={s.photoTile}
      aria-label={`Ver foto ${index + 1}: ${item.photo.alt}`}
      aria-haspopup="dialog"
      onClick={() => onOpen(item.album, item.photo.id)}
    >
      <GalleryImage photo={item.photo} />
      <span className={s.photoTileBody}>
        <small>{albumCategoryLabels[item.category]}</small>
        <strong>{item.title}</strong>
        <span>{item.album.standalone ? 'Fotografía individual' : item.album.title}</span>
      </span>
    </button>)}
  </div>
}
