import { CommunityIcon } from '../components/ui'
import type { Album } from './albums'
import s from './gallery.module.css'

export function FeaturedAlbum({ album, onOpen }: { album: Album; onOpen: () => void }) {
  const speaking = album.postId === 'cai-club'
  return <section className={s.featured} aria-labelledby="featured-album-title">
    <div className={s.featuredCopy}><span className={s.featuredTag}><CommunityIcon name="spark" size={14} /> ÁLBUM DESTACADO</span><h2 id="featured-album-title">{speaking ? <>El día que nadie<br /> se quedó callado <span aria-hidden="true">🎤</span></> : album.title}</h2><p>{speaking ? 'Speaking Day: una invitación ficticia a conversar, reír y animarse a hablar.' : album.description}</p><button type="button" onClick={onOpen} aria-haspopup="dialog">Explorar álbum <CommunityIcon name="arrow" size={15} /></button></div>
    <div className={s.featuredArt} aria-hidden="true"><div className={s.speakingTile}><span>🎤</span><strong>{speaking ? <>SPEAKING<br /> DAY</> : 'NUESTROS MOMENTOS'}</strong></div><div className={s.friendsTile}><span>✌️</span><strong>Amigos + inglés</strong></div><div className={s.successTile}><span>🏅</span><strong>¡Se logró!</strong></div></div>
  </section>
}
