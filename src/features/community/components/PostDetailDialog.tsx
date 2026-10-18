import { useId } from 'react'
import { useCommunity } from '../context'
import { useCommunityDialogs } from '../dialogContext'
import { useCommunityDialog } from '../useCommunityDialog'
import s from '../community.module.css'
import { PostCard } from './PostCard'
import { CommunityIcon } from './ui'

export function PostDetailDialog() {
  const { state } = useCommunity()
  const { detail, setDetail } = useCommunityDialogs()
  const dialog = useCommunityDialog()
  const id = useId()
  const post = state.posts.find((item) => item.id === detail?.postId && item.status === 'approved')
  return <dialog ref={dialog} className={s.storyDialog} aria-labelledby={id} onCancel={(event) => { event.preventDefault(); setDetail(null) }}><div className={s.storyDialogHeading}><h2 id={id}>La historia completa</h2><button type="button" className={s.iconButton} aria-label="Cerrar publicación" onClick={() => setDetail(null)}><CommunityIcon name="close" /></button></div>{post ? <PostCard post={post} initialCommentsOpen={detail?.comments} /> : <p>Esta publicación ya no está disponible en la demo.</p>}</dialog>
}
