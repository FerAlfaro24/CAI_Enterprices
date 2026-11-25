import { randomBytes, timingSafeEqual } from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'

// Identificadores públicos. Esta función solo identifica al visitante de la muestra;
// nunca concede permisos de alumno/coordinación ni accede a la base escolar.
export const presentationOrigin = 'https://cai-enterprices.vercel.app'
export const presentationGoogleClientId = '534198422441-s2hdugmeslqe2vvo5dde8tgr6fv5gro9.apps.googleusercontent.com'
const challengeName = '__Host-cai_demo_google_challenge'
const sessionName = '__Host-cai_demo_google_session'
const maxBytes = 8192
type Identity = { nonce: string; expiresAt: number }
export type PresentationVerifier = (credential: string) => Promise<Identity>

export function presentationVerifier(): PresentationVerifier {
  const client = new OAuth2Client(presentationGoogleClientId)
  return async credential => {
    // La biblioteca oficial verifica firma, audiencia, emisor y caducidad.
    const ticket = await client.verifyIdToken({ idToken: credential, audience: presentationGoogleClientId })
    const payload = ticket.getPayload()
    if (!payload?.sub || !payload.email || payload.email_verified !== true ||
      typeof payload.nonce !== 'string' || !Number.isFinite(payload.exp) || !Number.isFinite(payload.iat)) throw new Error('Identidad incompleta')
    return { nonce: payload.nonce, expiresAt: Math.min(payload.exp!, payload.iat! + 1800) * 1000 }
  }
}

const cookie = (name: string, value: string, age: number) => `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=${age}`
function readCookie(request: Request, name: string) {
  const matches = (request.headers.get('cookie') ?? '').split(';').map(item => item.trim()).filter(item => item.startsWith(name + '='))
  return matches.length === 1 ? matches[0]!.slice(name.length + 1) : ''
}
function sameNonce(a: string, b: string) {
  return /^[a-f0-9]{64}$/.test(a) && /^[a-f0-9]{64}$/.test(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b))
}
function response(body: object, status = 200, cookies: string[] = []) {
  const headers = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, private', 'Pragma': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' })
  for (const value of cookies) headers.append('Set-Cookie', value)
  return new Response(JSON.stringify(body), { status, headers })
}
async function readBody(request: Request): Promise<Record<string, unknown>> {
  const length = request.headers.get('content-length')
  if (length && (!/^\d+$/.test(length) || Number(length) > maxBytes)) throw new Error('Cuerpo demasiado grande')
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Cuerpo ausente')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) { await reader.cancel(); throw new Error('Cuerpo demasiado grande') }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const body: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Objeto requerido')
  return body as Record<string, unknown>
}

export function createPresentationGoogle(verify: PresentationVerifier = presentationVerifier()) {
  return async (request: Request): Promise<Response> => {
    const url = new URL(request.url), action = url.searchParams.get('action')
    // Únicamente el dominio público autorizado; las previews no son orígenes OAuth.
    if (url.origin !== presentationOrigin) return response({ error: 'Abre la presentación desde cai-enterprices.vercel.app para usar Google.' }, 403)
    if (!['config', 'challenge', 'signin', 'session', 'logout'].includes(action ?? '') || [...url.searchParams.keys()].some(key => key !== 'action') || url.searchParams.getAll('action').length !== 1) return response({ error: 'Ruta desconocida.' }, 404)
    const expectedMethod = action === 'config' || action === 'session' ? 'GET' : 'POST'
    if (request.method !== expectedMethod) return response({ error: 'Método no permitido.' }, 405)
    const site = request.headers.get('sec-fetch-site')
    if (site && site !== 'same-origin' && site !== 'none') return response({ error: 'Origen no permitido.' }, 403)
    if (request.method === 'POST') {
      if (request.headers.get('origin') !== presentationOrigin) return response({ error: 'Origen no permitido.' }, 403)
      if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? '')) return response({ error: 'Se requiere JSON.' }, 415)
    }
    if (action === 'config') return response({ enabled: true, clientId: presentationGoogleClientId })
    const clearChallenge = cookie(challengeName, '', 0), clearSession = cookie(sessionName, '', 0)
    if (action === 'logout') return response({}, 200, [clearChallenge, clearSession])
    if (action === 'challenge') {
      try { await readBody(request) } catch { return response({ error: 'Solicitud no válida.' }, 400) }
      const nonce = randomBytes(32).toString('hex')
      return response({ clientId: presentationGoogleClientId, nonce }, 200, [cookie(challengeName, nonce, 300)])
    }
    if (action === 'session') {
      const credential = readCookie(request, sessionName)
      if (!credential) return response({ verified: false })
      try {
        if (credential.length > 3600 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(credential)) throw new Error('Sesión inválida')
        const identity = await verify(credential)
        if (identity.expiresAt <= Date.now()) throw new Error('Sesión vencida')
        return response({ verified: true, expiresAt: identity.expiresAt })
      } catch { return response({ verified: false }, 200, [clearSession]) }
    }
    try {
      const body = await readBody(request), nonce = readCookie(request, challengeName)
      if (!/^[a-f0-9]{64}$/.test(nonce) || !sameNonce(nonce, typeof body.nonce === 'string' ? body.nonce : '') ||
        typeof body.credential !== 'string' || body.credential.length > 3600 ||
        !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(body.credential)) throw new Error('Credencial inválida')
      const identity = await verify(body.credential)
      const age = Math.floor((identity.expiresAt - Date.now()) / 1000)
      if (!sameNonce(nonce, identity.nonce) || age < 1) throw new Error('Intento vencido')
      // El propio ID token está firmado por Google. No hace falta guardar una
      // contraseña/clave privada nueva en Vercel ni persistir identidad en localStorage.
      return response({ destination: '/community', verified: true }, 200, [clearChallenge, cookie(sessionName, body.credential, Math.min(age, 1800))])
    } catch { return response({ error: 'No pudimos verificar tu cuenta. Vuelve a cargar Google e inténtalo de nuevo.' }, 401, [clearChallenge]) }
  }
}
