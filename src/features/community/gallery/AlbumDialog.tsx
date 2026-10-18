import { useId, useState } from 'react'
import { useCommunityDialogs } from '../dialogContext'
import { useCommunityDialog } from '../useCommunityDialog'
import { formatPostDate } from '../model'
import { StockImage } from '../components/PostMedia'
import { CommunityIcon } from '../components/ui'
import { MemberLink } from '../components/MemberLink'
import { getMember } from '../data/members'
import { albumCategoryLabels, type Album } from './albums'
import s from './gallery.module.css'

export function AlbumDialog({ album, onClose }: { album: Album; onClose: () => void }) {
  const dialog = useCommunityDialog()
  const { setDetail } = useCommunityDialogs()
  const [index, setIndex] = useState(0)
  const id = useId()
  const photo = album.photos[index]!
  const move = (direction: number) => setIndex((current) => (current + direction + album.photos.length) % album.photos.length)
  return <dialog ref={dialog} className={s.albumDialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-privacy`} onCancel={(event) => { event.preventDefault(); onClose() }}>
    <header className={s.dialogHeader}><span className={s.eyebrow}><CommunityIcon name="gallery" size={17} /> UN MOMENTO DE LA COMUNIDAD</span><button type="button" className={s.closeButton} aria-label="Cerrar álbum" onClick={onClose}><CommunityIcon name="close" /></button></header>
    <div className={s.dialogGrid}>
      <div className={s.viewer}>
        <figure><div className={s.photoStage} tabIndex={album.photos.length > 1 ? 0 : undefined} role="group" aria-label="Fotografías del álbum" aria-describedby={`${id}-navigation`} onKeyDown={(event) => {
          if (album.photos.length < 2) return
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) }
        }}><StockImage key={photo.id} photo={photo} /></div>
        <div className={s.photoControls}><button type="button" aria-label="Foto anterior del álbum" disabled={album.photos.length < 2} onClick={() => move(-1)}><span aria-hidden="true">←</span></button><span role="status" aria-live="polite" aria-atomic="true">Foto {index + 1} de {album.photos.length}</span><button type="button" aria-label="Foto siguiente del álbum" disabled={album.photos.length < 2} onClick={() => move(1)}><CommunityIcon name="arrow" size={19} /></button></div>
        <figcaption className={s.photoCaption}>{photo.caption}</figcaption></figure>
        <p className={s.navigationHelp} id={`${id}-navigation`}>{album.photos.length > 1 ? 'Usa las flechas o elige una miniatura. También puedes usar ← y → al enfocar la fotografía.' : 'Este álbum contiene una fotografía.'}</p>
        {album.photos.length > 1 && <div className={s.thumbnails} role="group" aria-label="Elegir fotografía">{album.photos.map((item, number) => <button type="button" key={item.id} aria-label={`Ver foto ${number + 1}: ${item.alt}`} aria-pressed={index === number} onClick={() => setIndex(number)}><StockImage photo={item} /></button>)}</div>}
      </div>
      <div className={s.albumInfo}><span className={s.albumMeta}>{albumCategoryLabels[album.category]} · {album.photos.length} {album.photos.length === 1 ? 'foto' : 'fotos'}</span><h2 id={`${id}-title`}>{album.title}</h2><p className={s.description}>{album.description}</p><div className={s.byline}><span>Compartido por <MemberLink member={getMember(album.author.id)} /></span><time dateTime={album.createdAt}>{formatPostDate(album.createdAt)} · Escenario ficticio</time></div><p className={s.privacy} id={`${id}-privacy`}><CommunityIcon name="shield" size={17} /> {album.provenance}</p><button type="button" className={s.postLink} onClick={() => setDetail({ postId: album.postId, comments: true })}>Ver publicación y conversación <CommunityIcon name="arrow" size={17} /></button><small className={s.associatedNote}>Reacciones y comentarios se conservan en la publicación original.</small></div>
    </div>
  </dialog>
}
