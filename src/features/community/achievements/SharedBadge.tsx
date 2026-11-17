import type { Post } from '../types'
import { BadgeArtwork } from './BadgeArtwork'
import s from './achievements.module.css'
export function SharedBadge({post}:{post:Post}){return post.recognition?<div className={s.sharedBadge}><BadgeArtwork badgeId={post.recognition.badgeId} symbol="" className={s.sharedArtwork}/><span><b>{post.recognition.title}</b><small>Insignia conseguida · Compartida por su autor</small></span></div>:null}
