import { useCommunity } from '../context'
import { useCommunityDialogs } from '../dialogContext'
import { privateAlbums } from '../gallery/albums'
import s from './home.module.css'

export function RecentAlbums(){
  const {connection,dispatch}=useCommunity(),{setDetail}=useCommunityDialogs()
  if(!connection)return null
  const albums=privateAlbums(connection.gallery).slice(0,3)
  if(!albums.length)return null
  return <section className={s.recentAlbums} aria-labelledby="recent-albums-title"><header><div><span className={s.sectionEyebrow}>EL ÁLBUM COLECTIVO</span><h2 id="recent-albums-title">Recuerdos para volver a ver</h2></div><button type="button" onClick={()=>dispatch({type:'section',section:'gallery'})}>Toda la galería →</button></header><div>{albums.map(album=><button type="button" key={album.id} onClick={()=>album.postId.startsWith('PUB-')?setDetail({postId:album.postId,comments:false}):dispatch({type:'section',section:'gallery'})}><img src={album.cover.src} alt={album.cover.alt} loading="lazy"/><strong>{album.title}</strong><small>{album.photos.length} {album.photos.length===1?'fotografía':'fotografías'} · Ver recuerdo</small></button>)}</div></section>
}
