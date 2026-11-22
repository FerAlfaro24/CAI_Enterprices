import { PhotoGrid, type GalleryPhoto } from './PhotoGrid'
import { useState } from 'react'
import { m } from 'motion/react'
import { MotionButton } from '../components/CommunityMotion'
import { useCommunity } from '../context'
import { Composer } from '../components/Composer'
import { ModerationPanel, MySubmissions } from '../components/ModerationPanel'
import { CommunityIcon } from '../components/ui'
import { albumCounts, albumFilters, privateAlbums, selectAlbumRecords, selectAlbums, type AlbumFilter, type AlbumSort } from './albums'
import { AlbumCard, type AlbumCardLayout } from './AlbumCard'
import { FeaturedAlbum } from './FeaturedAlbum'
import { AlbumDialog } from './AlbumDialog'
import { useGalleryMotion } from './useGalleryMotion'
import s from './gallery.module.css'

export function GalleryView() {
  const { state, connection } = useCommunity()
  const reduced = useGalleryMotion()
  const [filter, setFilter] = useState<AlbumFilter>('all')
  const [sort, setSort] = useState<AlbumSort>('editorial')
  const [view,setView]=useState<'photos'|'albums'>(connection?'photos':'albums')
  const [openPhotoId,setOpenPhotoId]=useState<string|undefined>()
  const [openId, setOpenId] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const all = connection ? privateAlbums(connection.gallery) : selectAlbums(state.posts)
  const albums = connection ? selectAlbumRecords(all,filter,sort) : selectAlbums(state.posts, filter, sort)
  const counts = albumCounts(albums)
  const collections=albums.filter(album=>!album.standalone).length,individuals=albums.filter(album=>album.standalone).length
  const featured = albums.find((album) => album.postId === 'cai-club') ?? albums[0]
  const open = all.find((album) => album.id === openId)
  const photoAlbums=new Map(all.flatMap(album=>album.photos.map(photo=>[photo.id,album] as const)))
  const photos:GalleryPhoto[]=(connection?.gallery??[]).map(image=>({photo:{id:image.id,src:image.imagePath,alt:image.alt,caption:image.description},title:image.title,category:image.category,createdAt:image.createdAt,album:photoAlbums.get(image.id)!})).filter(item=>filter==='all'||item.category===filter)
  if(sort!=='editorial')photos.sort((a,b)=>(sort==='oldest'?1:-1)*(Date.parse(a.createdAt)-Date.parse(b.createdAt))||a.photo.id.localeCompare(b.photo.id))
  const openAlbum=(albumId:string,photoId?:string)=>{setOpenPhotoId(photoId);setOpenId(albumId)}
  const hasResults=view==='photos'?photos.length>0:albums.length>0
  // An editorial arrangement of the current results, never copies of those albums.
  const layout = (index: number): AlbumCardLayout => index === 0 ? 'large' : index < 3 ? 'compact' : index === 3 ? 'horizontal' : 'standard'
  return <div className={`${s.gallery} ${connection?s.connectedGallery:''}`}>
    <header className={s.pageHeading}><div><span className={s.eyebrow}><CommunityIcon name="gallery" size={17} /> NUESTRA GALERÍA <span className={s.headingIssue}>EL ÁLBUM COLECTIVO</span></span><h1 id="community-title" tabIndex={-1}>Así se vive <em>CAI</em></h1><p>Clases, amigos y momentos que merecen quedarse en el recuerdo.</p></div><aside className={s.shareCard}>{connection ? <details className={s.galleryHelp}><summary><CommunityIcon name="shield" size={18}/> ¿Quién puede ver estas fotos?</summary><p>Coordinación revisa y publica las imágenes con sus permisos. Aquí ves las imágenes compartidas con todos los alumnos aprobados y las destinadas a tu grupo.</p></details> : <><span className={s.shareMark} aria-hidden="true"><CommunityIcon name="plus" size={22} /></span><h2>¿Tienes una foto que contar?</h2><p>Comparte tu momento favorito con la comunidad.</p><MotionButton type="button" onClick={() => setComposerOpen(true)} aria-haspopup="dialog">Compartir foto <CommunityIcon name="arrow" size={16} /></MotionButton></>}</aside></header>
    {connection&&<div className={s.viewChoices} role="group" aria-label="Ver galería como"><MotionButton type="button" aria-pressed={view==='photos'} onClick={()=>setView('photos')}>Fotos</MotionButton><MotionButton type="button" aria-pressed={view==='albums'} onClick={()=>setView('albums')}>Álbumes</MotionButton></div>}
    {view==='albums'&&featured && <FeaturedAlbum album={featured} onOpen={() => openAlbum(featured.id)} />}
    <div className={s.filters} role="group" aria-label="Filtrar galería">{albumFilters.map((item) => <MotionButton type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</MotionButton>)}</div>
    <section className={s.albumsSection} aria-labelledby="gallery-albums-title">
      <div className={s.mosaicHeading}><div>{!connection&&<span className={s.sectionEyebrow}>MOMENTOS QUE SE QUEDAN</span>}<h2 id="gallery-albums-title">{connection?(view==='photos'?'Todas las miradas de CAI':'Historias en álbumes'):<>{'Un vistazo a lo que vivimos'}<span aria-hidden="true">.</span></>}</h2>{!connection&&<p>Explora historias, celebraciones y días que se volvieron especiales.</p>}</div><div className={s.sort}><label htmlFor="gallery-album-sort">{view==='photos'?'Orden de fotos':'Orden de álbumes'}</label><select id="gallery-album-sort" value={sort} onChange={(event) => setSort(event.target.value as AlbumSort)}><option value="editorial">Selección CAI</option><option value="recent">Recientes ↓</option><option value="oldest">Primeros recuerdos ↑</option>{!connection && <option value="celebrated">Más celebrados</option>}</select></div></div>
      <p className={s.counts} role="status" aria-live="polite" aria-atomic="true">{view==='photos'?`${photos.length} ${photos.length===1?'fotografía disponible':'fotografías disponibles'}`:<>{collections} {collections === 1 ? 'álbum' : 'álbumes'}{individuals>0&&` · ${individuals} ${individuals===1?'foto individual':'fotos individuales'}`} · {counts.photos} {counts.photos === 1 ? 'fotografía disponible' : 'fotografías disponibles'}</>} · {connection ? 'Comunidad y tu grupo' : 'Contenido ilustrativo'}</p>
      {hasResults ? view==='photos'?<PhotoGrid photos={photos} onOpen={(album,photoId)=>openAlbum(album.id,photoId)}/>:<m.div key={`${filter}-${sort}`} className={`${s.mosaic} ${albums.length === 6 ? s.sixAlbums : ''} ${albums.length < 4 ? s.shortMosaic : ''}`} aria-label="Álbumes de la comunidad" initial={{ opacity: reduced ? 1 : .8 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : .18 }}>{albums.map((album, index) => <AlbumCard key={album.id} album={album} layout={layout(index)} onOpen={() => openAlbum(album.id)} />)}</m.div> : <div className={s.empty}><span className={s.emptyFrames} aria-hidden="true"><CommunityIcon name="gallery" size={34} /></span><span className={s.sectionEyebrow}>EL PRÓXIMO RECUERDO PUEDE SER TUYO</span><h3>Aquí todavía hay momentos por guardar.</h3><p>No hay fotografías de {albumFilters.find((item) => item.id === filter)?.label.toLowerCase() ?? 'esta categoría'} {connection ? 'para tu cuenta.' : 'en la demostración.'}</p><MotionButton type="button" onClick={() => setFilter('all')}>Quitar filtro <CommunityIcon name="arrow" size={17} /></MotionButton></div>}
    </section>
    {!connection && <div className={s.moderation}><ModerationPanel /><MySubmissions /></div>}
    <p className={s.galleryNote}><CommunityIcon name="shield" size={16} /> {connection ? 'Galería privada. Las imágenes son gestionadas por coordinación y requieren autorización.' : 'Galería conceptual · Las fotografías definitivas requieren autorización de CAI.'}</p>
    {composerOpen && <Composer initialCategory="gallery" onClose={() => setComposerOpen(false)} />}
    {open && <AlbumDialog key={`${open.id}:${openPhotoId??''}`} album={open} initialPhotoId={openPhotoId} onClose={() => setOpenId(null)} />}
  </div>
}
