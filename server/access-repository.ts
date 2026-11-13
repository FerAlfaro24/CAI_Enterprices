import type { LocalRequest, LocalStudent, Receipt, RequestDecision, RequestStatus, Submission } from './contracts.ts'
import { transaction, type Database } from './database.ts'
import { ageAt, HttpError } from './validation.ts'
import { queueNotice } from './notices.ts'
import { administration, administrationAudit } from './administration.ts'

type RequestRow = { id: number; payload: string; status: RequestStatus; created_at: string; revision: number; confirmed_at: string | null; google_subject: string | null }
const requestSelect = 'SELECT r.*, c.confirmed_at, g.subject AS google_subject FROM requests r LEFT JOIN consent_confirmations c ON c.request_id = r.id LEFT JOIN google_identities g ON g.request_id = r.id'
const folio = (id: number) => `CAI-${String(id).padStart(4, '0')}`

function numericId(id: string) {
  if (!/^CAI-\d{4,}$/.test(id) || !Number.isSafeInteger(Number(id.slice(4)))) throw new HttpError(404, 'No se encontró el registro.')
  return Number(id.slice(4))
}

function toRequest(row: RequestRow): LocalRequest {
  const p = JSON.parse(row.payload) as Submission
  const age = ageAt(p.birthDate)
  const minor = age < 18
  return {
    id: folio(row.id), name: `${p.firstName} ${p.lastName}`, program: p.program,
    ageGroup: minor ? 'menor' : 'adulto', guardianConsent: minor ? row.confirmed_at ? 'recibida' : 'pendiente' : undefined,
    source: 'Formulario web', signInMethod: row.google_subject ? 'google' : 'password', submittedAt: row.created_at.slice(0, 10), message: p.message || 'Sin mensaje adicional.',
    status: row.status, revision: row.revision,
    applicant: { filledBy: p.filledBy, email: p.email, age, group: p.group, studentCode: p.studentCode,
      displayName: p.displayName, avatarColor: p.avatarColor, visibility: p.visibility, guardian: p.guardian },
  }
}

