import { getMember } from '../data/members'
import { formatPostDate } from '../model'
import type { Comment,Member } from '../types'
import { MemberLink } from './MemberLink'
import s from '../community.module.css'

export function CommentItem({ comment, member:provided }: { comment: Comment;member?:Member }) {
  const member = provided ?? getMember(comment.authorId)
  return (
    <div className={s.comment}>
      <MemberLink member={member} avatar small />
      <div className={s.commentBubble}>
        <div className={s.commentMeta}><strong><MemberLink member={member} /></strong>{member.institution && <span>CAI · Demo</span>}<time dateTime={comment.createdAt}>{formatPostDate(comment.createdAt)}</time></div>
        <p>{comment.body}</p>
      </div>
    </div>
  )
}
