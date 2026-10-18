import { useId, useState, type FormEvent } from 'react'
import { useCommunity } from '../context'
import { getMember } from '../data/members'
import { formatPostDate } from '../model'
import type { Comment, Post } from '../types'
import s from '../community.module.css'
import { Avatar, CommunityIcon } from './ui'

export function CommentItem({ comment }: { comment: Comment }) {
  const member = getMember(comment.authorId)
  return (
    <div className={s.comment}>
      <Avatar member={member} small />
      <div className={s.commentBubble}>
        <div className={s.commentMeta}><strong>{member.alias}</strong>{member.institution && <span>CAI · Demo</span>}<time dateTime={comment.createdAt}>{formatPostDate(comment.createdAt)}</time></div>
        <p>{comment.body}</p>
      </div>
    </div>
  )
}

export function Comments({ post }: { post: Post }) {
  const { state, dispatch } = useCommunity()
  const [body, setBody] = useState('')
  const [error, setError] = useState('')
  const id = useId()
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!body.trim()) {
      setError('Escribe un comentario ficticio antes de añadirlo.')
      event.currentTarget.querySelector('textarea')?.focus()
      return
    }
    dispatch({ type: 'comment', postId: post.id, id: crypto.randomUUID(), body })
    setBody('')
    setError('')
  }
  return (
    <section className={s.comments} aria-label={`Comentarios de ${post.title}`}>
      <h3 className={s.smallHeading}>La conversación <span>({post.comments.length})</span></h3>
      {post.comments.length ? post.comments.map((comment) => <CommentItem key={comment.id} comment={comment} />) : <p className={s.muted}>Sé la primera voz en acompañar esta historia.</p>}
      <form className={s.commentForm} onSubmit={submit} aria-label={`Comentar en ${post.title}`}>
        <label htmlFor={id}>Comenta como {state.mode === 'moderator' ? 'Equipo CAI' : 'Alex Demo'}</label>
        <textarea id={id} value={body} onChange={(event) => { setBody(event.target.value); setError('') }} rows={2} maxLength={400} placeholder="Comparte una palabra de ánimo ficticia…" aria-invalid={Boolean(error)} aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`} />
        <div className={s.commentFormFooter}><small id={`${id}-help`}>Solo datos ficticios · Máximo 400 caracteres</small><button className={s.smallPrimary} type="submit">Comentar <CommunityIcon name="arrow" size={15} /></button></div>
        {error && <p className={s.fieldError} id={`${id}-error`} role="alert">{error}</p>}
      </form>
    </section>
  )
}
