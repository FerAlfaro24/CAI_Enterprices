import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import type { Database } from './database.ts'
import type { LocalUser } from './contracts.ts'

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
  return {
    session(request: IncomingMessage): LocalUser | null {
      const token = tokenFrom(request)
      if (!token) return null
      const row = db.prepare("SELECT u.id, u.name, u.role FROM sessions s JOIN admin_users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.role = 'admin'").get(digest(token), Date.now())
      return row ? row as unknown as LocalUser : null
    },
    async login(email: string, password: string) {
      const user = db.prepare('SELECT * FROM admin_users WHERE email = ?').get(email.toLowerCase()) as { id: number; name: string; role: 'admin'; password_hash: string } | undefined
      // Usar scrypt también cuando la cuenta no existe evita una respuesta inmediata distinta.
      const fallback = `scrypt-v2:00000000000000000000000000000000:${'0'.repeat(128)}`
      const valid = await verifyPassword(password, user?.password_hash ?? fallback)
      return valid && user ? { id: user.id, name: user.name, role: user.role } : null
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
