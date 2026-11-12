import { createHash, randomBytes } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { OAuth2Client } from 'google-auth-library'
import { tokenFrom } from './auth.ts'
import { transaction, type Database } from './database.ts'
import { HttpError } from './validation.ts'
import type { GoogleState } from './contracts.ts'

export type GoogleIdentity = { subject: string; email: string; nonce: string }
export type GoogleVerifier = (credential: string) => Promise<GoogleIdentity>
export type GoogleOptions = { clientId?: string; verify?: GoogleVerifier }

const challengeCookie = 'cai_google_challenge'
const sessionCookie = 'cai_google_session'
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const cookie = (name: string, value: string, age: number) => `${name}=${value}; HttpOnly; SameSite=Strict; Path=/api/local; Max-Age=${age}`
export const validClientId = (value: string) => /^\d+-[a-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(value)

// La biblioteca oficial comprueba firma, audiencia, emisor y caducidad del ID token.
// Nunca se confía en un correo, subject o JWT decodificado por el navegador.
export function googleVerifier(clientId: string): GoogleVerifier {
  const client = new OAuth2Client(clientId)
  return async (credential) => {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId })
    const payload = ticket.getPayload()
    if (!payload?.sub || payload.email_verified !== true || !payload.email || typeof payload.nonce !== 'string') throw new Error('Identidad incompleta')
    return { subject: payload.sub, email: payload.email, nonce: payload.nonce }
  }
}

export function googleAccounts(db: Database, options: GoogleOptions) {
  const clientId = options.clientId ?? ''
  if (clientId && !validClientId(clientId)) throw new Error('El ID de cliente web de Google no es válido.')
  const verify = options.verify ?? (clientId ? googleVerifier(clientId) : undefined)
  const enabled = () => {
    if (!clientId || !verify) throw new HttpError(503, 'El acceso con Google aún no está configurado. Puedes usar el acceso con contraseña.')
  }
  const identity = (request: IncomingMessage) => {
    const token = tokenFrom(request, sessionCookie)
    if (!token) return undefined
    return db.prepare(`SELECT g.subject, g.email, g.request_id FROM google_sessions s
      JOIN google_identities g ON g.subject = s.subject WHERE s.token_hash = ? AND s.expires_at > ?`).get(hash(token), Date.now()) as { subject: string; email: string; request_id: number | null } | undefined
  }
  const state = (request: IncomingMessage): GoogleState => {
    if (!clientId) return { status: 'anonymous' }
    const account = identity(request)
    if (!account) return { status: 'anonymous' }
    if (!account.request_id) return { status: 'profile', email: account.email }
    const row = db.prepare('SELECT r.status, s.status AS student_status FROM requests r LEFT JOIN students s ON s.request_id = r.id WHERE r.id = ?').get(account.request_id) as { status: string; student_status: string | null }
    const status = row.status === 'pendiente' ? 'pending' : row.status === 'rechazada' ? 'rejected' : row.student_status === 'activo' ? 'approved' : 'suspended'
    return { status, requestId: `CAI-${String(account.request_id).padStart(4, '0')}` }
  }
  const end = (request: IncomingMessage) => {
    const token = tokenFrom(request, sessionCookie)
    if (token) db.prepare('DELETE FROM google_sessions WHERE token_hash = ?').run(hash(token))
    const challenge = tokenFrom(request, challengeCookie)
    if (challenge) db.prepare('DELETE FROM google_challenges WHERE token_hash = ?').run(hash(challenge))
    return [cookie(sessionCookie, '', 0), cookie(challengeCookie, '', 0)]
  }
  return {
    config: () => ({ enabled: Boolean(clientId), clientId: clientId || null }),
    challenge(request: IncomingMessage) {
      enabled()
      const old = tokenFrom(request, challengeCookie)
      if (old) db.prepare('DELETE FROM google_challenges WHERE token_hash = ?').run(hash(old))
      db.prepare('DELETE FROM google_challenges WHERE expires_at <= ?').run(Date.now())
      const nonce = randomBytes(32).toString('hex')
      db.prepare('INSERT INTO google_challenges VALUES (?, ?)').run(hash(nonce), Date.now() + 5 * 60_000)
      return { nonce, clientId, cookie: cookie(challengeCookie, nonce, 300) }
    },
    async signIn(request: IncomingMessage, credential: unknown) {
      enabled()
      const nonce = tokenFrom(request, challengeCookie)
      const challenge = () => nonce && db.prepare('SELECT token_hash FROM google_challenges WHERE token_hash = ? AND expires_at > ?').get(hash(nonce), Date.now())
      if (!challenge() || typeof credential !== 'string' || credential.length > 12_000 || credential.length < 20) throw new HttpError(401, 'Vuelve a pulsar Continuar con Google para iniciar el acceso.')
      let verified: GoogleIdentity
      try { verified = await verify!(credential) }
      catch { throw new HttpError(401, 'No pudimos confirmar la cuenta con Google. Vuelve a intentarlo.') }
      if (verified.nonce !== nonce || !verified.subject || verified.subject.length > 255 || !verified.email || verified.email.length > 120) throw new HttpError(401, 'La respuesta de Google no corresponde a este acceso. Vuelve a intentarlo.')
      return transaction(db, () => {
        // Revalidar tras la operación de red: un reto caducado o ya consumido no sirve.
        if (!challenge()) throw new HttpError(401, 'El acceso caducó o ya se utilizó. Vuelve a continuar con Google.')
        const existing = db.prepare('SELECT request_id FROM google_identities WHERE subject = ?').get(verified.subject)
        // Nunca unir automáticamente cuentas por coincidencia de correo.
        if (!existing && db.prepare("SELECT id FROM requests WHERE email = ? AND status IN ('pendiente','aprobada')").get(verified.email.toLowerCase())) throw new HttpError(409, 'Ya hay una solicitud con este correo. Usa tu acceso original o consulta con CAI para vincular tu cuenta.')
        db.prepare('DELETE FROM google_challenges WHERE token_hash = ?').run(hash(nonce!))
        db.prepare(`INSERT INTO google_identities(subject, email, created_at) VALUES (?, ?, ?)
          ON CONFLICT(subject) DO UPDATE SET email = excluded.email`).run(verified.subject, verified.email.toLowerCase(), new Date().toISOString())
        const cleared = end(request)
        const token = randomBytes(32).toString('hex')
        db.prepare('DELETE FROM google_sessions WHERE expires_at <= ?').run(Date.now())
        db.prepare('INSERT INTO google_sessions VALUES (?, ?, ?)').run(hash(token), verified.subject, Date.now() + 60 * 60_000)
        return { subject: verified.subject, cookies: [...cleared, cookie(sessionCookie, token, 3600)] }
      })
    },
    state,
    requireIdentity(request: IncomingMessage) {
      enabled()
      const account = identity(request)
      if (!account) throw new HttpError(401, 'Vuelve a continuar con Google para completar o consultar tu solicitud.')
      return account
    },
    end,
  }
}
