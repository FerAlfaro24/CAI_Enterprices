import type { IncomingMessage } from 'node:http'

export type OperationalEvent = {
  event: 'request' | 'internal_error'; requestId: string; method: string; scope: string; status: number; durationMs: number
}
export type OperationalLog = (event: OperationalEvent) => void
const scopes = new Set(['health', 'ready', 'catalog', 'auth', 'student', 'google', 'recovery', 'admin-recovery', 'admin-activation', 'requests', 'students', 'posts', 'contact', 'gallery', 'groups', 'settings', 'admin-team', 'badges', 'challenges'])

/** Solo categorías conocidas; nunca URL, query, token, cabeceras, IP, cuerpo o expediente. */
export function requestLogFields(request: IncomingMessage) {
  const scope = request.url?.split('?')[0]?.split('/')[3] ?? ''
  return { method: ['GET', 'POST', 'PATCH'].includes(request.method ?? '') ? request.method! : 'OTHER', scope: scopes.has(scope) ? scope : 'unknown' }
}

export function writeOperationalLog(log: OperationalLog | undefined, event: OperationalEvent) {
  try { log?.(event) } catch { /* Un destino de log fallido no cambia la operación del alumno. */ }
}
