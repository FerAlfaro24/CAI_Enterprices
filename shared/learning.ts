/** Límites del logro, compartidos por formulario y servidor. */
export const learningLimits = {
  titleMax: 300,
  practiceMax: 5000,
  expressionMax: 1000,
  legacyExampleMax: 300,
} as const

/** Conserva ejemplos anteriores; omite apartados opcionales vacíos. */
export function learningPublicationBody(item: { practice: string; expression: string; example: string }) {
  return [item.practice, item.expression ? `Palabras o frases:\n${item.expression}` : '', item.example ? `Ejemplo:\n${item.example}` : ''].filter(Boolean).join('\n\n')
}

export const learningPublicationLimits = {
  titleMin: 1, titleMax: learningLimits.titleMax, bodyMin: 1,
  bodyMax: learningLimits.practiceMax + learningLimits.expressionMax + learningLimits.legacyExampleMax + 64,
} as const
