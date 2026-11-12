import { createHash, randomBytes } from 'node:crypto'
import { hashPassword } from './auth.ts'
import { transaction, type Database } from './database.ts'
import { HttpError } from './validation.ts'
import { administrationAudit } from './administration.ts'

export type AdminRecoveryMail = { to: string; path: string; expiresAt: string }
/** Adaptador privado de servidor. Nunca acepta un destino o URL proporcionado por el navegador. */
export type AdminRecoveryDelivery = (mail: AdminRecoveryMail) => Promise<void>
const digest = (token: string) => createHash('sha256').update(token).digest('hex')
const invalid = () => new HttpError(400, 'El enlace no es válido, caducó o ya se utilizó. Solicita uno nuevo.')
export const adminRecoveryMessage = 'Si el correo corresponde a una cuenta administrativa, se preparará su recuperación. En el entorno local habitual todavía no se envían correos. No se ha cambiado ninguna contraseña.'

export function adminRecovery(db: Database, deliver?: AdminRecoveryDelivery) {
  let working = false, stopped = false, rerun = false
  // Un proceso interrumpido no deja una entrega bloqueada ni un enlace sin confirmar utilizable.
  db.prepare("UPDATE admin_password_resets SET state='pending', token_hash=NULL, expires_at=NULL WHERE state='sending'").run()
  const reset = (token: unknown) => {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw invalid()
    const row = db.prepare(`SELECT u.id FROM admin_password_resets p JOIN admin_users u ON u.id=p.user_id
      WHERE p.token_hash=? AND p.state='delivered' AND p.expires_at>? AND p.password_version=u.password_hash AND p.email_version=u.email AND u.role='admin' AND u.active=1 AND u.activated=1`).get(digest(token), Date.now()) as {id:number} | undefined
    if (!row) throw invalid()
    return row
  }
  const service = {
    stop() { stopped = true },
    request(email: string) {
      const user = db.prepare("SELECT id,email,password_hash FROM admin_users WHERE email=? AND role='admin' AND active=1 AND activated=1").get(email.toLowerCase()) as {id:number;email:string;password_hash:string} | undefined
      if (!user) return
      db.prepare(`INSERT INTO admin_password_resets(user_id,requested_at,password_version,email_version,state) VALUES (?,?,?,?,'pending')
        ON CONFLICT(user_id) DO UPDATE SET requested_at=excluded.requested_at,password_version=excluded.password_version,email_version=excluded.email_version,state='pending',token_hash=NULL,expires_at=NULL
        WHERE admin_password_resets.requested_at<=?`).run(user.id, Date.now(), user.password_hash, user.email, Date.now()-15*60_000)
    },
    async deliverPending(): Promise<void> {
      if (!deliver || stopped) return
      if (working) { rerun=true; return }
      working = true
      try {
        const rows = db.prepare(`SELECT p.user_id,p.requested_at,p.password_version,p.email_version AS email FROM admin_password_resets p
          JOIN admin_users u ON u.id=p.user_id WHERE p.state='pending' AND u.role='admin' AND u.active=1 AND u.activated=1`).all() as {user_id:number;requested_at:number;password_version:string;email:string}[]
        for (const row of rows) {
          if (stopped) return
          const current = db.prepare("SELECT password_hash,email FROM admin_users WHERE id=? AND role='admin' AND active=1 AND activated=1").get(row.user_id)
          if (current?.password_hash !== row.password_version || current?.email !== row.email || row.requested_at < Date.now()-15*60_000) {
            db.prepare("UPDATE admin_password_resets SET state='cancelled' WHERE user_id=? AND requested_at=?").run(row.user_id,row.requested_at); continue
          }
          const token=randomBytes(32).toString('hex'), tokenHash=digest(token), expiresAt=Date.now()+15*60_000
          const claimed=db.prepare("UPDATE admin_password_resets SET state='sending',token_hash=?,expires_at=? WHERE user_id=? AND requested_at=? AND state='pending'").run(tokenHash,expiresAt,row.user_id,row.requested_at)
          if (!claimed.changes) continue
          try {
            await deliver({to:row.email,path:`/recuperar-administracion#token=${token}`,expiresAt:new Date(expiresAt).toISOString()})
            if (stopped) return
            transaction(db,()=>{
              const credential=db.prepare("SELECT password_hash,email FROM admin_users WHERE id=? AND role='admin' AND active=1 AND activated=1").get(row.user_id)
              if (credential?.password_hash !== row.password_version || credential?.email !== row.email || Date.now() >= expiresAt) {
                db.prepare("UPDATE admin_password_resets SET state='cancelled',token_hash=NULL,expires_at=NULL WHERE user_id=? AND token_hash=?").run(row.user_id,tokenHash); return
              }
              const result=db.prepare("UPDATE admin_password_resets SET state='delivered' WHERE user_id=? AND token_hash=? AND state='sending'").run(row.user_id,tokenHash)
              if (result.changes) administrationAudit(db,row.user_id,'account.recovery_link_delivered',{})
            })
          } catch {
            if (stopped) return
            db.prepare("UPDATE admin_password_resets SET state='failed',token_hash=NULL,expires_at=NULL WHERE user_id=? AND token_hash=?").run(row.user_id,tokenHash)
          }
        }
      } finally {
        working=false
        // Una solicitud recibida durante una entrega también debe procesarse, sin otro clic.
        if (rerun && !stopped) { rerun=false; await service.deliverPending() }
      }
    },
    async changePassword(token: unknown, password: unknown) {
      if (typeof password !== 'string' || [...password].length<15 || password.trim().length<15 || password.length>128) throw new HttpError(400,'Elige una contraseña de 15 a 128 caracteres. Puedes usar una frase.')
      reset(token)
      const encoded=await hashPassword(password)
      return transaction(db,()=>{
        const user=reset(token)
        db.prepare('UPDATE admin_users SET password_hash=? WHERE id=?').run(encoded,user.id)
        db.prepare('DELETE FROM admin_password_resets WHERE user_id=?').run(user.id)
        const revoked=Number(db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id).changes)
        administrationAudit(db,user.id,'account.password_recovered',{sessionsRevoked:revoked})
        return user.id
      })
    },
  }
  return service
}
