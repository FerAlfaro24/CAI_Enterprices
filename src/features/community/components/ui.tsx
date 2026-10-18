import emblem from '../../../assets/cai/logo-cai-emblema.svg'
import type { Member } from '../types'
import s from '../community.module.css'

type IconName = 'home' | 'award' | 'gallery' | 'spark' | 'users' | 'arrow' | 'comment' | 'pin' | 'plus' | 'close' | 'check' | 'reset' | 'shield' | 'book'

export function CommunityIcon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {name === 'home' && <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>}
      {name === 'award' && <><circle cx="12" cy="8" r="5" /><path d="m8.5 12-2 9 5.5-3 5.5 3-2-9" /></>}
      {name === 'gallery' && <><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="8" cy="8" r="1" /><path d="m3 17 5-5 4 4 4-6 5 6" /></>}
      {name === 'spark' && <path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z" />}
      {name === 'users' && <><circle cx="9" cy="8" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-3-5" /></>}
      {name === 'arrow' && <path d="M5 12h14m-6-6 6 6-6 6" />}
      {name === 'comment' && <path d="M21 14a3 3 0 0 1-3 3H9l-6 4V6a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3Z" />}
      {name === 'pin' && <path d="m9 3 12 12-5 1-4 4-2-6-6-2 4-4 1-5ZM3 21l6-6" />}
      {name === 'plus' && <path d="M12 5v14M5 12h14" />}
      {name === 'close' && <path d="m6 6 12 12M6 18 18 6" />}
      {name === 'check' && <path d="m5 12 4 4L19 6" />}
      {name === 'reset' && <><path d="M3 10a9 9 0 1 1 1 8M3 4v6h6" /></>}
      {name === 'shield' && <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z" /><path d="m8 12 3 3 5-6" /></>}
      {name === 'book' && <><path d="M12 6C8 3 4 4 2 5v15c3-2 7-2 10 0 3-2 7-2 10 0V5c-2-1-6-2-10 1v14" /></>}
    </svg>
  )
}

export function Avatar({ member, small = false }: { member: Member; small?: boolean }) {
  return (
    <span className={[s.avatar, s[member.color], small ? s.avatarSmall : '', member.institution ? s.institutionAvatar : ''].join(' ')} aria-hidden="true">
      {member.institution ? <img src={emblem} alt="" width="32" height="30" /> : member.initials}
    </span>
  )
}
