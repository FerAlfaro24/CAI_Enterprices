import { createHash, randomBytes } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import type { ActivationInvitation, GroupMember, StudentUser, Submission } from './contracts.ts'
import { hashPassword, tokenFrom, verifyPassword } from './auth.ts'
import { transaction, type Database } from './database.ts'
import { HttpError } from './validation.ts'
import { publicProfileId } from './public-profiles.ts'

const cookieName = 'cai_student_session'
const sessionSeconds = 8 * 60 * 60
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
const cookie = (token: string, age: number) => `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api/local; Max-Age=${age}`
const accountQuery = `SELECT r.id, r.payload, a.password_hash FROM requests r
  JOIN students s ON s.request_id = r.id
  LEFT JOIN student_accounts a ON a.request_id = r.id
  WHERE r.status = 'aprobada' AND s.status = 'activo'
  AND (a.request_id IS NOT NULL OR EXISTS (SELECT 1 FROM google_identities g WHERE g.request_id = r.id))`
type AccountRow = { id: number; payload: string; password_hash: string | null }

function userFrom(db: Database, row: AccountRow): StudentUser {
  const p = JSON.parse(row.payload) as Submission
  return { id: `CAI-${String(row.id).padStart(4, '0')}`, publicId: publicProfileId(db, row.id), role: 'student', name: `${p.firstName} ${p.lastName}`,
    displayName: p.displayName, program: p.program, group: p.group, avatarColor: p.avatarColor }
}

function idOf(id: string) {
  if (!/^CAI-\d{4,}$/.test(id) || !Number.isSafeInteger(Number(id.slice(4)))) throw new HttpError(404, 'No se encontró el alumno.')
  return Number(id.slice(4))
}

function validPassword(password: unknown): asserts password is string {
  if (typeof password !== 'string' || [...password].length < 15 || password.length > 128 || password.trim().length < 15) {
    throw new HttpError(400, 'Elige una contraseña de 15 a 128 caracteres. Puedes usar una frase.')
  }
}

