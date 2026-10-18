import { useCommunityDialogs } from '../dialogContext'
import type { Member } from '../types'
import s from '../community.module.css'
import { Avatar } from './ui'

export function MemberLink({ member, avatar = false, small = false }: { member: Member; avatar?: boolean; small?: boolean }) {
  const { setProfileId } = useCommunityDialogs()
  return <button type="button" className={s.memberLink} aria-label={avatar ? `Ver perfil de ${member.alias}` : undefined} aria-haspopup="dialog" onClick={() => setProfileId(member.id)}>{avatar ? <Avatar member={member} small={small} /> : member.alias}</button>
}
