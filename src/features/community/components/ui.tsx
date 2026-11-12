import { ArrowRight, Award, BookOpen, Check, House, Image, MessageCircle, Moon, Pin, Plus, RotateCcw, ShieldCheck, Sparkles, Sun, Users, X } from 'lucide-react'
import emblem from '../../../assets/cai/logo-cai-emblema.svg'
import type { Member } from '../types'
import s from '../community.module.css'

type IconName = 'home' | 'award' | 'gallery' | 'spark' | 'users' | 'arrow' | 'comment' | 'pin' | 'plus' | 'close' | 'check' | 'reset' | 'shield' | 'book' | 'sun' | 'moon'

const icons = { home: House, award: Award, gallery: Image, spark: Sparkles, users: Users, arrow: ArrowRight, comment: MessageCircle, pin: Pin, plus: Plus, close: X, check: Check, reset: RotateCcw, shield: ShieldCheck, book: BookOpen, sun: Sun, moon: Moon } satisfies Record<IconName, typeof House>

export function CommunityIcon({ name, size = 20 }: { name: IconName; size?: number }) {
  const Icon = icons[name]
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" focusable="false" />
}

export function Avatar({ member, small = false }: { member: Member; small?: boolean }) {
  return (
    <span className={[s.avatar, s[member.color], small ? s.avatarSmall : '', member.institution ? s.institutionAvatar : ''].join(' ')} style={member.avatarColor ? { background: member.avatarColor, color: '#fff' } : undefined} aria-hidden="true">
      {member.institution ? <img src={emblem} alt="" width="32" height="30" /> : member.initials}
    </span>
  )
}
