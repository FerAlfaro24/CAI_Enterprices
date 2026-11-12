import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { LoginTicket, OAuth2Client } from 'google-auth-library'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { googleVerifier, type GoogleIdentity } from '../google-auth.ts'
import { validateSubmission } from '../validation.ts'
import type { GoogleState, Receipt } from '../contracts.ts'

const clientId = '123456-testclient.apps.googleusercontent.com'
const fixture = {
  firstName: 'Google', lastName: 'Prueba', birthDate: '2000-01-01', filledBy: 'alumno',
  email: 'google@example.test', program: 'Business English', group: 'Mar y jue · 19:30',
  displayName: 'Google P.', avatarColor: '#1f56d6', visibility: 'privado', message: '',
  guardianConsent: false, acceptRules: true, acceptPrivacy: true,
}

test('Google: datos obligatorios, aprobación, sesión y protección de cuentas', async (t) => {
  // Sustituye únicamente al proveedor externo; todo el HTTP, cookies, SQL y permisos son reales.
  const app = createApplication(':memory:', { clientId, verify: async (credential) => {
    if (!credential.startsWith('fixture:')) throw new Error('Firma inválida')
    return JSON.parse(credential.slice(8)) as GoogleIdentity
  } })
  app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening')
  t.after(() => new Promise<void>((resolve, reject) => app.server.close((error) => error ? reject(error) : resolve())))
  const address = app.server.address(); assert.ok(address && typeof address === 'object')
  const base = `http://127.0.0.1:${address.port}`
  const repo = accessRepository(app.db)
  const admin = Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación','unused','admin')").run().lastInsertRowid)
  type Jar = Map<string, string>
  const jar: Jar = new Map()
  const call = async (path: string, method = 'GET', data?: unknown, cookies = jar, headers: Record<string, string> = {}) => {
    const response = await fetch(`${base}/api/local${path}`, { method,
      headers: { Origin: base, Cookie: [...cookies].map(([key, value]) => `${key}=${value}`).join('; '), ...headers, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: data === undefined ? undefined : JSON.stringify(data),
    })
    for (const raw of response.headers.getSetCookie()) {
      const [name, value] = raw.split(';')[0]!.split('=')
      if (value) cookies.set(name!, value); else cookies.delete(name!)
    }
    return response
  }
  const challenge = async (cookies = jar) => {
    const response = await call('/google/challenge', 'POST', {}, cookies)
    assert.equal(response.status, 200)
    return (await response.json() as { nonce: string }).nonce
  }
  const credential = (nonce: string, subject = 'subject-alice', email = fixture.email) => `fixture:${JSON.stringify({ nonce, subject, email })}`
  const signIn = async (cookies = jar, subject = 'subject-alice', email = fixture.email) => call('/google/signin', 'POST', { credential: credential(await challenge(cookies), subject, email) }, cookies)
  const state = async (cookies = jar) => (await (await call('/google/session', 'GET', undefined, cookies)).json()) as GoogleState
  const submit = (data: unknown = fixture, key = randomUUID(), cookies = jar) => call('/google/profile', 'POST', data, cookies, { 'Idempotency-Key': key })
  let id = ''

  await t.test('el reto exige origen permitido y una respuesta válida, ligada al mismo navegador', async () => {
    assert.equal((await call('/google/challenge', 'POST', {}, jar, { Origin: 'https://otro.example' })).status, 403)
    assert.equal((await call('/google/signin', 'POST', { credential: credential('0'.repeat(64)) })).status, 401)
    const nonce = await challenge()
    assert.equal((await call('/google/signin', 'POST', { credential: credential(nonce) }, new Map())).status, 401)
    assert.equal((await call('/google/signin', 'POST', { credential: credential('1'.repeat(64)) })).status, 401)
    assert.equal((await call('/google/signin', 'POST', { credential: 'una-firma-invalida-de-prueba' })).status, 401)
    app.db.prepare('UPDATE google_challenges SET expires_at = 0').run()
    assert.equal((await call('/google/signin', 'POST', { credential: credential(nonce) })).status, 401)
    assert.deepEqual(await state(), { status: 'anonymous' })
    assert.equal((await call('/google/continue', 'POST', {})).status, 401)
  })
  await t.test('Google solo abre el formulario; no concede una sesión de alumno ni de administrador', async () => {
    const nonce = await challenge()
    const oldCookie = new Map(jar)
    const response = await call('/google/signin', 'POST', { credential: credential(nonce) })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { destination: '/solicitud-google' })
    assert.match(response.headers.get('set-cookie')!, /HttpOnly/)
    assert.deepEqual(await state(), { status: 'profile', email: fixture.email })
    assert.equal((await call('/student/me')).status, 401)
    assert.equal((await call('/requests')).status, 401)
    assert.equal((await call('/google/continue', 'POST', {})).status, 403)
    assert.equal((await call('/google/signin', 'POST', { credential: credential(nonce) }, oldCookie)).status, 401)
    assert.ok(!JSON.stringify(await state()).includes('subject'))
  })
  await t.test('nombre, edad y programa son obligatorios; el correo y la identidad no son editables', async () => {
    for (const field of ['firstName', 'lastName', 'birthDate', 'program']) assert.equal((await submit({ ...fixture, [field]: '' })).status, 400)
    assert.equal((await submit({ ...fixture, email: 'otro@example.test' })).status, 400)
    assert.equal((await submit({ ...fixture, subject: 'otra-cuenta' })).status, 400)
    assert.equal((await submit({ ...fixture, status: 'aprobada' })).status, 400)
    assert.equal((await submit(fixture, randomUUID(), new Map())).status, 401)
    const key = randomUUID()
    const response = await submit(fixture, key); assert.equal(response.status, 201)
    id = (await response.json() as Receipt).id
    assert.equal((await submit(fixture, key)).status, 201)
    assert.equal((await submit(fixture)).status, 409)
    assert.equal(repo.requests().find((r) => r.id === id)!.signInMethod, 'google')
    assert.deepEqual(await state(), { status: 'pending', requestId: id })
    assert.equal((await call('/google/continue', 'POST', {})).status, 403)
  })
  await t.test('solo la aprobación activa el acceso y mantiene los permisos de alumno', async () => {
    repo.decide(id, 1, 'approve', admin)
    assert.deepEqual(await state(), { status: 'approved', requestId: id })
    assert.equal(repo.students().find((s) => s.id === id)!.accountStatus, 'activada')
    const continuation = await call('/google/continue', 'POST', {})
    assert.equal(continuation.status, 200)
    assert.deepEqual(await continuation.json(), { destination: '/community' })
    const me = await (await call('/student/me')).json() as { user: { id: string; role: string } }
    assert.equal(me.user.id, id); assert.equal(me.user.role, 'student')
    assert.equal((await call('/requests')).status, 401)
    const members = await (await call('/student/group')).json() as { members: { id: string; displayName: string; avatarColor: string }[] }
    assert.equal(members.members.length, 1)
    assert.deepEqual({ ...members.members[0], id: undefined }, { id: undefined, displayName: fixture.displayName, avatarColor: fixture.avatarColor })
    assert.match(members.members[0]!.id, /^[a-f0-9-]{36}$/)
    assert.equal((await call('/student/login', 'POST', { email: fixture.email, password: 'Una frase ficticia larga 2026' })).status, 401)
  })
  await t.test('suspender o devolver a revisión revoca las sesiones, incluso con Google confirmado', async () => {
    repo.setStudentStatus(id, 1, 'suspendido', admin)
    assert.equal((await call('/student/me')).status, 401)
    assert.deepEqual(await state(), { status: 'suspended', requestId: id })
    assert.equal((await call('/google/continue', 'POST', {})).status, 403)
    repo.setStudentStatus(id, 2, 'activo', admin)
    assert.equal((await call('/student/me')).status, 401)
    const resumed = await signIn()
    assert.equal(resumed.status, 200)
    assert.deepEqual(await resumed.json(), { destination: '/community' })
    assert.equal((await call('/student/me')).status, 200)
    repo.decide(id, 2, 'undo', admin)
    assert.equal((await call('/student/me')).status, 401)
    assert.equal((await call('/google/continue', 'POST', {})).status, 403)
    repo.decide(id, 3, 'approve', admin)
    assert.equal((await call('/student/me')).status, 401)
    assert.equal((await call('/google/continue', 'POST', {})).status, 200)
  })
  await t.test('cambiar de cuenta no conserva permisos de la anterior; logout borra ambas sesiones', async () => {
    assert.equal((await signIn(jar, 'subject-bob', 'bob@example.test')).status, 200)
    assert.equal((await call('/student/me')).status, 401)
    assert.deepEqual(await state(), { status: 'profile', email: 'bob@example.test' })
    assert.equal((await call('/student/logout', 'POST', {})).status, 200)
    assert.deepEqual(await state(), { status: 'anonymous' })
    assert.equal((await call('/google/continue', 'POST', {})).status, 401)
  })
  await t.test('un correo coincidente no vincula automáticamente una cuenta existente', async () => {
    repo.submit(validateSubmission({ ...fixture, email: 'password@example.test' }), randomUUID())
    assert.equal((await signIn(jar, 'subject-collision', 'password@example.test')).status, 409)
    // La clave estable es subject: cambiar el correo de la misma identidad no crea otra cuenta.
    assert.equal((await signIn(jar, 'subject-alice', 'nuevo@example.test')).status, 200)
    assert.equal((await call('/student/me')).status, 200)
    assert.equal((await signIn(new Map(), 'different-subject', fixture.email)).status, 409)
  })
  await t.test('los menores requieren datos y confirmación del tutor antes de aprobar', async () => {
    assert.equal((await signIn(jar, 'subject-minor', 'tutor@example.test')).status, 200)
    const minor = { ...fixture, email: 'tutor@example.test', birthDate: '2016-01-01', filledBy: 'tutor' }
    assert.equal((await submit(minor)).status, 400)
    const response = await submit({ ...minor, guardian: { name: 'Tutor Prueba', relationship: 'Madre', contact: 'tutor@example.test' }, guardianConsent: true })
    assert.equal(response.status, 201)
    const receipt = await response.json() as Receipt
    assert.throws(() => repo.decide(receipt.id, 1, 'approve', admin), /autorización/)
    assert.equal((await call('/google/continue', 'POST', {})).status, 403)
    repo.decide(receipt.id, 1, 'consent', admin, 'Autorización ficticia en recepción')
    repo.decide(receipt.id, 2, 'approve', admin)
    assert.equal((await call('/google/continue', 'POST', {})).status, 200)
    app.db.prepare('UPDATE google_sessions SET expires_at = 0').run()
    assert.deepEqual(await state(), { status: 'anonymous' })
    // La sesión de alumno tiene su propia caducidad; no se renueva con un comprobante vencido.
    assert.equal((await call('/google/continue', 'POST', {})).status, 401)
  })
})

