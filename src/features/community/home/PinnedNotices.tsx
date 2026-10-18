import { useState } from 'react'
import { useCommunity } from '../context'
import { useCommunityDialogs } from '../dialogContext'
import { CommunityIcon } from '../components/ui'
import s from './home.module.css'

export function PinnedNotices() {
  const { state } = useCommunity()
  const { setDetail } = useCommunityDialogs()
  const [index, setIndex] = useState(0)
  const pinned = state.posts.filter((post) => post.status === 'approved' && post.pinOrder !== null).sort((a, b) => (a.pinOrder ?? 0) - (b.pinOrder ?? 0))
  const post = pinned[index % Math.max(pinned.length, 1)]
  if (!post) return null
  return <section className={s.pinned} aria-label="Avisos fijados por CAI"><span className={s.noticeIcon}><CommunityIcon name="pin" size={23} /></span><div className={s.noticeText} aria-live="polite" aria-atomic="true"><span>AVISOS CAI · {index % pinned.length + 1} DE {pinned.length}</span><h2><button type="button" onClick={() => setDetail({ postId: post.id, comments: false })}>{post.title}</button></h2></div><div className={s.noticeActions}><button type="button" className={s.noticeRead} onClick={() => setDetail({ postId: post.id, comments: false })}>Ver <CommunityIcon name="arrow" size={14} /></button>{pinned.length > 1 && <button type="button" className={s.noticeNext} onClick={() => setIndex((current) => (current + 1) % pinned.length)} aria-label="Siguiente aviso fijado">›</button>}</div></section>
}
