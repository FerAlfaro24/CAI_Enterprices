import { randomUUID } from 'node:crypto'
import { transaction, type Database } from './database.ts'
import type { StudentProfile, StudentUser, Submission } from './contracts.ts'
import { abbreviatedNames, ageAt, HttpError, record, revisionOf } from './validation.ts'

/** Identificador público estable; no expone el folio privado de inscripción. */
export function publicProfileId(db: Database, requestId: number): string {
  const select = db.prepare('SELECT public_id FROM public_profiles WHERE request_id = ?')
  const existing = select.get(requestId) as { public_id: string } | undefined
  if (existing) return existing.public_id
  db.prepare('INSERT OR IGNORE INTO public_profiles(request_id, public_id) VALUES (?, ?)').run(requestId, randomUUID())
  return (select.get(requestId) as { public_id: string }).public_id
}

/** La sesión decide el propietario; el cliente nunca elige un expediente. */
export function studentProfiles(db: Database) {
  const own = (user: StudentUser) => {
    const row = db.prepare(`SELECT r.id, r.payload, r.revision FROM requests r JOIN students s ON s.request_id=r.id
      WHERE r.id=? AND r.status='aprobada' AND s.status='activo'`).get(Number(user.id.slice(4))) as { id: number; payload: string; revision: number } | undefined
    if (!row) throw new HttpError(401, 'Tu acceso ya no está disponible.')
    return { ...row, submission: JSON.parse(row.payload) as Submission }
  }
  const view = (row: ReturnType<typeof own>): StudentProfile => ({
    displayName: row.submission.displayName, avatarColor: row.submission.avatarColor, revision: row.revision,
    nameOptions: ageAt(row.submission.birthDate) < 18 ? abbreviatedNames(row.submission.firstName, row.submission.lastName) : null,
  })
  return {
    get(user: StudentUser) { return view(own(user)) },
    update(user: StudentUser, value: unknown): StudentProfile {
      const data = record(value)
      if (Object.keys(data).some(key => !['revision', 'displayName', 'avatarColor'].includes(key))) throw new HttpError(400, 'El perfil contiene datos no admitidos.')
      const revision = revisionOf(data.revision)
      if (typeof data.displayName !== 'string' || !data.displayName.trim() || data.displayName.trim().length > 141 || /[\p{Cc}\p{Cf}]/u.test(data.displayName)) throw new HttpError(400, 'Escribe un nombre visible de 1 a 141 caracteres, en una sola línea.')
      if (typeof data.avatarColor !== 'string' || !/^#[a-f0-9]{6}$/i.test(data.avatarColor)) throw new HttpError(400, 'Revisa el color del avatar.')
      const displayName = data.displayName.trim(), avatarColor = data.avatarColor.toLowerCase()
      return transaction(db, () => {
        const row = own(user), current = view(row)
        // Un reintento idéntico confirma lo guardado sin repetir cambios ni auditoría.
        if (row.revision !== revision) {
          if (row.revision === revision + 1 && current.displayName === displayName && current.avatarColor.toLowerCase() === avatarColor) return current
          throw new HttpError(409, 'Tu perfil cambió en otra ventana o coordinación actualizó tu ficha. Carga el perfil actual antes de guardar.')
        }
        if (current.nameOptions && !current.nameOptions.includes(displayName)) throw new HttpError(400, 'El perfil de un menor debe conservar un nombre abreviado.')
        if (current.displayName === displayName && current.avatarColor.toLowerCase() === avatarColor) return current
        const submission = { ...row.submission, displayName, avatarColor }
        db.prepare('UPDATE requests SET payload=?, revision=revision+1 WHERE id=?').run(JSON.stringify(submission), row.id)
        db.prepare('UPDATE students SET revision=revision+1 WHERE request_id=?').run(row.id)
        db.prepare("INSERT INTO audit_log(actor_id,request_id,action,created_at) VALUES (NULL,?,'student.profile_updated',?)").run(row.id, new Date().toISOString())
        return view({ ...row, submission, revision: row.revision + 1 })
      })
    },
  }
}
