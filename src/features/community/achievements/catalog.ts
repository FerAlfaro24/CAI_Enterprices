import { selectChallengeProgress } from '../challenges/progress'
import type { BadgeDefinition, BadgeTone } from './types'

const automatic = selectChallengeProgress({ attempts: {}, challengeId: 'day-1' }).badges
const tones: BadgeTone[] = ['blue', 'yellow', 'purple']
/** Retos owns automatic definitions and rules; this catalogue adds presentation. */
export const badgeCatalog: readonly BadgeDefinition[] = [
  ...automatic.map((badge, index): BadgeDefinition => ({ id: badge.id, title: badge.title, description: badge.description, symbol: badge.symbol, tone: tones[index]!, category: 'retos', mode: 'automatic', availability: 'active', automaticRule: badge.id })),
  { id: 'movie-explorer', title: 'Explorador de películas', description: 'Una película en inglés, nuevas frases y una historia que contar.', symbol: '🎬', tone: 'peach', category: 'aventuras', mode: 'review', availability: 'active' },
  { id: 'music-catcher', title: 'Music Catcher', description: 'Descubre expresiones nuevas en una canción en inglés.', symbol: '🎵', tone: 'purple', category: 'aventuras', mode: 'review', availability: 'active' },
  { id: 'book-buddy', title: 'Book Buddy', description: 'Lee una historia en inglés y cuéntanos qué descubriste.', symbol: '📚', tone: 'mint', category: 'aventuras', mode: 'review', availability: 'active' },
  { id: 'speaking-confidence', title: 'Sin miedo al inglés', description: 'CAI reconoce el valor de conversar aunque haya nervios.', symbol: '💬', tone: 'mint', category: 'comunidad', mode: 'review', availability: 'institutional' },
  { id: 'good-companion', title: 'Buen compañero', description: 'Por animar y acompañar a otras personas.', symbol: '💙', tone: 'blue', category: 'comunidad', mode: 'review', availability: 'institutional' },
  { id: 'cai-consistency', title: 'Constancia', description: 'CAI celebra el esfuerzo de volver a intentarlo. Es distinta de la serie automática de Retos.', symbol: '🌟', tone: 'yellow', category: 'comunidad', mode: 'review', availability: 'institutional' },
]
export const requestableBadges = badgeCatalog.filter((badge) => badge.mode === 'review' && badge.availability === 'active')
export const findBadge = (id: string) => badgeCatalog.find((badge) => badge.id === id)
export const badgeRequestLimits = { min: 20, max: 600, reasonMax: 280 } as const
