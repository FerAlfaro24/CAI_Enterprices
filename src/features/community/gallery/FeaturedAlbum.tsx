import { CommunityIcon } from '../components/ui'
import type { Album } from './albums'
import { albumCategoryLabels } from './albums'
import { MotionButton } from '../components/CommunityMotion'
import { AlbumCover } from './AlbumCover'
import s from './gallery.module.css'

export function FeaturedAlbum({ album, onOpen }: { album: Album; onOpen: () => void }) {
  const speaking = album.postId === 'cai-club'
  return <section className={s.featured} aria-labelledby="featured-album-title">
    <div className={s.featuredCopy}><span className={s.featuredTag}><CommunityIcon name="spark" size={16} /> ÁLBUM DESTACADO <span aria-hidden="true">/ 01</span></span><h2 id="featured-album-title">{speaking ? <>El día que nadie<br /> se quedó <em>callado.</em></> : album.title}</h2><p>{speaking ? 'Speaking Day: una invitación ficticia a conversar, reír y animarse a hablar.' : album.description}</p><div className={s.featuredFooter}><MotionButton type="button" onClick={onOpen} aria-haspopup="dialog">Explorar álbum <CommunityIcon name="arrow" size={18} /></MotionButton><span>{albumCategoryLabels[album.category]}<strong>{album.photos.length} {album.photos.length === 1 ? 'foto' : 'fotos'} · Demo</strong></span></div></div>
    <div className={s.featuredArt}><AlbumCover album={album} /></div>
  </section>
}
