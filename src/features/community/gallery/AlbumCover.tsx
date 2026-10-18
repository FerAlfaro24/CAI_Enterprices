import { StockImage } from '../components/PostMedia'
import type { Album } from './albums'
import { albumPresentation } from './presentation'
import s from './gallery.module.css'

/** Change mode to photo when CAI supplies authorized institutional covers. */
export function AlbumCover({ album, mode = 'illustration' }: { album: Album; mode?: 'illustration' | 'photo' }) {
  const visual = albumPresentation(album)
  return <div className={`${s.cover} ${s[visual.tone]}`}>
    {mode === 'photo' ? <StockImage key={album.cover.id} photo={album.cover} /> : <div className={s.illustration} aria-hidden="true"><span className={s.coverSymbol}>{visual.symbol}</span>{visual.label && <strong>{visual.label}</strong>}<span className={s.illustrationLabel}>IMAGEN ILUSTRATIVA</span></div>}
  </div>
}
