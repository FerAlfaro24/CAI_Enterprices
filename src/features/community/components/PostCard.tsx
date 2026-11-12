import { useState } from 'react'
import { useCommunity } from '../context'
import { categoryLabels, reactionOptions } from '../data/fixtures'
import { getMember } from '../data/members'
import { celebrationCount, formatPostDate } from '../model'
import type { Post } from '../types'
import s from '../community.module.css'
import { CommentItem, Comments } from './Comments'
import { PostMedia } from './PostMedia'
import { CommunityIcon } from './ui'
import { MemberLink } from './MemberLink'

export function PostCard({ post, initialCommentsOpen = false }: { post: Post; initialCommentsOpen?: boolean }) {
  const { state, dispatch, connection } = useCommunity()
  const [commentsOpen, setCommentsOpen] = useState(initialCommentsOpen)
  const author = connection ? connection.resolveMember(post.authorId) : getMember(post.authorId)
  const firstComment = post.comments[0]
  const commentCount = `${post.comments.length} ${post.comments.length === 1 ? 'comentario' : 'comentarios'}`
  return (
    <article className={[s.post, post.pinOrder !== null ? s.pinnedPost : ''].join(' ')} id={`post-${post.id}`} tabIndex={-1} aria-labelledby={`post-title-${post.id}`}>
      {post.pinOrder !== null && <div className={s.pinLabel}><CommunityIcon name="pin" size={13} /> Fijado por CAI</div>}
      <header className={s.postHeader}>
        <MemberLink member={author} avatar />
        <div className={s.authorInfo}><div><strong><MemberLink member={author} /></strong>{author.institution && <span className={s.officialBadge}>CAI · Demo</span>}</div><time dateTime={post.createdAt}>{formatPostDate(post.createdAt)}</time></div>
        <span className={[s.category, s[post.category]].join(' ')}>{categoryLabels[post.category]}</span>
      </header>
      <h2 id={`post-title-${post.id}`} className={s.postTitle}>{post.title}</h2>
      <p className={s.postBody}>{post.body}</p>
      {post.milestone && <div className={s.milestone}><span aria-hidden="true">✦</span><div><small>UN PASO QUE CUENTA</small><strong>{post.milestone.label}</strong><p>{post.milestone.detail}</p></div><CommunityIcon name="award" size={36} /></div>}
      {post.event && <div className={s.eventCard}><div className={s.eventDate}><strong>{post.event.day}</strong><span>{post.event.month}</span></div><div><strong>{post.event.detail}</strong><p>Escenario de muestra · Sin registro real</p></div></div>}
      {post.photos.length > 0 && <PostMedia post={post} />}
      {!connection && <><div className={s.engagementLine}><span><span className={s.miniReactions} aria-hidden="true">💙 👏 🎉</span> {celebrationCount(post)} celebraciones</span><span>{commentCount}</span></div>
      <div className={s.reactions} role="group" aria-label={`Reacciones a ${post.title}`}>
        {reactionOptions.map(({ id, emoji, label }) => <button type="button" key={id} aria-label={`${label}: ${post.reactions[id]}`} aria-pressed={post.myReaction === id} title={label} onClick={() => dispatch({ type: 'react', postId: post.id, reaction: id })}><span aria-hidden="true">{emoji}</span><span>{post.reactions[id]}</span></button>)}
      </div>
      <div className={s.postActions}>
        <button type="button" aria-expanded={commentsOpen} aria-controls={`comments-${post.id}`} onClick={() => setCommentsOpen(!commentsOpen)}><CommunityIcon name="comment" size={17} />{commentsOpen ? 'Cerrar conversación' : post.comments.length ? `Ver ${commentCount}` : 'Comentar'}</button>
        {state.mode === 'moderator' && author.institution && post.category === 'announcement' && <button type="button" aria-pressed={post.pinOrder !== null} onClick={() => dispatch({ type: 'pin', postId: post.id })}><CommunityIcon name="pin" size={15} />{post.pinOrder !== null ? 'Desfijar aviso' : 'Fijar aviso'}</button>}
      </div>
      {!commentsOpen && firstComment && <div className={s.commentPreview}><CommentItem comment={firstComment} /></div>}
      <div id={`comments-${post.id}`}>{commentsOpen && <Comments post={post} />}</div></>}
    </article>
  )
}
