import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { openDatabase } from './database.ts'
import { accessRepository } from './access-repository.ts'
import { authRepository } from './auth.ts'
import { studentAccounts } from './student-accounts.ts'
import { googleAccounts, type GoogleOptions } from './google-auth.ts'
import { HttpError, record, revisionOf, validateSubmission } from './validation.ts'
import type { RequestDecision } from './contracts.ts'

const frontendOrigins = ['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:4180', 'http://localhost:4180']

async function body(request: IncomingMessage) {
  if (request.headers['content-type']?.split(';')[0]?.trim() !== 'application/json') throw new HttpError(415, 'Envía los datos como JSON.')
  const chunks: Buffer[] = []
  let size = 0
  for await (const part of request) {
    const chunk = Buffer.from(part)
    size += chunk.length
    if (size <= 16_384) chunks.push(chunk)
  }
  if (size > 16_384) throw new HttpError(413, 'La solicitud es demasiado grande.')
  try { return record(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
  catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400, 'No se pudieron leer los datos enviados.')
  }
}

function json(response: ServerResponse, status: number, data: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' })
  response.end(JSON.stringify(data))
}

export function createApplication(databasePath: string, googleOptions: GoogleOptions = {}) {
  const db = openDatabase(databasePath)
  const access = accessRepository(db)
  const auth = authRepository(db)
  const studentAuth = studentAccounts(db)
  const google = googleAccounts(db, googleOptions)
  const limits = new Map<string, { count: number; until: number }>()
  const limit = (key: string, maximum: number, duration: number) => {
    const now = Date.now()
    for (const [name, entry] of limits) if (entry.until <= now) limits.delete(name)
    const entry = limits.get(key) ?? { count: 0, until: now + duration }
    entry.count++
    limits.set(key, entry)
    if (entry.count > maximum) throw new HttpError(429, 'Has hecho varios intentos. Espera unos minutos antes de volver a probar.')
  }

  const handle = async (request: IncomingMessage, response: ServerResponse) => {
    const host = request.headers.host ?? ''
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new HttpError(403, 'Este servicio solo está disponible en el equipo local.')
    if (!['127.0.0.1', '::ffff:127.0.0.1', '::1'].includes(request.socket.remoteAddress ?? '')) throw new HttpError(403, 'Acceso local requerido.')
    const url = new URL(request.url ?? '/', `http://${host}`)
    const path = url.pathname
    const method = request.method
    if (!['GET', 'POST', 'PATCH'].includes(method ?? '')) throw new HttpError(405, 'Método no permitido.')
    if (method !== 'GET') {
      const origin = request.headers.origin
      if (!origin || ![...frontendOrigins, `http://${host}`].includes(origin)) throw new HttpError(403, 'El origen de la solicitud no está permitido.')
      if (request.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'Solicitud de otro sitio no permitida.')
    }
    limit(`all:${request.socket.remoteAddress}`, 600, 60_000)
    if (path === '/api/local/health' && method === 'GET') return json(response, 200, { status: 'ok', mode: 'local-test' })
    if (path === '/api/local/google/config' && method === 'GET') return json(response, 200, google.config())
    if (path === '/api/local/google/challenge' && method === 'POST') {
      limit(`google-challenge:${request.socket.remoteAddress}`, 30, 15 * 60_000)
      const challenge = google.challenge(request)
      response.setHeader('Set-Cookie', challenge.cookie)
      return json(response, 200, { nonce: challenge.nonce, clientId: challenge.clientId })
    }
    if (path === '/api/local/google/signin' && method === 'POST') {
      limit(`google-signin:${request.socket.remoteAddress}`, 30, 15 * 60_000)
      const data = await body(request)
      if (Object.keys(data).some((key) => key !== 'credential')) throw new HttpError(400, 'El acceso contiene datos no admitidos.')
      const result = await google.signIn(request, data.credential)
      const user = studentAuth.forGoogle(result.subject)
      response.setHeader('Set-Cookie', [...result.cookies, studentAuth.end(request), ...(user ? [studentAuth.start(user)] : [])])
      return json(response, 200, { destination: user ? '/alumnos' : '/solicitud-google' })
    }
    if (path === '/api/local/google/session' && method === 'GET') return json(response, 200, google.state(request))
    if (path === '/api/local/google/logout' && method === 'POST') {
      response.setHeader('Set-Cookie', [...google.end(request), studentAuth.end(request)])
      return json(response, 200, { ok: true })
    }
    if (path === '/api/local/google/profile' && method === 'POST') {
      limit(`google-profile:${request.socket.remoteAddress}`, 20, 60 * 60_000)
      const identity = google.requireIdentity(request)
      const data = await body(request)
      // Rechazar, en lugar de aceptar silenciosamente, el cambio del correo verificado.
      if (typeof data.email !== 'string' || data.email.toLowerCase() !== identity.email.toLowerCase()) throw new HttpError(400, 'Usa el correo confirmado por Google.')
      const key = request.headers['idempotency-key']
      if (typeof key !== 'string' || !/^[a-f0-9-]{36}$/i.test(key)) throw new HttpError(400, 'Falta el identificador de la solicitud.')
      return json(response, 201, access.submit(validateSubmission(data), key, identity.subject))
    }
    if (path === '/api/local/google/continue' && method === 'POST') {
      const identity = google.requireIdentity(request)
      const user = studentAuth.forGoogle(identity.subject)
      if (!user) throw new HttpError(403, 'CAI debe aprobar tu solicitud y mantener el acceso activo para que puedas entrar.')
      response.setHeader('Set-Cookie', [studentAuth.end(request), studentAuth.start(user)])
      return json(response, 200, { destination: '/alumnos' })
    }
    if (path === '/api/local/auth/session' && method === 'GET') return json(response, 200, { user: auth.session(request) })
    if (path === '/api/local/auth/login' && method === 'POST') {
      limit(`login:${request.socket.remoteAddress}`, 10, 15 * 60_000)
      const data = await body(request)
      if (typeof data.email !== 'string' || data.email.length > 160 || typeof data.password !== 'string' || data.password.length < 1 || data.password.length > 128) throw new HttpError(400, 'Escribe el correo y la contraseña.')
      const user = await auth.login(data.email.trim(), data.password)
      if (!user) throw new HttpError(401, 'El correo o la contraseña no son correctos.')
      limits.delete(`login:${request.socket.remoteAddress}`)
      response.setHeader('Set-Cookie', [auth.end(request), auth.start(user)])
      return json(response, 200, { user })
    }
    if (path === '/api/local/auth/logout' && method === 'POST') {
      response.setHeader('Set-Cookie', auth.end(request))
      return json(response, 200, { ok: true })
    }
    if (path === '/api/local/activation' && method === 'POST') {
      limit(`activation:${request.socket.remoteAddress}`, 20, 15 * 60_000)
      const data = await body(request)
      if (Object.keys(data).some((key) => !['token', 'password', 'confirm'].includes(key))) throw new HttpError(400, 'La activación contiene datos no admitidos.')
      if (typeof data.confirm !== 'string' || data.password !== data.confirm) throw new HttpError(400, 'Las contraseñas no coinciden.')
      await studentAuth.activate(data.token, data.password)
      // Exigir el acceso normal después de activar, incluso si este navegador
      // conservaba una sesión de otro alumno. No se altera la sesión administrativa.
      response.setHeader('Set-Cookie', [...google.end(request), studentAuth.end(request)])
      return json(response, 200, { ok: true })
    }
    if (path === '/api/local/student/session' && method === 'GET') return json(response, 200, { user: studentAuth.session(request) })
    if (path === '/api/local/student/login' && method === 'POST') {
      limit(`student-login:${request.socket.remoteAddress}`, 10, 15 * 60_000)
      const data = await body(request)
      if (typeof data.email !== 'string' || data.email.length > 160 || typeof data.password !== 'string' || data.password.length < 1 || data.password.length > 128) throw new HttpError(400, 'Escribe el correo y la contraseña.')
      const user = await studentAuth.login(data.email.trim(), data.password)
      if (!user) throw new HttpError(401, 'Los datos no son correctos o el acceso aún no está disponible. Consulta con CAI.')
      limits.delete(`student-login:${request.socket.remoteAddress}`)
      response.setHeader('Set-Cookie', [...google.end(request), studentAuth.end(request), studentAuth.start(user)])
      return json(response, 200, { user })
    }
    if (path === '/api/local/student/logout' && method === 'POST') {
      response.setHeader('Set-Cookie', [...google.end(request), studentAuth.end(request)])
      return json(response, 200, { ok: true })
    }
    if (path.startsWith('/api/local/student/')) {
      const user = studentAuth.session(request)
      if (!user) throw new HttpError(401, 'Tu sesión terminó o el acceso no está disponible. Vuelve a entrar o consulta con CAI.')
      if (path === '/api/local/student/me' && method === 'GET') return json(response, 200, { user })
      if (path === '/api/local/student/group' && method === 'GET') return json(response, 200, { members: studentAuth.group(user) })
      throw new HttpError(404, 'No se encontró esta operación.')
    }
    if (path === '/api/local/requests' && method === 'POST') {
      limit(`submission:${request.socket.remoteAddress}`, 20, 60 * 60_000)
      const key = request.headers['idempotency-key']
      if (typeof key !== 'string' || !/^[a-f0-9-]{36}$/i.test(key)) throw new HttpError(400, 'Falta el identificador de la solicitud.')
      return json(response, 201, access.submit(validateSubmission(await body(request)), key))
    }
    const user = auth.session(request)
    if (!user || user.role !== 'admin') throw new HttpError(401, 'Inicia sesión para abrir la administración local.')
    if (path === '/api/local/requests' && method === 'GET') return json(response, 200, { requests: access.requests() })
    if (path === '/api/local/students' && method === 'GET') return json(response, 200, { students: access.students() })
    const invite = path.match(/^\/api\/local\/students\/(CAI-\d+)\/invitation$/)
    if (invite && method === 'POST') {
      const data = await body(request)
      return json(response, 200, studentAuth.invite(invite[1]!, revisionOf(data.revision), user.id))
    }
    const decision = path.match(/^\/api\/local\/requests\/(CAI-\d+)\/(approve|reject|undo|consent)$/)
    if (decision && method === 'POST') {
      const data = await body(request)
      access.decide(decision[1]!, revisionOf(data.revision), decision[2] as RequestDecision, user.id, typeof data.reference === 'string' ? data.reference : undefined)
      return json(response, 200, { ok: true })
    }
    const student = path.match(/^\/api\/local\/students\/(CAI-\d+)$/)
    if (student && method === 'PATCH') {
      const data = await body(request)
      if (data.status !== 'activo' && data.status !== 'suspendido') throw new HttpError(400, 'Estado del alumno no válido.')
      access.setStudentStatus(student[1]!, revisionOf(data.revision), data.status, user.id)
      return json(response, 200, { ok: true })
    }
    throw new HttpError(404, 'No se encontró esta operación.')
  }

  const server = createServer((request, response) => {
    void handle(request, response).catch((error: unknown) => {
      const known = error instanceof HttpError
      if (!known) console.error('Error interno en la API local. Revisa la base de datos y el estado del servicio.')
      if (!response.headersSent) json(response, known ? error.status : 500, { error: known ? error.message : 'No se pudo completar la operación. Inténtalo de nuevo.' })
      else response.end()
    })
  })
  server.requestTimeout = 15_000
  server.headersTimeout = 10_000
  server.on('close', () => db.close())
  return { server, db }
}
