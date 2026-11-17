import { reactionKinds, type ReactionKind, type ReactionSummary } from './contracts.ts'
import type { Database } from './database.ts'
import { HttpError, record } from './validation.ts'

export function reactionSummary(db: Database, publication: number, student: number, program: string, group: string): ReactionSummary {
  const counts: ReactionSummary['counts'] = { love: 0, wellDone: 0, congrats: 0, amazing: 0, funny: 0 }
  const rows = db.prepare(`SELECT x.reaction, COUNT(*) AS n FROM post_reactions x
    JOIN students s ON s.request_id=x.student_id JOIN requests r ON r.id=s.request_id
    WHERE x.publication_id=? AND x.reaction IS NOT NULL AND s.status='activo' AND r.status='aprobada'
      AND json_extract(r.payload,'$.program')=? AND json_extract(r.payload,'$.group')=? GROUP BY x.reaction`).all(publication, program, group)
  for (const row of rows) counts[row.reaction as ReactionKind] = Number(row.n)
  const own = db.prepare('SELECT reaction,revision FROM post_reactions WHERE publication_id=? AND student_id=?').get(publication, student)
  return { counts, myReaction: own?.reaction as ReactionKind | null ?? null, revision: Number(own?.revision ?? 0) }
}

/** Called inside the publication transaction, after checking its current audience. */
export function saveReaction(db: Database, publication: number, student: number, value: unknown, key: string, open: boolean) {
  const data = record(value)
  if (Object.keys(data).some(field => !['reaction', 'revision'].includes(field)) ||
    (data.reaction !== null && !reactionKinds.includes(data.reaction as ReactionKind)) ||
    !Number.isSafeInteger(data.revision) || Number(data.revision) < 0) throw new HttpError(400, 'Elige una reacción válida y actualiza la historia antes de continuar.')
  if (!/^[a-f0-9-]{36}$/i.test(key)) throw new HttpError(400, 'Falta el identificador de la reacción.')
  const fingerprint = JSON.stringify([publication, data.reaction, data.revision])
  const previous = db.prepare('SELECT fingerprint FROM reaction_requests WHERE student_id=? AND request_key=?').get(student, key)
  if (previous) {
    if (previous.fingerprint !== fingerprint) throw new HttpError(409, 'Este envío corresponde a otra reacción. Actualiza la historia.')
    return
  }
  if (!open && data.reaction !== null) throw new HttpError(409, 'CAI pausó las nuevas reacciones. Puedes consultar y quitar la tuya.')
  const current = db.prepare('SELECT revision FROM post_reactions WHERE publication_id=? AND student_id=?').get(publication, student)
  if (Number(current?.revision ?? 0) !== data.revision) throw new HttpError(409, 'Tu reacción cambió en otra ventana. Revisa la historia actualizada antes de elegir otra.')
  db.prepare(`INSERT INTO post_reactions(publication_id,student_id,reaction,revision,updated_at) VALUES (?,?,?,?,?)
    ON CONFLICT(publication_id,student_id) DO UPDATE SET reaction=excluded.reaction,revision=excluded.revision,updated_at=excluded.updated_at`)
    .run(publication, student, data.reaction as ReactionKind | null, Number(data.revision) + 1, new Date().toISOString())
  db.prepare('INSERT INTO reaction_requests VALUES (?,?,?,?)').run(student, key, fingerprint, new Date().toISOString())
}
