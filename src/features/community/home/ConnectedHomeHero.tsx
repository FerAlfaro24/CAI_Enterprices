import { useEffect, useId, useState } from 'react'
import { useReducedMotionPreference } from '../useReducedMotionPreference'
import { useCommunity } from '../context'
import { useCommunityDialogs } from '../dialogContext'
import { CommunityIcon } from '../components/ui'
import s from './home.module.css'

export function ConnectedHomeHero() {
  const {state,connection,dispatch}=useCommunity(),{setDetail}=useCommunityDialogs()
  const reduced=useReducedMotionPreference(),id=useId()
  const [index,setIndex]=useState(0),[paused,setPaused]=useState(false),[interacting,setInteracting]=useState(false),[hidden,setHidden]=useState(document.hidden)
  const stories=[...state.posts].filter(p=>p.photos.length).sort((a,b)=>Number(Boolean(b.highlighted))-Number(Boolean(a.highlighted))||Date.parse(b.createdAt)-Date.parse(a.createdAt))
  const used=new Set(stories.flatMap(post=>post.photos.map(photo=>photo.id)))
  const slides=[...stories.map(post=>({id:post.id,title:post.title,description:post.body,photo:post.photos[0]!,label:post.category==='gallery'?'ÁLBUM DE CAI':'HISTORIA DESTACADA',cta:'Ver historia y fotos',open:()=>setDetail({postId:post.id,comments:false})})),...connection!.gallery.filter(image=>!used.has(image.id)).map(image=>({id:image.id,title:image.title,description:image.description,photo:{src:image.imagePath,alt:image.alt},label:'RECUERDOS DE LA COMUNIDAD',cta:'Abrir galería',open:()=>dispatch({type:'section',section:'gallery'})}))].slice(0,5)
  const slide=slides[index%Math.max(slides.length,1)]
  const rotating=slides.length>1&&!paused&&!interacting&&!reduced&&!hidden
  useEffect(()=>{const change=()=>setHidden(document.hidden);document.addEventListener('visibilitychange',change);return()=>document.removeEventListener('visibilitychange',change)},[])
  useEffect(()=>{if(!rotating)return;const timer=setInterval(()=>setIndex(i=>(i+1)%slides.length),8000);return()=>clearInterval(timer)},[rotating,slides.length])
  const move=(next:number)=>{setPaused(true);setIndex((next+slides.length)%slides.length)}
  return <section className={s.liveHero} aria-labelledby="community-title">
    <header className={s.liveWelcome}><div><span className={s.sectionEyebrow}>EL INGLÉS NOS CONECTA</span><h1 id="community-title" tabIndex={-1}>Tu comunidad, <em>en imágenes.</em></h1><p>Historias, encuentros y pequeños avances que compartimos en CAI.</p></div><button className={s.navyButton} type="button" onClick={()=>dispatch({type:'section',section:'challenges'})}>Practicar inglés <CommunityIcon name="arrow" size={17}/></button></header>
    {slide?<div className={s.liveFeature} role="region" aria-roledescription="carrusel" aria-label="Destacados de la comunidad" onMouseEnter={()=>setInteracting(true)} onMouseLeave={()=>setInteracting(false)} onFocusCapture={()=>setInteracting(true)} onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setInteracting(false)}}>
      <button className={s.livePhoto} type="button" onClick={slide.open} aria-label={`Abrir: ${slide.title}`}><img className={s.liveBackdrop} src={slide.photo.src} alt="" aria-hidden="true"/><img className={s.liveMainPhoto} src={slide.photo.src} alt={slide.photo.alt} fetchPriority="high"/></button>
      <div className={s.liveCaption} id={id} aria-live={rotating?'off':'polite'} aria-atomic="true"><span>{slide.label}</span><h2>{slide.title}</h2><p>{slide.description}</p><button type="button" className={s.yellowButton} onClick={slide.open}>{slide.cta} <CommunityIcon name="arrow" size={17}/></button>
        {slides.length>1&&<div className={s.liveControls}><button type="button" aria-label="Destacado anterior" onClick={()=>move(index-1)}>←</button><span>{index%slides.length+1} / {slides.length}</span><button type="button" aria-label="Siguiente destacado" onClick={()=>move(index+1)}>→</button><button type="button" aria-label={paused?'Activar avance automático':'Pausar avance automático'} disabled={Boolean(reduced)} onClick={()=>setPaused(v=>!v)}>{paused||reduced?'▶':'Ⅱ'}</button></div>}
      </div>
    </div>:<div className={s.liveEmpty}><CommunityIcon name="gallery" size={32}/><p>Aquí aparecerán las fotografías y las historias que coordinación comparta con tu comunidad.</p></div>}
  </section>
}
