import { createHash, randomBytes } from 'node:crypto'
import { transaction, type Database } from './database.ts'
import { unrestrictedStudent } from './student-restrictions.ts'
import { HttpError } from './validation.ts'
import type { AccountEmailStatus } from './contracts.ts'

export type AccountMail = { to: string; kind: 'activation' | 'recovery' | 'google-approved' | 'admin-recovery'; path: string; expiresAt: string }
/** Solo el servidor decide destinatario, propósito y enlace. Nunca se registra el token en claro. */
export type AccountMailDelivery = (message: AccountMail) => Promise<void>
type Identity = { id: number; email: string; request_revision: number; student_revision: number; password_hash: string | null; google_subject: string | null; restriction_version: number }
type Job = { id: number; request_id: number; kind: AccountMail['kind']; state: AccountEmailStatus['state']; email_version: string; request_revision: number; student_revision: number; password_version: string | null; google_subject: string | null; restriction_version: number; actor_id: number | null; revision: number; attempts: number; created_at: number; updated_at: number }
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const iso = (time: number) => new Date(time).toISOString()
const keyOf = (id: string) => {
  if (!/^CAI-\d{4,}$/.test(id) || !Number.isSafeInteger(Number(id.slice(4)))) throw new HttpError(404, 'No se encontró el alumno.')
  return Number(id.slice(4))
}

