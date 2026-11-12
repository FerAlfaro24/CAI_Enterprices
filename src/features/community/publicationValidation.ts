import type { Category } from './types'

export const publicationLimits = { titleMin: 4, titleMax: 100, bodyMin: 10, bodyMax: 1200 } as const

export interface PublicationDraft {
  title: string
  body: string
  category: Category
  photoIds: readonly string[]
}

export interface PublicationErrors {
  title?: string
  body?: string
  photos?: string
}

/** Same trimmed-length rules as the demo reducer; no server validation implied. */
export function validatePublication(draft: PublicationDraft): PublicationErrors {
  const errors: PublicationErrors = {}
  const titleLength = draft.title.trim().length
  const bodyLength = draft.body.trim().length
  if (titleLength < publicationLimits.titleMin) errors.title = 'Escribe un título de al menos 4 caracteres.'
  else if (titleLength > publicationLimits.titleMax) errors.title = 'El título admite un máximo de 100 caracteres.'
  if (bodyLength < publicationLimits.bodyMin) errors.body = 'Cuenta una experiencia de al menos 10 caracteres.'
  else if (bodyLength > publicationLimits.bodyMax) errors.body = 'La historia admite un máximo de 1200 caracteres.'
  if (draft.category === 'gallery' && !draft.photoIds.length) errors.photos = 'Selecciona al menos una imagen ilustrativa para la galería.'
  return errors
}
