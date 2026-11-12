import { useId, useState } from 'react'
import { m } from 'motion/react'
import { useCommunityDialogs } from '../dialogContext'
import { useCommunityDialog } from '../useCommunityDialog'
import { formatPostDate } from '../model'
import { MotionButton } from '../components/CommunityMotion'
import { CommunityIcon } from '../components/ui'
import { MemberLink } from '../components/MemberLink'
import { getMember } from '../data/members'
import { albumCategoryLabels, formatAlbumDate, type Album } from './albums'
import { GalleryImage } from './GalleryImage'
import { useGalleryMotion } from './useGalleryMotion'
import s from './gallery.module.css'

export function AlbumDialog({ album, onClose }: { album: Album; onClose: () => void }) {
  const dialog = useCommunityDialog()
  const reduced = useGalleryMotion()
  const { setDetail } = useCommunityDialogs()
  const [index, setIndex] = useState(0)
  const id = useId()
  const photo = album.photos[index]!
  const move = (direction: number) => setIndex((current) => (current + direction + album.photos.length) % album.photos.length)
  return <m.dialog ref={dialog} className={s.albumDialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-privacy`} initial={{ opacity: reduced ? 1 : .8, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .2 }} onCancel={(event) => { event.preventDefault(); onClose() }}>
    <header className={s.dialogHeader}><span className={s.eyebrow}><CommunityIcon name="gallery" size={17} /> UN MOMENTO DE LA COMUNIDAD</span><MotionButton type="button" className={s.closeButton} aria-label="Cerrar álbum" onClick={onClose}><CommunityIcon name="close" /></MotionButton></header>
    <div className={s.dialogGrid}>
      <div className={s.viewer}>
        <figure><div className={s.photoStage} tabIndex={album.photos.length > 1 ? 0 : undefined} role="group" aria-label="Fotografías del álbum" aria-describedby={`${id}-navigation`} onKeyDown={(event) => {
          if (album.photos.length < 2) return
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) }
        }}><m.div key={photo.src} className={s.photoFrame} initial={{ opacity: reduced ? 1 : .65 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : .16 }}><GalleryImage photo={photo} eager /></m.div></div>
        <div className={s.photoControls}><MotionButton type="button" aria-label="Foto anterior del álbum" disabled={album.photos.length < 2} onClick={() => move(-1)}><span aria-hidden="true">←</span></MotionButton><span role="status" aria-live="polite" aria-atomic="true">Foto {index + 1} de {album.photos.length}</span><MotionButton type="button" aria-label="Foto siguiente del álbum" disabled={album.photos.length < 2} onClick={() => move(1)}><CommunityIcon name="arrow" size={19} /></MotionButton></div>
        <figcaption className={s.photoCaption}>{photo.caption}</figcaption></figure>
        <p className={s.navigationHelp} id={`${id}-navigation`}>{album.photos.length > 1 ? 'Usa las flechas o elige una miniatura. También puedes usar ← y → al enfocar la fotografía.' : 'Este álbum contiene una fotografía.'}</p>
        {album.photos.length > 1 && <div className={s.thumbnails} role="group" aria-label="Elegir fotografía">{album.photos.map((item, number) => <MotionButton type="button" key={item.src} aria-label={`Ver foto ${number + 1}: ${item.alt}`} aria-pressed={index === number} onClick={() => setIndex(number)}><GalleryImage photo={item} /><span aria-hidden="true">0{number + 1}</span></MotionButton>)}</div>}
      </div>
      <div className={s.albumInfo}><span className={s.albumMeta}>{albumCategoryLabels[album.category]} · {album.photos.length} {album.photos.length === 1 ? 'foto' : 'fotos'}</span><h2 id={`${id}-title`}>{album.title}</h2><p className={s.description}>{album.description}</p><div className={s.byline}><span>Compartido por {album.private ? <strong>{album.author.alias}</strong> : <MemberLink member={getMember(album.author.id)} />}</span><time dateTime={album.createdAt}>{album.private ? formatAlbumDate(album.createdAt,true) : `${formatPostDate(album.createdAt)} · Escenario ficticio`}</time></div><p className={s.privacy} id={`${id}-privacy`}><CommunityIcon name="shield" size={17} /> {album.provenance}</p>{!album.private && <><button type="button" className={s.postLink} onClick={() => setDetail({ postId: album.postId, comments: true })}>Ver publicación y conversación <CommunityIcon name="arrow" size={17} /></button><small className={s.associatedNote}>Reacciones y comentarios se conservan en la publicación original.</small></>}</div>
    </div>
  </m.dialog>
}
