import type { Album } from './albums'

export interface AlbumPresentation {
  title: string
}

/** Editorial labels only; dates, media, authors, status and counts come from posts. */
const editorial: Record<string, AlbumPresentation> = {
  'cai-club': { title: 'Nos soltamos hablando' },
  'nico-corner': { title: 'Entre libros y palabras' },
  'weekly-note': { title: 'Celebramos el intento' },
  'vale-gallery': { title: 'El inglés también cabe en lo cotidiano' },
  'teo-desk': { title: 'Un recordatorio: give it a try' },
  'first-week': { title: 'Nuestra primera semana' },
}

export function albumPresentation(album: Album): AlbumPresentation {
  return editorial[album.postId] ?? { title: album.title }
}
