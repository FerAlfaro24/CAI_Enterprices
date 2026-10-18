import { getMember } from '../data/members'
import { celebrationCount, DEMO_DATE } from '../model'
import type { Category, Photo, Post } from '../types'

export type AlbumCategory = 'activities' | 'achievements' | 'events' | 'backstage'
export type AlbumFilter = 'all' | AlbumCategory
export type AlbumSort = 'editorial' | 'recent' | 'oldest' | 'celebrated'

export interface Album {
  id: string
  postId: Post['id']
  title: string
  description: string
  category: AlbumCategory
  cover: Photo
  photos: readonly Photo[]
  author: { id: string; alias: string }
  provenance: string
  createdAt: string
  status: Post['status']
  celebrations: number
}

export const albumFilters: { id: AlbumFilter; label: string }[] = [
  { id: 'all', label: 'Todas las fotos' },
  { id: 'activities', label: 'Actividades' },
  { id: 'achievements', label: 'Logros' },
  { id: 'events', label: 'Eventos' },
  { id: 'backstage', label: 'Detrás de cámaras' },
]

export const albumCategoryLabels: Record<AlbumCategory, string> = {
  activities: 'Actividades', achievements: 'Logros', events: 'Eventos', backstage: 'Detrás de cámaras',
}

const categoryFromPost: Record<Category, AlbumCategory> = {
  announcement: 'activities', gallery: 'activities', achievement: 'achievements', event: 'events', experience: 'backstage',
}

const editorialOrder = ['cai-club', 'weekly-note', 'nico-corner', 'vale-gallery', 'teo-desk', 'first-week']

export function formatAlbumDate(value: string) {
  const calendar = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' })
  const days = Math.max(0, Math.round((Date.parse(calendar.format(new Date(DEMO_DATE))) - Date.parse(calendar.format(new Date(value)))) / 86_400_000))
  return days === 0 ? 'Hoy · Demo' : days === 1 ? 'Hace 1 día · Demo' : `Hace ${days} días · Demo`
}

/** One projection per photographic post. No independent album or moderation store. */
export function deriveAlbums(posts: readonly Post[]): Album[] {
  return posts.flatMap((post) => {
    const cover = post.photos[0]
    if (!cover) return []
    const author = getMember(post.authorId)
    return [{
      id: `album:${post.id}`, postId: post.id, title: post.title, description: post.body,
      category: categoryFromPost[post.category], cover, photos: post.photos,
      author: { id: author.id, alias: author.alias },
      provenance: 'Fotografías ilustrativas de Unsplash; no representan alumnos ni instalaciones de CAI.',
      createdAt: post.createdAt, status: post.status, celebrations: celebrationCount(post),
    }]
  })
}

export function selectAlbums(posts: readonly Post[], filter: AlbumFilter = 'all', sort: AlbumSort = 'recent'): Album[] {
  return deriveAlbums(posts)
    .filter((album) => album.status === 'approved' && (filter === 'all' || album.category === filter))
    .sort((a, b) => {
      const byDate = Date.parse(b.createdAt) - Date.parse(a.createdAt)
      if (sort === 'editorial') {
        const rank = (album: Album) => { const index = editorialOrder.indexOf(album.postId); return index === -1 ? editorialOrder.length : index }
        if (rank(a) !== rank(b)) return rank(a) - rank(b)
      }
      if (sort === 'celebrated' && a.celebrations !== b.celebrations) return b.celebrations - a.celebrations
      return (sort === 'oldest' ? -byDate : byDate) || a.id.localeCompare(b.id)
    })
}

export function albumCounts(albums: readonly Album[]) {
  return {
    albums: albums.length,
    // Occurrences in albums, not nine distinct source photographs.
    photos: albums.reduce((sum, album) => sum + album.photos.length, 0),
    uniquePhotos: new Set(albums.flatMap((album) => album.photos.map((photo) => photo.id))).size,
  }
}
