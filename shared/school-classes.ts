export const schoolClasses = ['Inglés', 'Francés', 'Español'] as const
export type SchoolClass = typeof schoolClasses[number]
export const isSchoolClass = (value: unknown): value is SchoolClass =>
  typeof value === 'string' && schoolClasses.includes(value as SchoolClass)
