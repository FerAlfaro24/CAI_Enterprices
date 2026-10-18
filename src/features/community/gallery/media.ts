import speaking from '../../../assets/community/gallery/speaking-day.svg?no-inline'
import everyTry from '../../../assets/community/gallery/every-try.svg?no-inline'
import giveItATry from '../../../assets/community/gallery/give-it-a-try.svg?no-inline'
import firstWeek from '../../../assets/community/gallery/first-week.svg?no-inline'
import type { Album } from './albums'

/** Original editorial covers, not photographs or records of real CAI events. */
export const galleryArtwork = {
  speaking: { src: speaking, background: '#1f56d6', alt: 'Póster original Speaking Day: cartel Say it out loud, micrófono y una conversación Hello.', credit: 'Ilustración original · CAI Community' },
  everyTry: { src: everyTry, background: '#bce9da', alt: 'Póster original Every try counts, con una escarapela amarilla sobre papel menta.', credit: 'Ilustración original · CAI Community' },
  giveItATry: { src: giveItATry, background: '#f2b39e', alt: 'Nota original Give it a try, sujeta con cinta amarilla y acompañada de un lápiz.', credit: 'Ilustración original · CAI Community' },
  firstWeek: { src: firstWeek, background: '#dcd5fa', alt: 'Tira de película original con tres fotogramas ilustrados: Hello, una estrella y una flecha de progreso.', credit: 'Ilustración original · CAI Community' },
} as const

type CoverSlot = { kind: 'artwork'; artwork: keyof typeof galleryArtwork } | { kind: 'photo' }

/** Stable post slots: switch kind to photo after authorized media replaces the
 * source post's Photo (id/src/alt/caption). Never duplicate photos or album state.
 * Unknown approved albums use their own first photo, including new demo submissions.
 */
export const galleryCoverSlots: Readonly<Record<string, CoverSlot>> = {
  'cai-club': { kind: 'artwork', artwork: 'speaking' },
  'weekly-note': { kind: 'artwork', artwork: 'everyTry' },
  'nico-corner': { kind: 'photo' },
  'vale-gallery': { kind: 'photo' },
  'teo-desk': { kind: 'artwork', artwork: 'giveItATry' },
  'first-week': { kind: 'artwork', artwork: 'firstWeek' },
}

export function galleryCover(album: Album) {
  const slot = galleryCoverSlots[album.postId]
  return slot?.kind === 'artwork' ? galleryArtwork[slot.artwork] : null
}
