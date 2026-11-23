import type { GroupMember, GalleryItem, StudentNotice, OwnPost, PublicationDraft, StudentUser } from '../local-access/api'
import type { Member, Post } from './types'
import type { StudentProfile, StudentProfileDraft } from '../local-access/api'

export interface CommunityConnection {
  achievements:import('../../../server/contracts').LearningPage
  saveAchievement:(id:number|null,draft:import('../../../server/contracts').LearningDraft,key:string,revision?:number)=>Promise<boolean>
  submitAchievement:(item:{id:number;revision:number},share:boolean)=>Promise<boolean>
  cancelAchievement:(item:{id:number;revision:number})=>Promise<boolean>
  withdrawAchievement:(item:{id:string;revision:number})=>Promise<boolean>
  demonstration?:boolean
  badges:import('../../../server/contracts').BadgeSnapshot
  requestBadge:(badgeId:string,description:string,key:string)=>Promise<boolean>
  withdrawBadge:(item:import('../../../server/contracts').BadgeApplication)=>Promise<boolean>
  challenges: import('../../../server/contracts').ChallengeSnapshot
  answerChallenge:(question:{id:string;revision:number},answerIndex:number,key:string)=>Promise<boolean>
  user: StudentUser
  profile: StudentProfile
  saveProfile: (draft: StudentProfileDraft) => Promise<boolean>
  members: Member[]
  gallery: GalleryItem[]
  notices: StudentNotice[]
  seen: (id: number) => Promise<boolean>
  archiveViewedNotices:(ids:number[])=>Promise<boolean>
  dismissNotices:(ids:number[])=>Promise<boolean>
  mine: OwnPost[]
  submissionsOpen: boolean
  reactionsOpen: boolean
  commentsOpen: boolean
  handleFailure: (error:unknown) => void
  react: (post: Post, reaction: import('./types').Reaction | null, key: string) => Promise<boolean>
  busy: boolean
  error: string
  notice: string
  resolveMember: (id: string) => Member
  refresh: () => Promise<void>
  submit: (draft: PublicationDraft, key: string) => Promise<boolean>
  withdraw: (post: OwnPost) => Promise<boolean>
  logout: () => Promise<void>
}

export function publicMember(profile: GroupMember): Member {
  return { id: profile.id, alias: profile.displayName, institution:profile.id==='cai-team',
    initials: profile.displayName.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase(),
    color: 'blue', avatarColor: profile.avatarColor, joinedAt: '', badge: '', bio: '' }
}

export function feedPost(post: import('../local-access/api').PublishedPost): Post {
  return { id: post.id, authorId: post.author.id, title: post.title, body: post.body,
    category: post.kind==='notice'?'announcement':post.kind==='album'?'gallery':post.category, createdAt: post.publishedAt ?? post.createdAt, status: 'approved',
    recognition:post.recognition,audience:post.audience??'group',pinOrder: post.kind==='notice'&&post.highlighted?0:null, highlighted:post.highlighted,expiresAt:post.expiresAt, layout: post.photos?.length?'gallery':'text', photos: (post.photos??[]).map(image=>({id:image.id,src:image.imagePath,alt:image.alt,caption:image.description})), comments: [], myReaction: post.engagement?.myReaction ?? null,
    reactionRevision: post.engagement?.revision ?? 0, commentCount:post.commentCount??0,commentsOpen:post.commentsOpen!==false,
    reactions: post.engagement?.counts ?? { love: 0, wellDone: 0, congrats: 0, amazing: 0, funny: 0 } }
}
