import { albumCategoryLabels, formatAlbumDate, type Album } from './albums'
import { albumPresentation } from './presentation'
import { AlbumCover } from './AlbumCover'
import { m } from 'motion/react'
import { CommunityIcon } from '../components/ui'
import { useGalleryMotion } from './useGalleryMotion'
import s from './gallery.module.css'

export type AlbumCardLayout = 'large' | 'compact' | 'horizontal' | 'standard'

export function AlbumCard({ album, layout, onOpen }: { album: Album; layout: AlbumCardLayout; onOpen: () => void }) {
  const visual = albumPresentation(album)
  const reduced = useGalleryMotion()
  return <m.article className={`${s.albumCard} ${s[layout]}`} aria-label={album.title} data-layout={layout} whileHover={reduced ? undefined : { y: -3 }}>
    <button type="button" className={s.albumButton} onClick={onOpen} aria-label={`Explorar álbum: ${album.title}`} aria-haspopup="dialog">
      <AlbumCover album={album} />
      <div className={s.albumBody}><span className={s.albumMeta}>{albumCategoryLabels[album.category]} · {album.photos.length} {album.photos.length === 1 ? 'FOTO' : 'FOTOS'}</span><h3>{visual.title}</h3><span className={s.albumDate}>{formatAlbumDate(album.createdAt,album.private)}{layout === 'large' && !album.private ? ` · ${album.celebrations} celebraciones` : ''}</span><span className={s.albumLink}>Abrir historia <CommunityIcon name="arrow" size={17} /></span></div>
    </button>
  </m.article>
}
