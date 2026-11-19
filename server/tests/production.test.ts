import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { authRepository, hashPassword } from '../auth.ts'
import { readRuntimeConfig, type RuntimeConfig } from '../runtime-config.ts'
import { prepareProductionDatabase, checkProductionDatabase } from '../production-storage.ts'
import { startRuntime } from '../runtime-server.ts'
import { accessRepository } from '../access-repository.ts'
import { validateSubmission } from '../validation.ts'
import type { OperationalEvent } from '../operational-log.ts'
import { request as httpRequest } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { createProductionBackup } from '../production-backup.ts'
import { verifyLocalBackup } from '../verify-backup.ts'

test('Producción simulada: HTTPS de proxy, cookies, permisos y límites por cliente', async t => {
  const root = resolve('.local/tests'); await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'production-')), code = join(directory, 'code'), data = join(directory, 'data')
  await mkdir(code); await mkdir(data)
  const origin = 'https://cai.example.test', password = 'Frase inicial exclusivamente ficticia de producción 2026'
  const config = readRuntimeConfig({ NODE_ENV: 'production', CAI_PUBLIC_ORIGIN: origin, CAI_DATA_DIR: data, CAI_TRUST_PROXY: 'loopback' }, code)

  await t.test('no crea una base al comprobar y la preparación explícita nunca sobrescribe', async () => {
    assert.throws(() => checkProductionDatabase(config))
    await assert.rejects(stat(config.databasePath), { code: 'ENOENT' })
    await assert.rejects(prepareProductionDatabase(config, '', password))
    await prepareProductionDatabase(config, 'admin@example.test', password)
    const before = await readFile(config.databasePath)
    await assert.rejects(prepareProductionDatabase(config, 'other@example.test', password))
    assert.deepEqual(await readFile(config.databasePath), before)
    checkProductionDatabase(config)
  })

  await t.test('un esquema distinto bloquea el arranque sin aplicar migraciones', async () => {
    const otherData = join(directory, 'old-data'); await mkdir(otherData)
    const other = readRuntimeConfig({ NODE_ENV: 'production', CAI_PUBLIC_ORIGIN: origin, CAI_DATA_DIR: otherData, CAI_TRUST_PROXY: 'loopback' }, code)
    await prepareProductionDatabase(other, 'old@example.test', password)
    const old = new DatabaseSync(other.databasePath)
    try {
      old.exec('DELETE FROM migrations WHERE version=18')
      await assert.rejects(startRuntime({ ...other, port: 0 }, { log: () => {} }))
      assert.equal(old.prepare('SELECT MAX(version) AS n FROM migrations').get()?.n, 17)
      old.exec("INSERT INTO migrations VALUES (18,'2026-11-17T00:00:00.000Z'); DELETE FROM migrations WHERE version=15")
      await assert.rejects(startRuntime({ ...other, port: 0 }, { log: () => {} }))
      assert.equal(old.prepare('SELECT COUNT(*) AS n FROM migrations').get()?.n, 17)
    } finally { old.close() }
  })
  await t.test('rechaza la política HTTP insegura antes de crear una base', async () => {
    const path = join(data, 'invalid-policy.sqlite')
    assert.throws(() => createApplication(path, {}, { runtime: { mode: 'production', publicOrigin: 'http://cai.example.test', trustedProxy: 'loopback' } }))
    await assert.rejects(stat(path), { code: 'ENOENT' })
  })

  const events: OperationalEvent[] = []
  let failingLog = false
  const app = createApplication(config.databasePath, {
    clientId: '123456-fixture.apps.googleusercontent.com',
    verify: async value => JSON.parse(value),
  }, { runtime: config.policy, log: event => { if (failingLog) throw Error('Destino de log ficticio no disponible'); events.push(event) } })
  app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening')
  t.after(async () => { if (app.server.listening) await new Promise<void>((done, fail) => app.server.close(error => error ? fail(error) : done())) })
  const address = app.server.address(); assert.ok(address && typeof address === 'object')
  const base = `http://127.0.0.1:${address.port}`
  let adminCookie = '', studentCookie = ''
  const call = (path: string, method = 'GET', body?: unknown, cookie = '', extra: Record<string, string | undefined> = {}) => {
    const headers = Object.fromEntries(Object.entries({ Host: 'cai.example.test', Origin: origin, 'X-Forwarded-Proto': 'https', 'X-Forwarded-For': '192.0.2.10', Cookie: cookie, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...extra }).filter((item): item is [string, string] => item[1] !== undefined))
    // Enviar Host explícito como el proxy real; fetch puede sustituirlo por el host de su URL.
    return new Promise<Response>((done, fail) => {
      const request = httpRequest(base + '/api/local' + path, { method, headers }, response => {
        const chunks: Buffer[] = []
        response.on('data', chunk => chunks.push(Buffer.from(chunk)))
        response.on('end', () => {
          const headers = new Headers()
          for (let index = 0; index < response.rawHeaders.length; index += 2) headers.append(response.rawHeaders[index]!, response.rawHeaders[index + 1]!)
          done(new Response(Buffer.concat(chunks), { status: response.statusCode, headers }))
        })
        response.on('error', fail)
      })
      request.on('error', fail)
      request.end(body === undefined ? undefined : JSON.stringify(body))
    })
  }
  const secure = (cookie: string) => {
    assert.match(cookie, /^__Host-cai_/); assert.match(cookie, /; Secure(?:;|$)/); assert.match(cookie, /; HttpOnly(?:;|$)/)
    assert.match(cookie, /; SameSite=Strict(?:;|$)/); assert.match(cookie, /; Path=\/(?:;|$)/); assert.doesNotMatch(cookie, /Domain=/i)
  }
  const sessionUser = async (cookie: string) => {
    const response = await call('/auth/session', 'GET', undefined, cookie)
    return (await response.json() as { user: { name: string } | null }).user
  }
  await t.test('health/readiness no revelan datos y requieren dominio, HTTPS e IP válidos', async () => {
    const response = await call('/health'); assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { status: 'ok', mode: 'production' })
    assert.equal((await call('/ready')).status, 200)
    for (const headers of [{ Host: 'evil.example.test' }, { 'X-Forwarded-Proto': undefined }, { 'X-Forwarded-Proto': 'http' }, { 'X-Forwarded-Proto': 'https, http' }, { 'X-Forwarded-For': undefined }, { 'X-Forwarded-For': '192.0.2.1, 192.0.2.2' }, { 'X-Forwarded-For': 'not-an-ip' }, { Origin: 'https://other.example.test' }]) assert.equal((await call('/health', 'GET', undefined, '', headers)).status, 403)
  })
  await t.test('origen exacto y protección CSRF antes de cualquier cambio', async () => {
    const body = { email: 'admin@example.test', password }
    for (const headers of [{ Origin: undefined }, { Origin: 'null' }, { Origin: 'http://cai.example.test' }, { Origin: 'https://cai.example.test.evil' }, { 'Sec-Fetch-Site': 'cross-site' }]) assert.equal((await call('/auth/login', 'POST', body, '', headers)).status, 403)
    assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM sessions').get()?.n, 0)
  })
  await t.test('sesión administrativa segura y sin aceptar la cookie local antigua', async () => {
    const response = await call('/auth/login', 'POST', { email: 'admin@example.test', password })
    assert.equal(response.status, 200)
    for (const cookie of response.headers.getSetCookie()) secure(cookie)
    adminCookie = response.headers.getSetCookie().at(-1)!.split(';')[0]!
    assert.equal((await sessionUser(adminCookie))?.name, 'Coordinación')
    assert.equal(await sessionUser(adminCookie.replace('__Host-', '')), null)
    assert.match(response.headers.get('strict-transport-security')!, /max-age=/)
  })
  await t.test('alumno usa cookie segura y no hereda permisos administrativos', async () => {
    const actor = Number(app.db.prepare('SELECT id FROM admin_users LIMIT 1').get()!.id)
    const receipt = accessRepository(app.db).submit(validateSubmission({ firstName: 'Alumno', lastName: 'Ficticio', birthDate: '2000-01-01', email: 'student@example.test', filledBy: 'alumno', program: 'Business English', group: 'Mar y jue · 19:30', displayName: 'Alumno F.', avatarColor: '#1f56d6', visibility: 'privado', message: '', guardianConsent: false, acceptRules: true, acceptPrivacy: true }), randomUUID())
    accessRepository(app.db).decide(receipt.id, 1, 'approve', actor)
    app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)), await hashPassword(password), new Date().toISOString())
    const response = await call('/student/login', 'POST', { email: 'student@example.test', password })
    assert.equal(response.status, 200); response.headers.getSetCookie().forEach(secure)
    studentCookie = response.headers.getSetCookie().at(-1)!.split(';')[0]!
    assert.equal((await call('/student/challenges', 'GET', undefined, studentCookie)).status, 200)
    assert.equal(await sessionUser(studentCookie), null)
  })
  await t.test('Google simulado usa retos y sesiones con la misma protección segura', async () => {
    const challenge = await call('/google/challenge', 'POST', {})
    assert.equal(challenge.status, 200); challenge.headers.getSetCookie().forEach(secure)
    const cookie = challenge.headers.getSetCookie()[0]!.split(';')[0]!, nonce = (await challenge.json() as { nonce: string }).nonce
    const response = await call('/google/signin', 'POST', { credential: JSON.stringify({ subject: 'fixture-production-google', email: 'google@example.test', nonce }) }, cookie)
    assert.equal(response.status, 200); response.headers.getSetCookie().forEach(secure)
    assert.ok(response.headers.getSetCookie().some(value => value.startsWith('__Host-cai_google_session=') && !value.includes('Max-Age=0')))
  })
  await t.test('un cliente bloqueado no bloquea a todos los que usan el proxy', async () => {
    for (let i = 0; i < 10; i++) assert.equal((await call('/auth/login', 'POST', { email: 'missing@example.test', password }, '', { 'X-Forwarded-For': '192.0.2.20' })).status, 401)
    assert.equal((await call('/auth/login', 'POST', { email: 'missing@example.test', password }, '', { 'X-Forwarded-For': '192.0.2.20' })).status, 429)
    assert.equal((await call('/auth/login', 'POST', { email: 'missing@example.test', password }, '', { 'X-Forwarded-For': '192.0.2.21' })).status, 401)
  })
  await t.test('registros operativos sin URLs, tokens, credenciales o datos personales', async () => {
    const secret = 'private-token-never-log', email = 'private-person@example.test'
    const response = await call('/unknown-' + secret + '?email=' + email, 'POST', { password: secret }, adminCookie, { 'X-Request-Id': secret })
    assert.equal(response.status, 404); assert.notEqual(response.headers.get('x-request-id'), secret)
    await new Promise(done => setImmediate(done))
    assert.ok(events.length > 0)
    const output = JSON.stringify(events)
    for (const hidden of [secret, email, password, '192.0.2.10', config.databasePath]) assert.ok(!output.includes(hidden))
    for (const event of events) assert.deepEqual(Object.keys(event).sort(), ['event', 'requestId', 'method', 'scope', 'status', 'durationMs'].sort())
  })
  await t.test('un fallo interno no publica trazas ni secretos; un fallo de logs no rompe la respuesta', async () => {
    const prepare = app.db.prepare, secret = 'Contenido privado ficticio que nunca debe registrarse'
    try {
      app.db.prepare = () => { throw Error(secret) }
      const response = await call('/ready')
      assert.equal(response.status, 500)
      assert.ok(!(await response.text()).includes(secret))
      assert.ok(!JSON.stringify(events).includes(secret))
    } finally { app.db.prepare = prepare }
    assert.ok(events.some(event => event.event === 'internal_error' && event.status === 500))
    try { failingLog = true; assert.equal((await call('/ready')).status, 200) }
    finally { failingLog = false }
  })
  await t.test('cerrar sesiones elimina cookies con el mismo ámbito seguro y revoca el servidor', async () => {
    const response = await call('/student/logout', 'POST', {}, studentCookie)
    assert.equal(response.status, 200); response.headers.getSetCookie().forEach(cookie => { secure(cookie); assert.match(cookie, /Max-Age=0/) })
    assert.equal((await call('/student/challenges', 'GET', undefined, studentCookie)).status, 401)
    const logout = await call('/auth/logout', 'POST', {}, adminCookie)
    assert.equal(logout.status, 200); logout.headers.getSetCookie().forEach(secure)
    assert.equal(await sessionUser(adminCookie), null)
  })
  await new Promise<void>((done, fail) => app.server.close(error => error ? fail(error) : done()))

  await t.test('arranque, conflicto de puerto, cierre idempotente y reinicio conservan la cuenta', async () => {
    const runtimeConfig: RuntimeConfig = { ...config, port: 0 }
    const runtime = await startRuntime(runtimeConfig, { log: () => {} })
    try {
      const address = runtime.server.address(); assert.ok(address && typeof address === 'object')
      await assert.rejects(startRuntime({ ...config, port: address.port }, { log: () => {} }))
      assert.ok(await authRepository(runtime.db, { secure: true }).login('admin@example.test', password))
      await Promise.all([runtime.stop(), runtime.stop()])
      assert.equal(runtime.server.listening, false)
      const restarted = await startRuntime(runtimeConfig, { log: () => {} })
      try { assert.ok(await authRepository(restarted.db, { secure: true }).login('admin@example.test', password)) }
      finally { await restarted.stop() }
    } finally { await runtime.stop() }
  })
  await t.test('el respaldo persistente conserva datos y se verifica en un destino separado', async () => {
    const artifact = await createProductionBackup(config)
    assert.equal(artifact.startsWith(join(config.dataDirectory, 'backups') + (process.platform === 'win32' ? '\\' : '/')), true)
    const result = await verifyLocalBackup(artifact)
    assert.equal(result.schema, 18); assert.equal(result.students, 1); assert.equal(result.accounts, 1)
    checkProductionDatabase(config)
  })
})
