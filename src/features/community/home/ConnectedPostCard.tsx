import { lazy, Suspense, useId } from 'react'
import { useCommunity } from '../context'
import { useCommunityDialogs } from '../dialogContext'
import { formatPostDate } from '../model'
import { categoryLabels } from '../data/fixtures'
import type { Post } from '../types'
import { MemberLink } from '../components/MemberLink'
import { StockImage } from '../components/PostMedia'
import { CommunityIcon } from '../components/ui'
import { ReactionsBar } from '../components/ReactionsBar'
import { SharedBadge } from '../achievements/SharedBadge'
import s from './social-feed.module.css'
const PublicationReference = import.meta.env.MODE === 'presentation' ? lazy(() => import('../../presentation/PublicationReference')) : null

/** A chronological conversation: author, message, photos and compact interaction. */
export function ConnectedPostCard({ post }: { post: Post }) {
  const { connection } = useCommunity(), { setDetail } = useCommunityDialogs(), id = useId()
  if (!connection) return null
  const author = connection.resolveMember(post.authorId)
  const open = (comments = false) => setDetail({ postId: post.id, comments })
  const abbreviated = post.body.length > 280
  const text = abbreviated ? post.body.slice(0, 280).replace(/\s+\S*$/, '') + '…' : post.body
  return <article className={s.post} id={`editorial-${post.id}`} aria-labelledby={`${id}-title`} data-social-post="true">
    <header className={s.author}><MemberLink member={author} avatar small /><div><strong><MemberLink member={author} /></strong><p><time dateTime={post.createdAt}>{formatPostDate(post.createdAt)}</time><span aria-hidden="true"> · </span><span>{post.audience === 'community' ? 'Comunidad CAI' : 'Tu grupo'}</span></p></div><span className={s.category}>{post.category === 'gallery' ? 'Álbum' : categoryLabels[post.category]}</span></header>
    <h3 id={`${id}-title`}><button type="button" onClick={() => open()}>{post.title}</button></h3>
    <p className={s.body}>{text}</p>
    {PublicationReference && <Suspense fallback={null}><PublicationReference postId={post.id} /></Suspense>}
    {abbreviated && <button type="button" className={s.more} onClick={() => open()}>Ver más<span className={s.srOnly}> de {post.title}</span></button>}
    <SharedBadge post={post} />
    {post.photos.length > 0 && <button type="button" className={s.photo} onClick={() => open()} aria-label={`Ver imágenes de ${post.title}`} aria-haspopup="dialog"><StockImage photo={post.photos[0]!} />{post.photos.length > 1 && <span>{post.photos.length} fotos <CommunityIcon name="gallery" size={14} /></span>}</button>}
    <footer className={s.actions}><ReactionsBar post={post} /><button type="button" className={s.comments} onClick={() => open(true)} aria-label={`Ver conversación de ${post.title}`} aria-haspopup="dialog"><CommunityIcon name="comment" size={18} /><span>{post.commentCount ?? 0} {post.commentCount === 1 ? 'comentario' : 'comentarios'}</span></button></footer>
  </article>
}
