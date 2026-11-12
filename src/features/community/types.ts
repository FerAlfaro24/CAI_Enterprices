import type { BadgeRequest } from './achievements/types'

export type Section = 'home' | 'achievements' | 'gallery' | 'challenges' | 'members'
export type FeedFilter = 'recent' | 'achievements' | 'experiences' | 'celebrated'
export type DemoMode = 'student' | 'moderator'
export type Category = 'announcement' | 'achievement' | 'experience' | 'gallery' | 'event'
export type Reaction = 'love' | 'wellDone' | 'congrats' | 'amazing' | 'funny'
export type ReactionCounts = Record<Reaction, number>

export interface Member {
  avatarColor?: string
  id: string
  alias: string
  initials: string
  color: 'blue' | 'purple' | 'green' | 'rose' | 'amber'
  institution?: boolean
  joinedAt: string
  badge: string
  bio: string
}

export interface Photo {
  id: string
  src: string
  alt: string
  caption: string
}

export interface Comment {
  id: string
  authorId: string
  body: string
  createdAt: string
}

export interface Post {
  id: string
  authorId: string
  title: string
  body: string
  category: Category
  createdAt: string
  status: 'approved' | 'pending' | 'rejected'
  pinOrder: number | null
  layout: 'text' | 'single' | 'compact' | 'gallery' | 'achievement' | 'event'
  photos: Photo[]
  badgeId?: string
  milestone?: { label: string; detail: string }
  event?: { day: string; month: string; detail: string }
  reactions: ReactionCounts
  myReaction: Reaction | null
  comments: Comment[]
}

export interface Challenge {
  id: string
  day: string
  topic: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface Attempt {
  answerIndex: number
  correct: boolean
  points: number
}

export interface CommunityState {
  posts: Post[]
  mode: DemoMode
  section: Section
  filter: FeedFilter
  challengeId: string
  attempts: Record<string, Attempt>
  badgeRequests: BadgeRequest[]
  notice: string
  sequence: number
  resetKey: number
  focusedPostId: string | null
  focusRequest: number
}

export type CommunityAction =
  | { type: 'section'; section: Section }
  | { type: 'filter'; filter: FeedFilter }
  | { type: 'mode'; mode: DemoMode }
  | { type: 'react'; postId: string; reaction: Reaction }
  | { type: 'comment'; postId: string; id: string; body: string }
  | { type: 'create'; id: string; title: string; body: string; category: Category; photoIds: string[]; badgeId?: string }
  | { type: 'requestBadge'; id: string; badgeId: string; description: string }
  | { type: 'reviewBadge'; requestId: string; decision: 'approved' | 'rejected'; reason: string }
  | { type: 'moderate'; postId: string; decision: 'approved' | 'rejected' }
  | { type: 'pin'; postId: string }
  | { type: 'challengeDay'; id: string }
  | { type: 'answer'; challengeId: string; answerIndex: number }
  | { type: 'focusPost'; postId: string }
  | { type: 'reset' }
