import { useState } from 'react'
import { m } from 'motion/react'
import { MotionButton } from '../components/CommunityMotion'
import { useCommunity } from '../context'
import { Composer } from '../components/Composer'
import { ModerationPanel, MySubmissions } from '../components/ModerationPanel'
import { CommunityIcon } from '../components/ui'
import { albumCounts, albumFilters, selectAlbums, type AlbumFilter, type AlbumSort } from './albums'
import { AlbumCard, type AlbumCardLayout } from './AlbumCard'
import { FeaturedAlbum } from './FeaturedAlbum'
import { AlbumDialog } from './AlbumDialog'
import { useGalleryMotion } from './useGalleryMotion'
import s from './gallery.module.css'

export function GalleryView() {
  const { state } = useCommunity()
  const reduced = useGalleryMotion()
  const [filter, setFilter] = useState<AlbumFilter>('all')
  const [sort, setSort] = useState<AlbumSort>('editorial')
  const [openId, setOpenId] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const all = selectAlbums(state.posts)
  const albums = selectAlbums(state.posts, filter, sort)
  const counts = albumCounts(albums)
  const featured = all.find((album) => album.postId === 'cai-club') ?? all[0]
  const open = all.find((album) => album.id === openId)
  // An editorial arrangement of the current results, never copies of those albums.
  const layout = (index: number): AlbumCardLayout => index === 0 ? 'large' : index < 3 ? 'compact' : index === 3 ? 'horizontal' : 'standard'
  return <div className={s.gallery}>
    <header className={s.pageHeading}><div><span className={s.eyebrow}><CommunityIcon name="gallery" size={17} /> NUESTRA GALERÍA <span className={s.headingIssue}>EL ÁLBUM COLECTIVO</span></span><h1 id="community-title" tabIndex={-1}>Así se vive <em>CAI</em></h1><p>Clases, amigos y momentos que merecen quedarse en el recuerdo.</p></div><aside className={s.shareCard}><span className={s.shareMark} aria-hidden="true"><CommunityIcon name="plus" size={22} /></span><h2>¿Tienes una foto que contar?</h2><p>Comparte tu momento favorito con la comunidad.</p><MotionButton type="button" onClick={() => setComposerOpen(true)} aria-haspopup="dialog">Compartir foto <CommunityIcon name="arrow" size={16} /></MotionButton></aside></header>
    {featured && <FeaturedAlbum album={featured} onOpen={() => setOpenId(featured.id)} />}
    <div className={s.filters} role="group" aria-label="Filtrar álbumes">{albumFilters.map((item) => <MotionButton type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</MotionButton>)}</div>
    <section className={s.albumsSection} aria-labelledby="gallery-albums-title">
      <div className={s.mosaicHeading}><div><span className={s.sectionEyebrow}>MOMENTOS QUE SE QUEDAN</span><h2 id="gallery-albums-title">Un vistazo a lo que vivimos<span aria-hidden="true">.</span></h2><p>Explora historias, celebraciones y días que se volvieron especiales.</p></div><div className={s.sort}><label htmlFor="gallery-album-sort">Orden de álbumes</label><select id="gallery-album-sort" value={sort} onChange={(event) => setSort(event.target.value as AlbumSort)}><option value="editorial">Selección CAI</option><option value="recent">Recientes ↓</option><option value="oldest">Primeros recuerdos ↑</option><option value="celebrated">Más celebrados</option></select></div></div>
      <p className={s.counts} role="status" aria-live="polite" aria-atomic="true">{counts.albums} {counts.albums === 1 ? 'álbum' : 'álbumes'} · {counts.photos} {counts.photos === 1 ? 'foto' : 'fotos'} en estos álbumes · Contenido ilustrativo</p>
      {albums.length ? <m.div key={`${filter}-${sort}`} className={`${s.mosaic} ${albums.length === 6 ? s.sixAlbums : ''} ${albums.length < 4 ? s.shortMosaic : ''}`} aria-label="Álbumes de la comunidad" initial={{ opacity: reduced ? 1 : .8 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : .18 }}>{albums.map((album, index) => <AlbumCard key={album.id} album={album} layout={layout(index)} onOpen={() => setOpenId(album.id)} />)}</m.div> : <div className={s.empty}><span className={s.emptyFrames} aria-hidden="true"><CommunityIcon name="gallery" size={34} /></span><span className={s.sectionEyebrow}>EL PRÓXIMO RECUERDO PUEDE SER TUYO</span><h3>Aquí todavía hay momentos por guardar.</h3><p>No hay álbumes aprobados de {albumFilters.find((item) => item.id === filter)?.label.toLowerCase() ?? 'esta categoría'} en la demostración.</p><MotionButton type="button" onClick={() => setFilter('all')}>Ver todas las fotos <CommunityIcon name="arrow" size={17} /></MotionButton></div>}
    </section>
    <div className={s.moderation}><ModerationPanel /><MySubmissions /></div>
    <p className={s.galleryNote}><CommunityIcon name="shield" size={16} /> Galería conceptual · Las fotografías definitivas requieren autorización de CAI.</p>
    {composerOpen && <Composer initialCategory="gallery" onClose={() => setComposerOpen(false)} />}
    {open && <AlbumDialog key={open.id} album={open} onClose={() => setOpenId(null)} />}
  </div>
}