export function accountEmail(db: Database, deliver?: AccountMailDelivery) {
  let working = false, rerun = false, stopped = false
  // Tras un cierre incierto, nunca repetir un correo automáticamente ni conservar un enlace no confirmado.
  db.prepare("UPDATE account_emails SET state='failed',error_code='interrupted',revision=revision+1 WHERE state='sending'").run()
  const identity = (id: number) => db.prepare(`SELECT r.id,r.email,r.revision AS request_revision,s.revision AS student_revision,a.password_hash,
    (SELECT subject FROM google_identities WHERE request_id=r.id LIMIT 1) AS google_subject,
    (SELECT coalesce(sum(revision),0) FROM student_restrictions WHERE student_id=r.id) AS restriction_version
    FROM requests r JOIN students s ON s.request_id=r.id LEFT JOIN student_accounts a ON a.request_id=r.id
    WHERE r.id=? AND r.status='aprobada' AND s.status='activo' AND ${unrestrictedStudent('r.id')}`).get(id) as Identity | undefined
  const eligible = (person: Identity | undefined, kind: AccountMail['kind']) => person && (kind === 'activation' ? !person.password_hash && !person.google_subject : kind === 'recovery' ? Boolean(person.password_hash) : Boolean(person.google_subject))
  const unchanged = (job: Job) => {
    const person = identity(job.request_id)
    return eligible(person, job.kind) && person!.email === job.email_version && person!.request_revision === job.request_revision && person!.student_revision === job.student_revision &&
      person!.password_hash === job.password_version && person!.google_subject === job.google_subject && person!.restriction_version === job.restriction_version
  }
  const queue = (person: Identity, kind: AccountMail['kind'], actor: number | null) => {
    const now = Date.now()
    db.prepare("UPDATE account_emails SET state='cancelled',revision=revision+1 WHERE request_id=? AND kind=? AND state IN ('pending','sending')").run(person.id, kind)
    // Toda nueva emisión revoca enlaces anteriores del mismo propósito.
    if (kind === 'activation') db.prepare('DELETE FROM student_invitations WHERE request_id=?').run(person.id)
    if (kind === 'recovery') db.prepare('DELETE FROM password_resets WHERE request_id=?').run(person.id)
    db.prepare(`INSERT INTO account_emails(request_id,kind,state,email_version,request_revision,student_revision,password_version,google_subject,restriction_version,actor_id,created_at,updated_at)
      VALUES (?,?,'pending',?,?,?,?,?,?,?,?,?)`).run(person.id, kind, person.email, person.request_revision, person.student_revision, person.password_hash, person.google_subject, person.restriction_version, actor, now, now)
  }
  const status = (id: number): AccountEmailStatus | null => {
    const row = db.prepare('SELECT id,kind,state,revision,attempts,created_at,accepted_at FROM account_emails WHERE request_id=? ORDER BY id DESC LIMIT 1').get(id)
    return row ? { id: Number(row.id), kind: row.kind as AccountEmailStatus['kind'], state: row.state as AccountEmailStatus['state'], revision: Number(row.revision), attempts: Number(row.attempts), createdAt: iso(Number(row.created_at)), acceptedAt: row.accepted_at === null ? null : iso(Number(row.accepted_at)) } : null
  }
  const service = {
    enabled: Boolean(deliver),
    stop() { stopped = true },
    /** Se ejecuta dentro de la misma transacción que aprueba la solicitud. */
    approved(id: number, actor: number) {
      if (!deliver) return
      const person = identity(id)
      if (person && !person.password_hash) queue(person, person.google_subject ? 'google-approved' : 'activation', actor)
    },
    requestRecovery(email: string) {
      if (!deliver) return
      transaction(db, () => {
        const row = db.prepare('SELECT id FROM requests WHERE email=? AND status=\'aprobada\'').get(email.toLowerCase())
        const person = row && identity(Number(row.id))
        if (!person || !eligible(person, 'recovery')) return
        if (db.prepare("SELECT id FROM account_emails WHERE request_id=? AND kind='recovery' AND created_at>? LIMIT 1").get(person.id, Date.now() - 15 * 60_000)) return
        queue(person, 'recovery', null)
      })
    },
    forStudent(id: string) {
      const key = keyOf(id)
      if (!db.prepare('SELECT request_id FROM students WHERE request_id=?').get(key)) throw new HttpError(404, 'No se encontró el alumno.')
      return { enabled: Boolean(deliver), delivery: status(key) }
    },
    resend(id: string, revision: number, actor: number) {
      if (!deliver) throw new HttpError(503, 'El envío de correos todavía no está configurado. Puedes preparar un enlace manual.')
      return transaction(db, () => {
        const key = keyOf(id), person = identity(key)
        if (!person || person.student_revision !== revision) throw new HttpError(409, 'Actualiza la ficha. El alumno debe seguir aprobado y activo.')
        const latest = db.prepare('SELECT kind,created_at FROM account_emails WHERE request_id=? ORDER BY id DESC LIMIT 1').get(key)
        const kind = person.google_subject && !person.password_hash ? 'google-approved' : person.password_hash ? 'recovery' : 'activation'
        if (latest && Number(latest.created_at) > Date.now() - 60_000) throw new HttpError(429, 'Espera un minuto antes de volver a enviar el enlace.')
        if (Number(db.prepare('SELECT count(*) AS n FROM account_emails WHERE request_id=? AND created_at>?').get(key, Date.now() - 60 * 60_000)!.n) >= 3) throw new HttpError(429, 'Ya se prepararon tres correos para esta cuenta en una hora. Intenta más tarde.')
        queue(person, kind, actor)
        return { enabled: true, delivery: status(key) }
      })
    },
    async deliverPending(): Promise<void> {
      if (!deliver || stopped) return
      if (working) { rerun = true; return }
      working = true
      try {
        const jobs = db.prepare("SELECT * FROM account_emails WHERE state='pending' ORDER BY id LIMIT 100").all() as Job[]
        for (const job of jobs) {
          if (stopped) return
          if (!unchanged(job) || job.created_at < Date.now() - 24 * 60 * 60_000) {
            db.prepare("UPDATE account_emails SET state='cancelled',revision=revision+1 WHERE id=? AND state='pending'").run(job.id); continue
          }
          const claimed = db.prepare("UPDATE account_emails SET state='sending',attempts=attempts+1,revision=revision+1,updated_at=? WHERE id=? AND state='pending'").run(Date.now(), job.id)
          if (!claimed.changes) continue
          const token = randomBytes(32).toString('hex'), expiresAt = Date.now() + (job.kind === 'recovery' ? 15 * 60_000 : 24 * 60 * 60_000)
          const path = job.kind === 'google-approved' ? '/login' : `${job.kind === 'activation' ? '/activar' : '/recuperar'}#token=${token}`
          try {
            await deliver({ to: job.email_version, kind: job.kind, path, expiresAt: iso(expiresAt) })
            if (stopped) return
            transaction(db, () => {
              const current = db.prepare('SELECT state FROM account_emails WHERE id=?').get(job.id)
              if (current?.state !== 'sending') return
              if (!unchanged(job) || Date.now() >= expiresAt) { db.prepare("UPDATE account_emails SET state='cancelled',revision=revision+1 WHERE id=?").run(job.id); return }
              // El enlace nace utilizable solo después de la aceptación SMTP y revalidación de permisos.
              if (job.kind === 'activation') {
                db.prepare('INSERT INTO student_invitations VALUES (?,?,?,?) ON CONFLICT(request_id) DO UPDATE SET token_hash=excluded.token_hash,expires_at=excluded.expires_at,created_by=excluded.created_by').run(job.request_id, digest(token), expiresAt, job.actor_id)
                db.prepare('UPDATE students SET revision=revision+1 WHERE request_id=?').run(job.request_id)
              } else if (job.kind === 'recovery') {
                db.prepare('INSERT INTO password_resets VALUES (?,?,?,?) ON CONFLICT(request_id) DO UPDATE SET token_hash=excluded.token_hash,expires_at=excluded.expires_at,password_version=excluded.password_version').run(job.request_id, digest(token), expiresAt, job.password_version)
              }
              db.prepare("UPDATE account_emails SET state='accepted',accepted_at=?,updated_at=?,revision=revision+1,error_code=NULL WHERE id=?").run(Date.now(), Date.now(), job.id)
              db.prepare('INSERT INTO audit_log(actor_id,request_id,action,created_at) VALUES (?,?,?,?)').run(job.actor_id, job.request_id, `email.${job.kind}.accepted`, iso(Date.now()))
            })
          } catch {
            if (stopped) return
            db.prepare("UPDATE account_emails SET state='failed',revision=revision+1,error_code='delivery_failed',updated_at=? WHERE id=? AND state='sending'").run(Date.now(), job.id)
          }
        }
        if (jobs.length === 100) rerun = true
      } finally {
        working = false
        if (rerun && !stopped) { rerun = false; await service.deliverPending() }
      }
    },
  }
  return service
}