test('sin configuración no se puede iniciar Google', async (t) => {
  const app = createApplication(':memory:')
  app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening')
  t.after(() => new Promise<void>((resolve) => app.server.close(() => resolve())))
  const address = app.server.address(); assert.ok(address && typeof address === 'object')
  const base = `http://127.0.0.1:${address.port}`
  assert.deepEqual(await (await fetch(`${base}/api/local/google/config`)).json(), { enabled: false, clientId: null })
  assert.equal((await fetch(`${base}/api/local/google/challenge`, { method: 'POST', headers: { Origin: base } })).status, 503)
})

test('el adaptador usa la verificación oficial con la audiencia de CAI y exige correo confirmado y nonce', async (t) => {
  const payload = { sub: 'subject-test', email: 'test@example.test', email_verified: true, nonce: 'nonce-test', iss: 'https://accounts.google.com', aud: clientId, iat: 1, exp: 2 }
  const verify = t.mock.method(OAuth2Client.prototype, 'verifyIdToken', async (options: { idToken: string; audience: string }) => {
    assert.equal(options.audience, clientId); assert.equal(options.idToken, 'token-de-prueba')
    return new LoginTicket('', payload)
  })
  assert.deepEqual(await googleVerifier(clientId)('token-de-prueba'), { subject: payload.sub, email: payload.email, nonce: payload.nonce })
  payload.email_verified = false
  await assert.rejects(googleVerifier(clientId)('token-de-prueba'), /Identidad incompleta/)
  assert.equal(verify.mock.callCount(), 2)
})
