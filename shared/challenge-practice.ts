import type { DailyQuestion } from '../server/contracts.ts'

export const practiceAreas = ['Gramática', 'Vocabulario', 'Vida diaria'] as const

/** Solo respuestas confirmadas por el servidor; no calcula premios nuevos. */
export function dailyPractice(items: readonly DailyQuestion[]) {
  const answered = items.filter(item => item.attempt)
  return {
    answered: answered.length,
    correct: answered.filter(item => item.attempt!.correct).length,
    review: answered.filter(item => !item.attempt!.correct).length,
    points: answered.reduce((sum, item) => sum + item.attempt!.points, 0),
    nextId: items.find(item => !item.attempt)?.id,
    reviewId: answered.find(item => !item.attempt!.correct)?.id ?? answered[0]?.id,
  }
}

/** Tiempo de lectura, sin segundos ni anuncios continuos para lectores de pantalla. */
export function renewalLabel(milliseconds: number) {
  if (!Number.isFinite(milliseconds)) return 'Cada medianoche, hora de Ciudad de México'
  if (milliseconds <= 0) return 'Ya es un nuevo día de práctica'
  const minutes = Math.ceil(milliseconds / 60000), hours = Math.floor(minutes / 60)
  return hours ? `En ${hours} h${minutes % 60 ? ` ${minutes % 60} min` : ''}` : `En ${minutes} min`
}

export function practiceDateLabel(day:string) {
  return new Intl.DateTimeFormat('es-MX',{dateStyle:'long',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'))
}
