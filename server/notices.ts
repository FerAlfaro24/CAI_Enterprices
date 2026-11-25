import { unrestrictedStudent } from './student-restrictions.ts'
import { isImportantNotice } from '../shared/notice-policy.ts'
import { isValidStudentPassword, studentPasswordHint } from '../shared/student-password.ts'
import { createHash, randomBytes } from 'node:crypto'
import { hashPassword } from './auth.ts'
import { transaction, type Database } from './database.ts'
import { HttpError, record } from './validation.ts'
import type { StudentNotice, StudentUser } from './contracts.ts'

export function queueNotice(db: Database, id: number, subject: string, message: string, kind = 'information') {
  db.prepare('INSERT INTO local_notices(request_id,subject,message,kind,created_at,important) VALUES (?,?,?,?,?,?)').run(id, subject, message, kind, new Date().toISOString(),Number(isImportantNotice(kind,subject)))
}
const hash = (token: string) => createHash('sha256').update(token).digest('hex')
const eligible = `SELECT r.id, a.password_hash FROM requests r JOIN students s ON s.request_id = r.id
  JOIN student_accounts a ON a.request_id = r.id WHERE r.status = 'aprobada' AND s.status = 'activo' AND ${unrestrictedStudent('r.id')}`
function noticeIds(value:unknown,confirmation=false):number[] {
  const data=record(value)
  if(Object.keys(data).some(key=>!['ids',...(confirmation?['confirmed']:[])].includes(key))||!Array.isArray(data.ids)||data.ids.length>500||new Set(data.ids).size!==data.ids.length||data.ids.some(id=>!Number.isSafeInteger(id)||id<1)||(confirmation&&data.confirmed!==true))throw new HttpError(400,'Revisa las notificaciones y confirma la acción.')
  return data.ids as number[]
}
export function notices(db: Database) {
  const reset = (token: unknown) => {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new HttpError(400, 'El enlace no es válido, caducó o ya se utilizó. Solicita uno nuevo.')
    const row = db.prepare(`${eligible} AND r.id = (SELECT request_id FROM password_resets WHERE token_hash = ? AND expires_at > ? AND password_version = a.password_hash)`).get(hash(token), Date.now()) as { id: number; password_hash: string } | undefined
    if (!row) throw new HttpError(400, 'El enlace no es válido, caducó o ya se utilizó. Solicita uno nuevo.')
    return row
  }
  return {
    requestRecovery(email: string) {
      const row = db.prepare(`${eligible} AND r.email = ?`).get(email.toLowerCase()) as { id: number } | undefined
      if (!row) return
      const recent = db.prepare("SELECT id FROM local_notices WHERE request_id = ? AND kind = 'recovery' AND created_at > ?").get(row.id, new Date(Date.now() - 15 * 60_000).toISOString())
      if (!recent) queueNotice(db, row.id, 'Recuperación de acceso solicitada', 'Solicitud para cambiar la contraseña. La entrega de correo aún no está configurada; este aviso solo permite comprobar el recorrido local.', 'recovery')
    },
    list() {
      return db.prepare(`SELECT n.id, n.subject, n.message, n.kind, n.created_at AS createdAt, n.acknowledged,
        r.email AS recipient FROM local_notices n JOIN requests r ON r.id = n.request_id ORDER BY n.id DESC`).all()
    },
    forStudent(user: StudentUser): StudentNotice[] {
      return db.prepare('SELECT id,subject,message,kind,created_at,student_seen_at,important FROM local_notices WHERE request_id = ? AND student_dismissed_at IS NULL ORDER BY id DESC').all(Number(user.id.slice(4))).map(row => ({ id: Number(row.id), subject: String(row.subject), message: String(row.message), kind: String(row.kind), createdAt: String(row.created_at), read: row.student_seen_at !== null, important: row.important===1 }))
    },
    studentSeen(user: StudentUser, id: number) {
      const result = db.prepare('UPDATE local_notices SET student_seen_at = COALESCE(student_seen_at, ?) WHERE id = ? AND request_id = ? AND student_dismissed_at IS NULL').run(new Date().toISOString(), id, Number(user.id.slice(4)))
      if (!result.changes) throw new HttpError(404, 'No se encontró el aviso.')
    },
    archiveViewed(user:StudentUser,value:unknown) {
      const ids=noticeIds(value),owner=Number(user.id.slice(4))
      transaction(db,()=>{
        const select=db.prepare('SELECT request_id FROM local_notices WHERE id=?')
        for(const id of ids)if(Number(select.get(id)?.request_id)!==owner)throw new HttpError(404,'No se encontró el aviso.')
        const update=db.prepare('UPDATE local_notices SET student_seen_at=COALESCE(student_seen_at,?) WHERE id=? AND request_id=? AND important=0 AND student_dismissed_at IS NULL')
        const now=new Date().toISOString()
        for(const id of ids)update.run(now,id,owner)
      })
    },
    dismissHistory(user:StudentUser,value:unknown) {
      const ids=noticeIds(value,true),owner=Number(user.id.slice(4))
      transaction(db,()=>{
        const select=db.prepare('SELECT request_id,student_seen_at FROM local_notices WHERE id=?')
        for(const id of ids){const row=select.get(id);if(!row||Number(row.request_id)!==owner)throw new HttpError(404,'No se encontró el aviso.');if(row.student_seen_at===null)throw new HttpError(409,'Solo puedes borrar notificaciones del historial. Las importantes requieren Marcar leído.')}
        const update=db.prepare('UPDATE local_notices SET student_dismissed_at=COALESCE(student_dismissed_at,?) WHERE id=? AND request_id=? AND student_seen_at IS NOT NULL')
        const now=new Date().toISOString()
        for(const id of ids)update.run(now,id,owner)
      })
    },
    acknowledge(id: number) {
      const result = db.prepare('UPDATE local_notices SET acknowledged = 1 WHERE id = ?').run(id)
      if (!result.changes) throw new HttpError(404, 'No se encontró el aviso.')
    },
    previewRecovery(id: number, admin: number) {
      return transaction(db, () => {
        const notice = db.prepare("SELECT request_id FROM local_notices WHERE id = ? AND kind = 'recovery'").get(id) as { request_id: number } | undefined
        const account = notice && db.prepare(`${eligible} AND r.id = ?`).get(notice.request_id) as { id: number; password_hash: string } | undefined
        if (!account) throw new HttpError(409, 'El alumno debe tener una cuenta con contraseña aprobada y activa. Google se recupera desde Google.')
        db.prepare("UPDATE account_emails SET state='cancelled',revision=revision+1 WHERE request_id=? AND kind='recovery' AND state IN ('pending','sending')").run(account.id)
        const token = randomBytes(32).toString('hex'), expiresAt = Date.now() + 15 * 60_000
        db.prepare('INSERT INTO password_resets VALUES (?,?,?,?) ON CONFLICT(request_id) DO UPDATE SET token_hash = excluded.token_hash, expires_at = excluded.expires_at, password_version = excluded.password_version').run(account.id, hash(token), expiresAt, account.password_hash)
        db.prepare("INSERT INTO audit_log(actor_id,request_id,action,created_at) VALUES (?,?,'recovery.previewed',?)").run(admin, account.id, new Date().toISOString())
        return { path: `/recuperar#token=${token}`, expiresAt: new Date(expiresAt).toISOString() }
      })
    },
    async changePassword(token: unknown, password: unknown) {
      if (!isValidStudentPassword(password)) throw new HttpError(400, studentPasswordHint)
      reset(token)
      const encoded = await hashPassword(password)
      transaction(db, () => {
        const row = reset(token)
        db.prepare('UPDATE student_accounts SET password_hash = ? WHERE request_id = ?').run(encoded, row.id)
        db.prepare('DELETE FROM password_resets WHERE request_id = ?').run(row.id)
        db.prepare('DELETE FROM student_sessions WHERE request_id = ?').run(row.id)
        db.prepare('DELETE FROM google_sessions WHERE subject IN (SELECT subject FROM google_identities WHERE request_id = ?)').run(row.id)
        db.prepare('DELETE FROM student_invitations WHERE request_id = ?').run(row.id)
        db.prepare("INSERT INTO audit_log(request_id,action,created_at) VALUES (?,'password.changed',?)").run(row.id, new Date().toISOString())
        queueNotice(db, row.id, 'Contraseña cambiada', 'Se cambió la contraseña de tu acceso a CAI. Si no reconoces este cambio, consulta con coordinación.')
      })
    },
  }
}
