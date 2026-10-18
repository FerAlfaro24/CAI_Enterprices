import { useState } from 'react'
import { CommunityIcon } from '../components/ui'
import type { Album } from './albums'
import { albumPresentation } from './presentation'
import { galleryCover } from './media'
import { GalleryImage } from './GalleryImage'
import s from './gallery.module.css'

export function AlbumCover({ album, mode }: { album: Album; mode?: 'illustration' | 'photo' }) {
  const artwork = mode === 'photo' ? null : galleryCover(album)
  const [failedSource, setFailedSource] = useState<string | null>(null)
  return <div className={`${s.cover} ${artwork ? s.illustratedCover : s.photographicCover}`} style={artwork ? { background: artwork.background } : undefined} data-cover-kind={artwork ? 'artwork' : 'photo'}>
    {artwork ? failedSource === artwork.src
      ? <div className={s.artworkFallback}><CommunityIcon name="gallery" size={30} /><strong>{albumPresentation(album).title}</strong><span>Ilustración no disponible</span></div>
      : <img src={artwork.src} alt={artwork.alt} width="600" height="400" onError={() => setFailedSource(artwork.src)} />
      : <GalleryImage key={album.cover.src} photo={album.cover} />}
    <span className={s.coverCount}><CommunityIcon name="gallery" size={13} />{album.photos.length}<span className={s.srOnly}> {album.photos.length === 1 ? 'foto en el álbum' : 'fotos en el álbum'}</span></span>
    <span className={s.coverFlag}>{artwork ? 'Ilustración original' : 'Foto ilustrativa · Unsplash'}</span>
  </div>
}
