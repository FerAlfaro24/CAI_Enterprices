import { useId, useRef, useState } from 'react'
import { m } from 'motion/react'
import { useCommunityReducedMotion } from './useCommunityReducedMotion'
import { useCommunity } from '../context'
import { reactionOptions } from '../data/fixtures'
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
  const [failed, setFailed] = useState(false)
  const [celebrated, setCelebrated] = useState<{ reaction: Reaction; sequence: number } | null>(null)
  const reduced = useCommunityReducedMotion()
  if (!connection) return null
  const chosen = reactionOptions.find(option => option.id === post.myReaction)
  const choose = async (reaction: Reaction | null) => {
    if (sending.current || connection.busy || reaction === post.myReaction) return
    const signature = JSON.stringify([post.id, post.reactionRevision ?? 0, reaction])
    if (attempt.current?.signature !== signature) attempt.current = { signature, key: crypto.randomUUID() }
    sending.current = true; setPending(true); setMessage(''); setFailed(false)
    try {
      const saved = await connection.react(post, reaction, attempt.current.key)
      if (saved) {
        attempt.current = null; setMessage(reaction === null ? 'Quitaste tu reacción.' : 'Reacción guardada.')
        if (reaction) setCelebrated(previous => ({ reaction, sequence: (previous?.sequence ?? 0) + 1 }))
        else setCelebrated(null)
      }
      else { setFailed(true); setMessage('No confirmamos el cambio. Revisa la historia actualizada o vuelve a elegir para reintentar.') }
    } finally { sending.current = false; setPending(false) }
  }
  return <section className={s.bar} aria-label={`Celebraciones de ${post.title}`} aria-busy={pending}>
    <p id={`${id}-help`} className={s.srOnly}>{connection.reactionsOpen ? chosen ? `Tu reacción: ${chosen.label}. Toca el mismo emoji para quitarla.` : 'Elige un emoji para reaccionar.' : 'CAI pausó las nuevas reacciones. Puedes consultar y quitar la tuya.'}</p>
    <div className={s.options} role="group" aria-label={`Reacciones a ${post.title}`} aria-describedby={`${id}-help`}>
      {reactionOptions.map(option => <m.button key={option.id} type="button" aria-label={`${option.label}: ${post.reactions[option.id]}`} title={post.myReaction === option.id ? `${option.label} · Quitar reacción` : option.label} aria-pressed={post.myReaction === option.id} data-reaction-id={option.id} disabled={pending || connection.busy || (!connection.reactionsOpen && post.myReaction !== option.id)} whileTap={reduced ? undefined : { scale: .95 }} onClick={() => { void choose(post.myReaction === option.id ? null : option.id) }}><span aria-hidden="true">{option.emoji}</span><b aria-hidden="true">{new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 }).format(post.reactions[option.id])}</b>{celebrated?.reaction === option.id && !reduced && <m.i key={celebrated.sequence} className={s.reactionPop} aria-hidden="true" data-reaction-celebration="true" initial={{ y: 0, opacity: 1, scale: .7 }} animate={{ y: -42, opacity: 0, scale: 1.6 }} transition={{ duration: .8, ease: 'easeOut' }}>{option.emoji}</m.i>}</m.button>)}
    </div>
    {!connection.reactionsOpen && <p className={s.paused}>Las reacciones están pausadas.</p>}
    <p role="status" className={failed ? s.error : s.srOnly}>{pending ? 'Guardando tu reacción…' : message}</p>
  </section>
}