export function accessRepository(db: Database) {
  const audit = (actor: number | null, id: number, action: string) => db.prepare('INSERT INTO audit_log(actor_id, request_id, action, created_at) VALUES (?, ?, ?, ?)').run(actor, id, action, new Date().toISOString())
  return {
    submit(payload: Submission, key: string, googleSubject?: string): Receipt {
      return transaction(db, () => {
        const identity = googleSubject ? db.prepare('SELECT email, request_id FROM google_identities WHERE subject = ?').get(googleSubject) as { email: string; request_id: number | null } | undefined : undefined
        if (googleSubject && (!identity || identity.email.toLowerCase() !== payload.email.toLowerCase())) throw new HttpError(401, 'Vuelve a continuar con Google antes de enviar la solicitud.')
        const existing = db.prepare('SELECT id, payload, created_at FROM requests WHERE idempotency_key = ?').get(key) as { id: number; payload: string; created_at: string } | undefined
        const encoded = JSON.stringify(payload)
        if (existing) {
          // Un identificador de envío nunca permite vincular una solicitud ajena.
          const owner = db.prepare('SELECT subject FROM google_identities WHERE request_id = ?').get(existing.id)
          if (googleSubject ? owner?.subject !== googleSubject : Boolean(owner)) throw new HttpError(409, 'Este envío corresponde a otra solicitud.')
          if (existing.payload !== encoded) throw new HttpError(409, 'Esta solicitud ya se recibió. No vuelvas a enviarla con datos distintos.')
          return { id: folio(existing.id), submittedAt: existing.created_at.slice(0, 10), status: 'pendiente' }
        }
        if (!administration(db).settings().registrationOpen) throw new HttpError(409, 'CAI pausó las nuevas solicitudes. Intenta más tarde o consulta con coordinación.')
        if (!administration(db).groups().some(group => group.active && group.program === payload.program && group.name === payload.group)) throw new HttpError(400, 'Elige un programa y grupo activo del catálogo.')
        if (identity?.request_id !== null && identity?.request_id !== undefined) throw new HttpError(409, 'Tu cuenta de Google ya tiene una solicitud. Consulta su estado o contacta con CAI.')
        if (db.prepare("SELECT id FROM requests WHERE email = ? AND status IN ('pendiente','aprobada')").get(payload.email)) throw new HttpError(409, 'Ya hay una solicitud en revisión o aprobada con ese correo. Consulta con CAI.')
        const created = new Date().toISOString()
        const result = db.prepare('INSERT INTO requests(idempotency_key, email, payload, created_at) VALUES (?, ?, ?, ?)').run(key, payload.email, encoded, created)
        const id = Number(result.lastInsertRowid)
        if (googleSubject) db.prepare('UPDATE google_identities SET request_id = ? WHERE subject = ? AND request_id IS NULL').run(id, googleSubject)
        audit(null, id, 'request.submitted')
        return { id: folio(id), submittedAt: created.slice(0, 10), status: 'pendiente' }
      })
    },
    requests(): LocalRequest[] {
      return (db.prepare(`${requestSelect} ORDER BY r.id DESC`).all() as RequestRow[]).map(toRequest)
    },
    decide(id: string, revision: number, decision: RequestDecision, actor: number, reference?: string) {
      return transaction(db, () => {
        const key = numericId(id)
        const row = db.prepare(`${requestSelect} WHERE r.id = ?`).get(key) as RequestRow | undefined
        if (!row) throw new HttpError(404, 'No se encontró la solicitud.')
        if (row.revision !== revision) throw new HttpError(409, 'La solicitud cambió en otra ventana. Vuelve a cargarla antes de decidir.')
        const request = toRequest(row)
        if (decision === 'undo') {
          if (row.status === 'pendiente') throw new HttpError(409, 'La solicitud ya está pendiente.')
          if (db.prepare("SELECT id FROM requests WHERE email = (SELECT email FROM requests WHERE id = ?) AND id <> ? AND status IN ('pendiente','aprobada')").get(key, key)) throw new HttpError(409, 'Hay otra solicitud activa con ese correo.')
          db.prepare('DELETE FROM student_sessions WHERE request_id = ?').run(key)
          db.prepare('DELETE FROM password_resets WHERE request_id = ?').run(key)
          db.prepare('DELETE FROM student_invitations WHERE request_id = ?').run(key)
          db.prepare('DELETE FROM students WHERE request_id = ?').run(key)
          db.prepare("UPDATE requests SET status = 'pendiente', revision = revision + 1 WHERE id = ?").run(key)
        } else {
          if (row.status !== 'pendiente') throw new HttpError(409, 'La solicitud ya tiene una decisión. Vuelve a cargarla.')
          if (decision === 'consent') {
            if (request.ageGroup !== 'menor' || row.confirmed_at) throw new HttpError(409, 'No hay una autorización pendiente para registrar.')
            if (typeof reference !== 'string' || reference.trim().length < 8 || reference.trim().length > 240) throw new HttpError(400, 'Indica una referencia de la autorización recibida (8 a 240 caracteres).')
            db.prepare('INSERT INTO consent_confirmations VALUES (?, ?, ?, ?)').run(key, actor, reference.trim(), new Date().toISOString())
            db.prepare('UPDATE requests SET revision = revision + 1 WHERE id = ?').run(key)
          } else {
            if (decision === 'approve' && request.ageGroup === 'menor' && !row.confirmed_at) throw new HttpError(409, 'Primero confirma la autorización del tutor.')
            db.prepare('UPDATE requests SET status = ?, revision = revision + 1 WHERE id = ?').run(decision === 'approve' ? 'aprobada' : 'rechazada', key)
            if (decision === 'approve') db.prepare('INSERT INTO students(request_id, joined_at) VALUES (?, ?)').run(key, new Date().toISOString())
          }
        }
        audit(actor, key, `request.${decision}`)
        if (decision === 'approve' || decision === 'reject') queueNotice(db, key, 'Revisión de tu solicitud', decision === 'approve' ? 'CAI aprobó tu solicitud. Usa tu cuenta de Google o consulta con coordinación para activar tu acceso por contraseña.' : 'CAI revisó tu solicitud. Consulta con coordinación e indica tu folio para conocer el siguiente paso.')
      })
    },
    students(): LocalStudent[] {
      const rows = db.prepare(`${requestSelect} JOIN students s ON s.request_id = r.id ORDER BY s.joined_at DESC`).all() as RequestRow[]
      return rows.map((row) => {
        const request = toRequest(row)
        const student = db.prepare('SELECT joined_at, status, revision FROM students WHERE request_id = ?').get(row.id) as { joined_at: string; status: 'activo' | 'suspendido'; revision: number }
        return { id: request.id, name: request.name, program: request.program, group: request.applicant.group,
          ageGroup: request.ageGroup, guardianConsent: request.guardianConsent, joinedAt: student.joined_at.slice(0, 10),
          visibility: request.applicant.visibility, status: student.status, revision: student.revision,
          accountStatus: row.google_subject || db.prepare('SELECT request_id FROM student_accounts WHERE request_id = ?').get(row.id) ? 'activada' : 'pendiente' }
      })
    },
    setStudentStatus(id: string, revision: number, status: 'activo' | 'suspendido', actor: number) {
      return transaction(db, () => {
        const key = numericId(id)
        const row = db.prepare('SELECT revision, status FROM students WHERE request_id = ?').get(key) as { revision: number; status: string } | undefined
        if (!row) throw new HttpError(404, 'No se encontró el alumno.')
        if (row.revision !== revision) throw new HttpError(409, 'El alumno cambió en otra ventana. Vuelve a cargar sus datos.')
        if (row.status === status) throw new HttpError(409, 'El alumno ya tiene ese estado.')
        db.prepare('UPDATE students SET status = ?, revision = revision + 1 WHERE request_id = ?').run(status, key)
        if (status === 'suspendido') {
          db.prepare('DELETE FROM password_resets WHERE request_id = ?').run(key)
          db.prepare('DELETE FROM student_sessions WHERE request_id = ?').run(key)
          db.prepare('DELETE FROM student_invitations WHERE request_id = ?').run(key)
        }
        audit(actor, key, status === 'activo' ? 'student.reactivated' : 'student.suspended')
      })
    },
    assignStudent(id: string, revision: number, program: unknown, group: unknown, confirmed: unknown, actor: number) {
      transaction(db, () => {
        const key = numericId(id)
        const student = db.prepare('SELECT revision FROM students WHERE request_id = ?').get(key)
        const row = db.prepare('SELECT payload FROM requests WHERE id = ?').get(key)
        if (!student || !row) throw new HttpError(404, 'No se encontró el alumno aprobado.')
        if (student.revision !== revision) throw new HttpError(409, 'La ficha cambió en otra ventana. Actualiza antes de guardar.')
        if (confirmed !== true) throw new HttpError(400, 'Confirma el cambio de grupo y sus efectos antes de guardar.')
        const catalog = administration(db).groups().filter(item => item.active)
        if (!catalog.some(item => item.program === program && (item.name === group || group === 'Por asignar'))) throw new HttpError(400, 'Elige un programa y grupo activo del catálogo.')
        const profile = JSON.parse(String(row.payload)) as Submission
        if (profile.program === program && profile.group === group) throw new HttpError(409, 'El alumno ya tiene esa asignación.')
        const before = { program: profile.program, group: profile.group }
        profile.program = String(program); profile.group = String(group)
        db.prepare('UPDATE requests SET payload = ?, revision = revision + 1 WHERE id = ?').run(JSON.stringify(profile), key)
        db.prepare('UPDATE students SET revision = revision + 1 WHERE request_id = ?').run(key)
        db.prepare('DELETE FROM student_sessions WHERE request_id = ?').run(key)
        db.prepare('DELETE FROM student_invitations WHERE request_id = ?').run(key)
        // Mantener la audiencia original de cada envío. Volver a un grupo no republica historias automáticamente.
        holdAuthorComments(db,key,actor,'Cambio de grupo del autor; requiere nueva revisión.')
        db.prepare("UPDATE publications SET status = CASE WHEN status = 'publicada' THEN 'pendiente' ELSE status END, published_at = NULL, revision = revision + 1 WHERE author_id = ? AND status <> 'retirada'").run(key)
        audit(actor, key, 'student.assigned')
        administrationAudit(db, actor, 'student.assigned', { id, before, after: { program, group } })
        queueNotice(db, key, 'Cambio de grupo', 'CAI actualizó tu inscripción. Vuelve a entrar para consultar tu programa y grupo. Tus historias conservan su grupo de origen; las publicadas necesitan una nueva revisión.')
      })
    },
  }
}
import { holdAuthorComments } from './comments.ts'
