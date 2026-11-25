import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, sign } from 'node:crypto'
import { OAuth2Client } from 'google-auth-library'
import { createPresentationGoogle, presentationGoogleClientId, presentationOrigin } from '../presentation-google.ts'

const nonce = 'a'.repeat(64), otherNonce = 'b'.repeat(64)
const credential = 'eyJhbGciOiJSUzI1NiJ9.eyJub25jZSI6ImZpeHR1cmUifQ.fixture'
const challengeCookie = '__Host-cai_demo_google_challenge=' + nonce
const sessionCookie = '__Host-cai_demo_google_session=' + credential
const make = (action: string, method = 'GET', body?: unknown, headers: Record<string, string> = {}) => new Request(presentationOrigin + '/api/presentation-google?action=' + action, {
  method, headers: { ...(method === 'POST' ? { origin: presentationOrigin, 'content-type': 'application/json' } : {}), ...headers },
  body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
})
const valid = () => createPresentationGoogle(async () => ({ nonce, expiresAt: Date.now() + 120_000 }))

test('configuración pública sin identidad ni caché', async () => {
  const response = await valid()(make('config'))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { enabled: true, clientId: presentationGoogleClientId })
  assert.match(response.headers.get('cache-control')!, /no-store/)
  assert.equal(response.headers.get('access-control-allow-origin'), null)
})
test('rechaza previews, acciones duplicadas/desconocidas y métodos incorrectos', async () => {
  const handle = valid()
  assert.equal((await handle(new Request('https://preview.vercel.app/api/presentation-google?action=config'))).status, 403)
  assert.equal((await handle(make('unknown'))).status, 404)
  assert.equal((await handle(make('config&action=config'))).status, 404)
  assert.equal((await handle(make('config&extra=x'))).status, 404)
  assert.equal((await handle(make('signin'))).status, 405)
})
test('todas las escrituras requieren origen exacto, mismo sitio y JSON', async () => {
  for (const action of ['challenge', 'signin', 'logout']) {
    assert.equal((await valid()(make(action, 'POST', {}, { origin: 'https://other.example' }))).status, 403)
    assert.equal((await valid()(make(action, 'POST', {}, { origin: 'null' }))).status, 403)
    assert.equal((await valid()(make(action, 'POST', {}, { 'sec-fetch-site': 'cross-site' }))).status, 403)
    assert.equal((await valid()(make(action, 'POST', {}, { 'content-type': 'text/plain' }))).status, 415)
  }
})
test('desafío aleatorio, ligado a cookie segura, privada y breve', async () => {
  const a = await valid()(make('challenge', 'POST')), b = await valid()(make('challenge', 'POST'))
  const data = await a.json() as { nonce: string }
  assert.match(data.nonce, /^[a-f0-9]{64}$/)
  assert.notEqual(data.nonce, (await b.json() as { nonce: string }).nonce)
  const value = a.headers.getSetCookie()[0]!
  assert.match(value, new RegExp('^__Host-cai_demo_google_challenge=' + data.nonce))
  for (const flag of ['Path=/', 'Secure', 'HttpOnly', 'SameSite=Strict', 'Max-Age=300']) assert.ok(value.includes(flag))
  assert.ok(!value.includes('Domain='))
})
test('sin desafío, con cookie duplicada o nonce ajeno nunca verifica el token', async () => {
  let calls = 0
  const handle = createPresentationGoogle(async () => { calls++; return { nonce, expiresAt: Date.now() + 120_000 } })
  for (const cookies of ['', challengeCookie + '; ' + challengeCookie]) assert.equal((await handle(make('signin', 'POST', { credential, nonce }, { cookie: cookies }))).status, 401)
  assert.equal((await handle(make('signin', 'POST', { credential, nonce: otherNonce }, { cookie: challengeCookie }))).status, 401)
  assert.equal(calls, 0)
})
test('rechaza marcador simulado, cuerpos grandes y JSON no válido', async () => {
  const handle = valid()
  for (const body of [{ credential: 'presentation-only', nonce }, { credential: 'a'.repeat(9000), nonce }, [], null]) {
    assert.equal((await handle(make('signin', 'POST', body, { cookie: challengeCookie }))).status, 401)
  }
  const bad = new Request(presentationOrigin + '/api/presentation-google?action=signin', { method: 'POST', headers: { origin: presentationOrigin, 'content-type': 'application/json', cookie: challengeCookie }, body: '{' })
  assert.equal((await handle(bad)).status, 401)
})
test('rechaza firma inválida, nonce firmado distinto y sesión vencida sin filtrar identidad', async () => {
  for (const verify of [
    async () => { throw new Error('firma incorrecta correo-privado@example.test') },
    async () => ({ nonce: otherNonce, expiresAt: Date.now() + 60_000 }),
    async () => ({ nonce, expiresAt: Date.now() - 1 }),
  ]) {
    const result = await createPresentationGoogle(verify)(make('signin', 'POST', { credential, nonce }, { cookie: challengeCookie }))
    assert.equal(result.status, 401)
    assert.ok(!(await result.text()).includes('correo-privado'))
    assert.equal(result.headers.getSetCookie().length, 1)
    assert.match(result.headers.getSetCookie()[0]!, /Max-Age=0/)
  }
})
test('acceso verificado crea solo cookie HttpOnly y destino de presentación', async () => {
  const response = await valid()(make('signin', 'POST', { credential, nonce }, { cookie: challengeCookie }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { destination: '/community', verified: true })
  const cookies = response.headers.getSetCookie()
  assert.equal(cookies.length, 2)
  assert.match(cookies[1]!, /__Host-cai_demo_google_session=/)
  assert.match(cookies[1]!, /HttpOnly/)
  const age = Number(cookies[1]!.match(/Max-Age=(\d+)/)![1])
  assert.ok(age >= 118 && age <= 120)
})
test('sesión requiere revalidar el ID token y no devuelve nombre, correo ni token', async () => {
  let calls = 0
  const handle = createPresentationGoogle(async value => { calls++; assert.equal(value, credential); return { nonce, expiresAt: Date.now() + 60_000 } })
  assert.deepEqual(await (await handle(make('session'))).json(), { verified: false })
  const result = await (await handle(make('session', 'GET', undefined, { cookie: sessionCookie }))).json() as Record<string, unknown>
  assert.equal(result.verified, true)
  assert.deepEqual(Object.keys(result).sort(), ['expiresAt', 'verified'])
  assert.equal(calls, 1)
})
test('sesión inválida/vencida se limpia; cerrar sesión borra ambas cookies', async () => {
  const handle = createPresentationGoogle(async () => { throw new Error('inválida') })
  const invalid = await handle(make('session', 'GET', undefined, { cookie: sessionCookie }))
  assert.deepEqual(await invalid.json(), { verified: false })
  assert.match(invalid.headers.getSetCookie()[0]!, /Max-Age=0/)
  const logout = await handle(make('logout', 'POST'))
  assert.equal(logout.headers.getSetCookie().length, 2)
  assert.ok(logout.headers.getSetCookie().every(cookie => cookie.includes('Max-Age=0')))
})
test('biblioteca oficial comprueba firma, audiencia, emisor y caducidad de JWT firmados en fixture', async () => {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const certs = { fixture: publicKey.export({ type: 'spki', format: 'pem' }).toString() }, client = new OAuth2Client()
  const now = Math.floor(Date.now() / 1000), header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'fixture' })).toString('base64url')
  const jwt = (changes: object = {}) => {
    const payload = Buffer.from(JSON.stringify({ iss: 'https://accounts.google.com', aud: presentationGoogleClientId, sub: 'fixture', iat: now, exp: now + 600, nonce, ...changes })).toString('base64url')
    const unsigned = header + '.' + payload
    return unsigned + '.' + sign('RSA-SHA256', Buffer.from(unsigned), privateKey).toString('base64url')
  }
  const verify = (token: string) => client.verifySignedJwtWithCertsAsync(token, certs, presentationGoogleClientId, ['accounts.google.com', 'https://accounts.google.com'])
  assert.equal((await verify(jwt())).getPayload()!.sub, 'fixture')
  for (const changes of [{ aud: 'other' }, { iss: 'https://evil.example' }, { iat: now - 2000, exp: now - 1000 }]) await assert.rejects(verify(jwt(changes)))
  const token = jwt(), lastDot = token.lastIndexOf('.')
  await assert.rejects(verify(token.slice(0, lastDot + 1) + 'A'.repeat(342)))
})