export function studentAccounts(db: Database) {
  const activated = (id: number) => db.prepare('SELECT request_id FROM student_accounts WHERE request_id = ? UNION ALL SELECT request_id FROM google_identities WHERE request_id = ?').get(id, id)
  const available = (id: number) => db.prepare("SELECT r.id FROM requests r JOIN students s ON s.request_id = r.id WHERE r.id = ? AND r.status = 'aprobada' AND s.status = 'activo'").get(id)
  const audit = (id: number, action: string, actor: number | null = null) => db.prepare('INSERT INTO audit_log(actor_id, request_id, action, created_at) VALUES (?, ?, ?, ?)').run(actor, id, action, new Date().toISOString())
  const invitation = (token: unknown) => {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new HttpError(400, 'El enlace no es válido, ya se utilizó o caducó. Pide otro a CAI.')
    const row = db.prepare('SELECT request_id FROM student_invitations WHERE token_hash = ? AND expires_at > ?').get(hashToken(token), Date.now()) as { request_id: number } | undefined
    if (!row || !available(row.request_id) || activated(row.request_id)) throw new HttpError(400, 'El enlace no es válido, ya se utilizó o caducó. Pide otro a CAI.')
    return row.request_id
  }
  return {
    invite(id: string, revision: number, actor: number): ActivationInvitation {
      return transaction(db, () => {
        const key = idOf(id)
        const student = db.prepare('SELECT revision FROM students WHERE request_id = ?').get(key) as { revision: number } | undefined
        if (!student || !available(key)) throw new HttpError(409, 'Solo puedes preparar acceso para un alumno aprobado y activo.')
        if (student.revision !== revision) throw new HttpError(409, 'El alumno cambió en otra ventana. Vuelve a cargar sus datos.')
        if (activated(key)) throw new HttpError(409, 'El alumno ya tiene acceso configurado, con Google o contraseña.')
        const token = randomBytes(32).toString('hex')
        const expiresAt = Date.now() + 24 * 60 * 60_000
        db.prepare('INSERT INTO student_invitations VALUES (?, ?, ?, ?) ON CONFLICT(request_id) DO UPDATE SET token_hash = excluded.token_hash, expires_at = excluded.expires_at, created_by = excluded.created_by').run(key, hashToken(token), expiresAt, actor)
        db.prepare('UPDATE students SET revision = revision + 1 WHERE request_id = ?').run(key)
        audit(key, 'student.invited', actor)
        // El fragmento no viaja en solicitudes HTTP ni cabeceras Referer. No se guarda el token en texto.
        return { path: `/activar#token=${token}`, expiresAt: new Date(expiresAt).toISOString() }
      })
    },
    async activate(token: unknown, password: unknown) {
      validPassword(password)
      invitation(token)
      const encoded = await hashPassword(password)
      transaction(db, () => {
        // Volver a validar dentro de la transacción, después de scrypt: suspensiones,
        // renovaciones y usos simultáneos del enlace deben ganar a una lectura antigua.
        const id = invitation(token)
        db.prepare('INSERT INTO student_accounts VALUES (?, ?, ?)').run(id, encoded, new Date().toISOString())
        db.prepare('DELETE FROM student_invitations WHERE request_id = ?').run(id)
        db.prepare('UPDATE students SET revision = revision + 1 WHERE request_id = ?').run(id)
        audit(id, 'student.activated')
      })
    },
    async login(email: string, password: string): Promise<StudentUser | null> {
      const row = db.prepare(`${accountQuery} AND r.email = ?`).get(email.toLowerCase()) as AccountRow | undefined
      const fallback = `scrypt-v2:00000000000000000000000000000000:${'0'.repeat(128)}`
      const valid = await verifyPassword(password, row?.password_hash ?? fallback)
      if (!valid || !row?.password_hash) return null
      const current = db.prepare(`${accountQuery} AND r.id = ?`).get(row.id) as AccountRow | undefined
      return current ? userFrom(db, current) : null
    },
    forGoogle(subject: string): StudentUser | null {
      const row = db.prepare(`${accountQuery} AND r.id = (SELECT request_id FROM google_identities WHERE subject = ?)`).get(subject) as AccountRow | undefined
      return row ? userFrom(db, row) : null
    },
    start(user: StudentUser) {
      const id = idOf(user.id)
      if (!available(id)) throw new HttpError(401, 'El acceso no está disponible. Consulta con CAI.')
      const token = randomBytes(32).toString('hex')
      db.prepare('DELETE FROM student_sessions WHERE expires_at <= ?').run(Date.now())
      db.prepare('INSERT INTO student_sessions VALUES (?, ?, ?)').run(hashToken(token), id, Date.now() + sessionSeconds * 1000)
      return cookie(token, sessionSeconds)
    },
    session(request: IncomingMessage): StudentUser | null {
      const token = tokenFrom(request, cookieName)
      if (!token) return null
      const row = db.prepare(`${accountQuery} AND r.id = (SELECT request_id FROM student_sessions WHERE token_hash = ? AND expires_at > ?)`).get(hashToken(token), Date.now()) as AccountRow | undefined
      return row ? userFrom(db, row) : null
    },
    end(request: IncomingMessage) {
      const token = tokenFrom(request, cookieName)
      if (token) db.prepare('DELETE FROM student_sessions WHERE token_hash = ?').run(hashToken(token))
      return cookie('', 0)
    },
    group(user: StudentUser): GroupMember[] {
      const own = db.prepare(`${accountQuery} AND r.id = ?`).get(idOf(user.id)) as AccountRow | undefined
      if (!own) throw new HttpError(401, 'Tu sesión terminó o el acceso no está disponible.')
      const profile = JSON.parse(own.payload) as Submission
      if (profile.group === 'Por asignar') return []
      const rows = db.prepare(`${accountQuery} ORDER BY r.id`).all() as AccountRow[]
      return rows.flatMap((row) => {
        const p = JSON.parse(row.payload) as Submission
        return p.program === profile.program && p.group === profile.group ? [{ id: publicProfileId(db, row.id), displayName: p.displayName, avatarColor: p.avatarColor }] : []
      })
    },
  }
}
