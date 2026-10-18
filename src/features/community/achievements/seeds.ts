import type { BadgeGrant } from './types'

/** Explicit fictional receipts, shared via existing approved stories. They never
 * infer grants from approving a post or from legacy Member.badge labels.
 * Mara's receipt belongs to the historical scenario, not Alex's current attempts.
 */
export const publicGrantExamples: readonly { grant: BadgeGrant; postId: string; reason: string }[] = [
  { grant: { id: 'example-luna-speaking', badgeId: 'speaking-confidence', memberId: 'luna', source: 'cai', condition: 'Reconocimiento ficticio de CAI por animarse a conversar.', awardedAt: '2026-10-17T13:00:00-06:00' }, postId: 'luna-conversation', reason: 'Se animó a conversar cinco minutos, sin exigir perfección.' },
  { grant: { id: 'example-dani-music', badgeId: 'music-catcher', memberId: 'dani', source: 'cai', condition: 'Reconocimiento ficticio de CAI por una expresión descubierta en una canción.', awardedAt: '2026-10-17T11:00:00-06:00' }, postId: 'dani-song', reason: 'Reconoció una expresión de su canción favorita.' },
  { grant: { id: 'example-leo-consistency', badgeId: 'cai-consistency', memberId: 'leo', source: 'cai', condition: 'Distinción ficticia de CAI por reservar tiempo para practicar; no acredita una serie de retos.', awardedAt: '2026-10-14T20:00:00-06:00' }, postId: 'leo-consistency', reason: 'Hizo espacio para aprender, incluso en días de poca energía.' },
  { grant: { id: 'example-mara-first', badgeId: 'first-answer', memberId: 'mara', source: 'automatic', condition: 'Primer reto completado en el escenario histórico ficticio; acertar no era necesario.', awardedAt: '2026-10-10T14:00:00-06:00' }, postId: 'mara-first-challenge', reason: 'No acertó su primer reto, pero aprendió y quiso contarlo.' },
]
