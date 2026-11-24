/** Misma regla para registro, activación y recuperación; no modifica claves existentes. */
export const studentPasswordPolicy = { minLength: 8, maxLength: 128 } as const
export const studentPasswordHint = 'Usa de 8 a 128 caracteres. No necesitas números ni símbolos.'

export function isValidStudentPassword(value: unknown): value is string {
  return typeof value === 'string' &&
    value.length <= studentPasswordPolicy.maxLength &&
    [...value.trim()].length >= studentPasswordPolicy.minLength
}
