import { randomUUID } from 'node:crypto'
import type { Database } from './database.ts'

/** Identificador público estable; no expone el folio privado de inscripción. */
export function publicProfileId(db: Database, requestId: number): string {
  const select = db.prepare('SELECT public_id FROM public_profiles WHERE request_id = ?')
  const existing = select.get(requestId) as { public_id: string } | undefined
  if (existing) return existing.public_id
  db.prepare('INSERT OR IGNORE INTO public_profiles(request_id, public_id) VALUES (?, ?)').run(requestId, randomUUID())
  return (select.get(requestId) as { public_id: string }).public_id
}
