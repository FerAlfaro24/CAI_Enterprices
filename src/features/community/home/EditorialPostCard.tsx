import { useId, useRef, useState } from 'react'
import { useCommunity } from '../context'
import { useCommunityDialogs } from '../dialogContext'
import { categoryLabels, reactionOptions } from '../data/fixtures'
import { getMember } from '../data/members'
import { celebrationCount, formatPostDate } from '../model'
import type { Post } from '../types'
import { MemberLink } from '../components/MemberLink'
import { CommunityIcon } from '../components/ui'
import { StockImage } from '../components/PostMedia'
import { MotionButton, MotionCard, MotionFeedback } from '../components/CommunityMotion'
import s from './home.module.css'

export function EditorialPostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const { dispatch } = useCommunity()
  const { setDetail } = useCommunityDialogs()
  const [reactionsOpen, setReactionsOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const id = useId()
  const author = getMember(post.authorId)
  const chosen = reactionOptions.find((option) => option.id === post.myReaction)
  const open = (comments = false) => setDetail({ postId: post.id, comments })
  const cover = !featured && (post.photos.length > 0 || post.milestone || post.id === 'dani-song')
  return <MotionCard className={`${s.editorialCard} ${featured ? s.featured : ''}`} data-category={post.category} data-institution={author.institution || undefined} id={`editorial-${post.id}`} aria-labelledby={`${id}-title`}>
    {cover && <button type="button" className={`${s.cover} ${post.photos.length ? s.photoCover : post.milestone ? s.achievementCover : s.storyCover}`} onClick={() => open()} aria-label={`Leer: ${post.title}`} tabIndex={-1}>
      {post.photos.length ? <><StockImage photo={post.photos[0]!} /><span className={s.photoLabel}>{post.photos.length > 1 ? `${post.photos.length} fotos ilustrativas · Ver galería` : 'Imagen ilustrativa · Unsplash'}</span></> : <><span className={s.coverKicker}>{post.milestone ? 'CADA INTENTO CUENTA' : 'EN MI PLAYLIST'}</span><strong>{post.milestone ? <>SMALL<br />STEPS!</> : <>MY ENGLISH<br />ERA.</>}</strong><i className={s.coverSymbol} aria-hidden="true">{post.milestone ? '✦' : '♫'}</i><span className={s.coverFootnote}>Una historia de nuestra comunidad ↗</span></>}
    </button>}
    <div className={s.cardContent}>
      <header className={s.cardAuthor}><MemberLink member={author} avatar small={!featured} /><div><strong><MemberLink member={author} /></strong><time dateTime={post.createdAt}>{formatPostDate(post.createdAt)}</time></div><span className={s.postCategory}>{categoryLabels[post.category]}</span></header>
      {featured && <span className={s.storyEyebrow}>{post.category === 'achievement' ? 'PEQUEÑOS GRANDES AVANCES' : author.institution ? 'LA VOZ DE CAI' : 'HISTORIAS QUE NOS CONECTAN'}</span>}
      <h3 id={`${id}-title`}><button type="button" onClick={() => open()}>{post.title}</button></h3>
      {(featured || !cover) && <p className={s.cardBody}>{post.body}</p>}
      {featured && post.milestone && <div className={s.pullQuote}><CommunityIcon name="award" size={26} /><div><strong>{post.milestone.label}</strong><span>{post.milestone.detail}</span></div></div>}
      {featured && post.photos.length > 0 && <button className={s.featuredPhoto} type="button" onClick={() => open()} aria-label={`Ver imágenes de ${post.title}`}><StockImage photo={post.photos[0]!} /><span>{post.photos.length > 1 ? `${post.photos.length} fotos · Abrir galería` : 'Fotografía ilustrativa · Abrir'}</span></button>}
      {post.event && <div className={s.eventTeaser}><span><strong>{post.event.day}</strong>{post.event.month}</span><p>{post.event.detail}</p></div>}
      <div className={s.cardFooter}>
        <span className={s.celebrationCount}><span aria-hidden="true">💙 👏</span> <MotionFeedback key={celebrationCount(post)}>{celebrationCount(post)}</MotionFeedback><span className={s.srOnly}> celebraciones</span></span>
        <button type="button" className={s.commentCount} onClick={() => open(true)} aria-label={`Ver ${post.comments.length} comentarios de ${post.title}`}><CommunityIcon name="comment" size={15} />{post.comments.length}</button>
        <div className={s.reactionPicker} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setReactionsOpen(false) }} onKeyDown={(event) => { if (event.key === 'Escape' && reactionsOpen) { event.preventDefault(); event.stopPropagation(); setReactionsOpen(false); trigger.current?.focus() } }}>
          <MotionButton ref={trigger} type="button" className={s.reactButton} aria-expanded={reactionsOpen} aria-controls={`${id}-reactions`} onClick={() => { setReactionsOpen(!reactionsOpen); if (!reactionsOpen) requestAnimationFrame(() => panel.current?.querySelector('button')?.focus()) }}>{chosen ? <>{chosen.emoji} {chosen.label}</> : <>Reaccionar <span aria-hidden="true">＋</span></>}</MotionButton>
          {reactionsOpen && <div className={s.reactionPanel} ref={panel} id={`${id}-reactions`} role="group" aria-label={`Reacciones a ${post.title}`}>{reactionOptions.map((option) => <button key={option.id} type="button" aria-label={`${option.label}: ${post.reactions[option.id]}`} aria-pressed={post.myReaction === option.id} onClick={() => { dispatch({ type: 'react', postId: post.id, reaction: option.id }); setReactionsOpen(false); trigger.current?.focus() }}><span aria-hidden="true">{option.emoji}</span><span>{option.label}</span><small>{post.reactions[option.id]}</small></button>)}</div>}
        </div>
      </div>
    </div>
  </MotionCard>
}
