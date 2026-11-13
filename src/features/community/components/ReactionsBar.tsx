import { useId, useRef, useState } from 'react'
import { useCommunity } from '../context'
import { reactionOptions } from '../data/fixtures'
import { celebrationCount } from '../model'
import type { Post, Reaction } from '../types'
import s from './reactions.module.css'

/** The feed and full story share the same authenticated reaction and controls. */
export function ReactionsBar({ post }: { post: Post }) {
  const { connection } = useCommunity()
  const id = useId()
  const attempt = useRef<{ signature: string; key: string } | null>(null)
  const sending = useRef(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  if (!connection) return null
  const chosen = reactionOptions.find(option => option.id === post.myReaction)
  const choose = async (reaction: Reaction | null) => {
    if (sending.current || connection.busy || reaction === post.myReaction) return
    const signature = JSON.stringify([post.id, post.reactionRevision ?? 0, reaction])
    if (attempt.current?.signature !== signature) attempt.current = { signature, key: crypto.randomUUID() }
    sending.current = true; setPending(true); setMessage('')
    try {
      const saved = await connection.react(post, reaction, attempt.current.key)
      if (saved) { attempt.current = null; setMessage(reaction === null ? 'Quitaste tu reacción.' : 'Reacción guardada.') }
      else setMessage('No confirmamos el cambio. Revisa la historia actualizada o vuelve a elegir para reintentar.')
    } finally { sending.current = false; setPending(false) }
  }
  return <section className={s.bar} aria-label={`Celebraciones de ${post.title}`} aria-busy={pending}>
    <div className={s.heading}><strong>Celebra esta historia</strong><span>{celebrationCount(post)} {celebrationCount(post) === 1 ? 'reacción' : 'reacciones'}</span></div>
    <p id={`${id}-help`} className={s.help}>{connection.reactionsOpen ? chosen ? `Tu reacción: ${chosen.label}. Puedes cambiarla o quitarla.` : 'Elige una reacción para acompañar a tu grupo.' : 'CAI pausó las nuevas reacciones. Puedes consultar y quitar la tuya.'}</p>
    <div className={s.options} role="group" aria-label={`Reacciones a ${post.title}`} aria-describedby={`${id}-help`}>
      {reactionOptions.map(option => <button key={option.id} type="button" aria-label={`${option.label}: ${post.reactions[option.id]}`} aria-pressed={post.myReaction === option.id} disabled={pending || connection.busy || !connection.reactionsOpen} onClick={() => { void choose(option.id) }}><span aria-hidden="true">{option.emoji}</span><span>{option.label}</span><b>{post.reactions[option.id]}</b></button>)}
    </div>
    {chosen && <button type="button" className={s.remove} disabled={pending || connection.busy} onClick={() => { void choose(null) }}>Quitar mi reacción</button>}
    <p role="status" className={s.help}>{pending ? 'Guardando tu reacción…' : message}</p>
  </section>
}
