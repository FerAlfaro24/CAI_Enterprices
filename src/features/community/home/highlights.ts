import type { GalleryItem } from '../../local-access/api'
import type { Post } from '../types'

export type CommunityHighlight = {
  id: string
  kind: 'notice' | 'story' | 'memory'
  title: string
  description: string
  photo?: { src: string; alt: string }
  postId?: string
  label: string
  action: string
}

/** Shared notices are public to this viewer; private account messages never enter here. */
export function communityHighlights(posts: readonly Post[], gallery: readonly GalleryItem[]): CommunityHighlight[] {
  const approved = posts.filter(post => post.status === 'approved')
  const notices = approved.filter(post => post.category === 'announcement' && post.pinOrder !== null)
    .sort((a, b) => (a.pinOrder ?? 0) - (b.pinOrder ?? 0) || Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const noticeIds = new Set(notices.map(post => post.id))
  const stories = approved.filter(post => post.photos.length > 0 && !noticeIds.has(post.id))
    .sort((a, b) => Number(Boolean(b.highlighted)) - Number(Boolean(a.highlighted)) || Date.parse(b.createdAt) - Date.parse(a.createdAt))
  const used = new Set(approved.flatMap(post => post.photos.map(photo => photo.id)))
  const moments: CommunityHighlight[] = [
    ...stories.map(post => ({ id: post.id, kind: 'story' as const, title: post.title, description: post.body, photo: post.photos[0]!, postId: post.id, label: post.category === 'gallery' ? 'ÁLBUM DE CAI' : 'HISTORIA DESTACADA', action: 'Ver historia y fotos' })),
    ...gallery.filter(image => !used.has(image.id)).map(image => ({ id: 'photo:' + image.id, kind: 'memory' as const, title: image.title, description: image.description, photo: { src: image.imagePath, alt: image.alt }, label: 'RECUERDOS DE LA COMUNIDAD', action: 'Abrir galería' })),
  ]
  return [
    ...notices.map(post => ({ id: post.id, kind: 'notice' as const, title: post.title, description: post.body, photo: post.photos[0], postId: post.id, label: 'AVISO DE CAI', action: 'Leer aviso' })),
    ...moments.slice(0, 5),
  ]
}
