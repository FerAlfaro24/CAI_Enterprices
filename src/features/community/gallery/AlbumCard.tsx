import { albumCategoryLabels, formatAlbumDate, type Album } from './albums'
import { albumPresentation } from './presentation'
import { AlbumCover } from './AlbumCover'
import s from './gallery.module.css'

export type AlbumCardLayout = 'large' | 'compact' | 'horizontal' | 'standard'

export function AlbumCard({ album, layout, onOpen }: { album: Album; layout: AlbumCardLayout; onOpen: () => void }) {
  const visual = albumPresentation(album)
  return <article className={`${s.albumCard} ${s[layout]}`} aria-label={album.title}>
    <button type="button" className={s.albumButton} onClick={onOpen} aria-label={`Explorar álbum: ${album.title}`} aria-haspopup="dialog">
      <AlbumCover album={album} />
      <div className={s.albumBody}><span className={s.albumMeta}>{albumCategoryLabels[album.category]} · {album.photos.length} {album.photos.length === 1 ? 'FOTO' : 'FOTOS'}</span><h3>{visual.title}</h3>{layout === 'horizontal' && <p>Una colección de momentos para seguir aprendiendo.</p>}<span className={s.albumDate}>{formatAlbumDate(album.createdAt)}{layout === 'large' ? ` · ${album.celebrations} celebraciones` : ''}</span>{layout === 'horizontal' && <span className={s.albumLink}>Ver {album.photos.length} {album.photos.length === 1 ? 'foto' : 'fotos'} <span aria-hidden="true">→</span></span>}</div>
    </button>
  </article>
}
