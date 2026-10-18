import type { Album } from './albums'

export interface AlbumPresentation {
  title: string
  symbol: string
  tone: 'blue' | 'yellow' | 'mint' | 'purple' | 'peach' | 'aqua'
  label?: string
}

/** Editorial labels only; dates, media, authors, status and counts come from posts. */
const editorial: Record<string, AlbumPresentation> = {
  'cai-club': { title: 'Nos soltamos hablando', symbol: '🎙️', tone: 'blue', label: 'SPEAKING DAY' },
  'nico-corner': { title: 'Entre libros y palabras', symbol: '📚', tone: 'mint' },
  'weekly-note': { title: 'Celebramos el intento', symbol: '🏆', tone: 'yellow' },
  'vale-gallery': { title: 'El inglés también cabe en lo cotidiano', symbol: '🎨', tone: 'purple', label: 'PEQUEÑAS PRÁCTICAS' },
  'teo-desk': { title: 'Un recordatorio: give it a try', symbol: '⭐', tone: 'peach' },
  'first-week': { title: 'Nuestra primera semana', symbol: '🎲', tone: 'aqua' },
}

export function albumPresentation(album: Album): AlbumPresentation {
  return editorial[album.postId] ?? { title: album.title, symbol: '📷', tone: 'blue' }
}
