import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { transaction, type Database } from './database.ts'
import type { LocalUser } from './contracts.ts'
import { HttpError, record } from './validation.ts'
import { administrationAudit } from './administration.ts'

const duration = 8 * 60 * 60
export const cookieName = 'cai_local_session'
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const derive = (password: string, salt: string, parallelism: number) => new Promise<Buffer>((resolve, reject) => {
  scrypt(password, salt, 64, { N: 32768, r: 8, p: parallelism, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key))
})

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  return `scrypt-v2:${salt}:${(await derive(password, salt, 3)).toString('hex')}`
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, salt, hash] = encoded.split(':')
  if (!['scrypt', 'scrypt-v2'].includes(algorithm ?? '') || !salt || !/^[a-f0-9]{32}$/.test(salt) || !hash || !/^[a-f0-9]{128}$/.test(hash)) return false
  return timingSafeEqual(await derive(password, salt, algorithm === 'scrypt-v2' ? 3 : 1), Buffer.from(hash, 'hex'))
}

export function tokenFrom(request: IncomingMessage, name = cookieName) {
  const token = request.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1)
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null
}

export function authRepository(db: Database) {
  const session = (request: IncomingMessage): LocalUser | null => {
    const token = tokenFrom(request)
    if (!token) return null
    const row = db.prepare("SELECT u.id, u.name, u.role FROM sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.role = 'admin'").get(digest(token), Date.now())
    return row ? row as unknown as LocalUser : null
  }
  const account = (id: number) => db.prepare("SELECT password_hash FROM admin_users WHERE id = ? AND role = 'admin'").get(id) as { password_hash: string } | undefined
  return {
    session,
    async login(email: string, password: string) {
      const user = db.prepare("SELECT * FROM admin_users WHERE email = ? AND role = 'admin'").get(email.toLowerCase()) as { id: number; name: string; role: 'admin'; password_hash: string } | undefined
      // Usar scrypt también cuando la cuenta no existe evita una respuesta inmediata distinta.
      const fallback = `scrypt-v2:00000000000000000000000000000000:${'0'.repeat(128)}`
      const valid = await verifyPassword(password, user?.password_hash ?? fallback)
      const current = user ? account(user.id) : undefined
      return valid && user && current?.password_hash === user.password_hash ? { id: user.id, name: user.name, role: user.role } : null
    },
    async changePassword(request: IncomingMessage, value: unknown) {
      const user = session(request)
      if (!user) throw new HttpError(401, 'Tu sesión terminó. Vuelve a entrar antes de cambiar la contraseña.')
      const data = record(value)
      if (Object.keys(data).some(key => !['currentPassword', 'password', 'confirm'].includes(key))) throw new HttpError(400, 'El cambio contiene datos no admitidos.')
      if (typeof data.currentPassword !== 'string' || !data.currentPassword.length || data.currentPassword.length > 128) throw new HttpError(400, 'Escribe tu contraseña actual.')
      if (typeof data.password !== 'string' || [...data.password].length < 15 || data.password.length > 128 || data.password.trim().length < 15) throw new HttpError(400, 'Elige una contraseña de 15 a 128 caracteres. Puedes usar una frase.')
      if (data.confirm !== data.password) throw new HttpError(400, 'Las contraseñas no coinciden.')
      if (data.currentPassword === data.password) throw new HttpError(400, 'Elige una contraseña diferente de la actual.')
      const original = account(user.id)
      if (!original || !await verifyPassword(data.currentPassword, original.password_hash)) throw new HttpError(400, 'La contraseña actual no es correcta.')
      const encoded = await hashPassword(data.password)
      transaction(db, () => {
        if (session(request)?.id !== user.id) throw new HttpError(401, 'Tu sesión terminó durante el cambio. Vuelve a entrar.')
        if (account(user.id)?.password_hash !== original.password_hash) throw new HttpError(409, 'La contraseña cambió en otra sesión. Vuelve a entrar con la contraseña vigente.')
        db.prepare('UPDATE admin_users SET password_hash = ? WHERE id = ?').run(encoded, user.id)
        const revoked = Number(db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id).changes)
        administrationAudit(db, user.id, 'account.password_changed', { sessionsRevoked: revoked })
      })
    },
    start(user: LocalUser) {
      const token = randomBytes(32).toString('hex')
      db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(Date.now())
      db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(digest(token), user.id, Date.now() + duration * 1000)
      return `${cookieName}=${token}; HttpOnly; SameSite=Strict; Path=/api/local; Max-Age=${duration}`
    },
    end(request: IncomingMessage) {
      const token = tokenFrom(request)
      if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(token))
      return `${cookieName}=; HttpOnly; SameSite=Strict; Path=/api/local; Max-Age=0`
    },
  }
}
