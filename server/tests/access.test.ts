import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import test from 'node:test'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { backupLocalDatabase } from '../backup.ts'
import { openDatabase } from '../database.ts'
import type { LocalRequest, LocalStudent, Receipt, Submission } from '../contracts.ts'

const applicant: Submission = {
  firstName: 'Ana', lastName: "O'Neil", birthDate: '2000-01-01', email: 'ana@example.test', filledBy: 'alumno',
  program: 'Inglés general B1', group: 'Sábados · 9:00', displayName: 'Ana O.', avatarColor: '#1f56d6',
  visibility: 'privado', message: 'Solicitud ficticia para pruebas.', guardianConsent: false, acceptRules: true, acceptPrivacy: true,
}

test('API local: permisos, validación, decisiones y persistencia', async (t) => {
  const root = resolve('.local/tests')
  await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'access-'))
  const path = join(directory, 'test.sqlite')
  let app = createApplication(path)
  const listen = async () => {
    app.server.listen(0, '127.0.0.1')
    await once(app.server, 'listening')
    const address = app.server.address()
    assert.ok(address && typeof address === 'object')
    return `http://127.0.0.1:${address.port}`
  }
  const close = () => new Promise<void>((resolve, reject) => app.server.close((error) => error ? reject(error) : resolve()))
  let base = await listen()
  t.after(async () => {
    if (app.server.listening) await close()
    // Solo se elimina el directorio aleatorio creado por esta prueba, dentro de .local/tests.
    assert.equal(dirname(directory), root)
    assert.ok(directory.startsWith(join(root, 'access-')))
    await rm(directory, { recursive: true })
  })
  const testPassword = 'SoloPrueba-Local-7890'
  app.db.prepare("INSERT INTO admin_users(email, name, password_hash, role) VALUES ('test@example.test', 'Prueba', ?, 'admin')").run(await hashPassword(testPassword))
  let cookie = ''
  const call = (path: string, method = 'GET', data?: unknown, options: { anonymous?: boolean; origin?: string; key?: string } = {}) => fetch(`${base}/api/local${path}`, {
    method, headers: { Origin: options.origin ?? base, ...(options.anonymous ? {} : { Cookie: cookie }),
      ...(data === undefined ? {} : { 'Content-Type': 'application/json' }), ...(options.key ? { 'Idempotency-Key': options.key } : {}) },
    body: data === undefined ? undefined : JSON.stringify(data),
  })
  const requests = async () => (await (await call('/requests')).json() as { requests: LocalRequest[] }).requests
  const students = async () => (await (await call('/students')).json() as { students: LocalStudent[] }).students

  await t.test('la sesión es obligatoria para consultar y decidir', async () => {
    assert.equal((await call('/requests')).status, 401)
    assert.equal((await call('/students')).status, 401)
    assert.equal((await call('/requests/CAI-0001/approve', 'POST', { revision: 1 })).status, 401)
    assert.equal((await call('/auth/login', 'POST', { email: 'test@example.test', password: testPassword }, { origin: 'https://otro.example' })).status, 403)
    assert.equal((await call('/auth/login', 'POST', { email: 'test@example.test', password: 'incorrecta' })).status, 401)
    const response = await call('/auth/login', 'POST', { email: 'test@example.test', password: testPassword })
    assert.equal(response.status, 200)
    const header = response.headers.getSetCookie().at(-1)!
    assert.match(header, /HttpOnly/)
    assert.match(header, /SameSite=Strict/)
    cookie = header.split(';')[0]!
    assert.equal((await call('/requests')).status, 200)
    assert.ok(!JSON.stringify(await (await call('/auth/session')).json()).includes('password'))
    const stored = app.db.prepare('SELECT password_hash FROM admin_users').get() as { password_hash: string }
    assert.notEqual(stored.password_hash, testPassword)
    assert.match(stored.password_hash, /^scrypt:/)
  })
  await t.test('el servidor valida campos, fecha, catálogo y privacidad', async () => {
    for (const invalid of [
      { ...applicant, status: 'aprobada' }, { ...applicant, password: 'NoDebeGuardarse' },
      { ...applicant, birthDate: '2001-02-31' }, { ...applicant, acceptPrivacy: false },
      { ...applicant, program: 'No existe' }, { ...applicant, group: 'No existe' },
      { ...applicant, birthDate: '2016-01-01', filledBy: 'alumno' },
      { ...applicant, birthDate: '2011-01-01', visibility: 'comunidad' },
    ]) assert.equal((await call('/requests', 'POST', invalid, { anonymous: true, key: randomUUID() })).status, 400)
    assert.equal((await requests()).length, 0)
  })
  await t.test('rechaza origen ausente, formato incorrecto y cuerpos excesivos', async () => {
    const url = `${base}/api/local/requests`
    assert.equal((await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 403)
    const headers = { Origin: base, 'Content-Type': 'text/plain', 'Idempotency-Key': randomUUID() }
    assert.equal((await fetch(url, { method: 'POST', headers, body: '{}' })).status, 415)
    assert.equal((await fetch(url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: '{' })).status, 400)
    assert.equal((await call('/requests', 'POST', { ...applicant, message: 'x'.repeat(17_000) }, { key: randomUUID() })).status, 413)
    assert.equal((await requests()).length, 0)
  })
  let receipt: Receipt
  await t.test('reintentar no duplica solicitudes y no se admiten correos activos repetidos', async () => {
    const key = randomUUID()
    const first = await call('/requests', 'POST', applicant, { anonymous: true, key })
    assert.equal(first.status, 201)
    receipt = await first.json() as Receipt
    const retry = await call('/requests', 'POST', applicant, { anonymous: true, key })
    assert.equal(retry.status, 201)
    assert.deepEqual(await retry.json(), receipt)
    assert.equal((await call('/requests', 'POST', { ...applicant, message: 'Cambió' }, { key })).status, 409)
    assert.equal((await call('/requests', 'POST', applicant, { key: randomUUID() })).status, 409)
    assert.equal((await requests()).length, 1)
    assert.equal((await requests())[0]!.name, "Ana O'Neil")
    assert.equal((await students()).length, 0)
  })
  await t.test('aprobar crea un alumno una sola vez y detecta decisiones obsoletas', async () => {
    assert.equal((await call(`/requests/${receipt.id}/approve`, 'POST', { revision: 1 })).status, 200)
    assert.equal((await students()).length, 1)
    assert.equal((await call(`/requests/${receipt.id}/approve`, 'POST', { revision: 1 })).status, 409)
    assert.equal((await call(`/requests/${receipt.id}/reject`, 'POST', { revision: 1 })).status, 409)
    assert.equal((await students()).length, 1)
  })
  await t.test('el menor requiere una autorización documentada antes de aprobar', async () => {
    const minor = { ...applicant, firstName: 'Menor', lastName: 'Prueba', email: 'menor@example.test', birthDate: '2011-01-01', displayName: 'Menor P.', guardianConsent: true, guardian: { name: 'Tutor Prueba', relationship: 'Madre', contact: 'tutor@example.test' } }
    const response = await call('/requests', 'POST', minor, { key: randomUUID() })
    assert.equal(response.status, 201)
    const result = await response.json() as Receipt
    assert.equal((await call(`/requests/${result.id}/approve`, 'POST', { revision: 1 })).status, 409)
    assert.equal((await call(`/requests/${result.id}/consent`, 'POST', { revision: 1 })).status, 400)
    assert.equal((await call(`/requests/${result.id}/consent`, 'POST', { revision: 1, reference: 'Prueba: autorización confirmada en recepción.' })).status, 200)
    assert.equal((await call(`/requests/${result.id}/approve`, 'POST', { revision: 1 })).status, 409)
    assert.equal((await call(`/requests/${result.id}/approve`, 'POST', { revision: 2 })).status, 200)
    assert.equal((await students()).find((student) => student.id === result.id)?.visibility, 'privado')
  })
  await t.test('la suspensión y la sesión persisten después de cerrar y reabrir el servicio', async () => {
    assert.equal((await call(`/students/${receipt.id}`, 'PATCH', { revision: 1, status: 'suspendido' })).status, 200)
    assert.equal((await call(`/students/${receipt.id}`, 'PATCH', { revision: 1, status: 'activo' })).status, 409)
    await close()
    app = createApplication(path)
    base = await listen()
    assert.equal((await students()).find((student) => student.id === receipt.id)?.status, 'suspendido')
    assert.equal((await requests()).length, 2)
    assert.equal((await call(`/students/${receipt.id}`, 'PATCH', { revision: 2, status: 'activo' })).status, 200)
    assert.ok(Number(app.db.prepare('SELECT count(*) AS n FROM audit_log WHERE actor_id IS NOT NULL').get()!.n) >= 5)
  })
  await t.test('deshacer devuelve a pendientes y cerrar sesión revoca la cookie', async () => {
    assert.equal((await call(`/requests/${receipt.id}/undo`, 'POST', { revision: 2 })).status, 200)
    assert.ok(!(await students()).some((student) => student.id === receipt.id))
    assert.equal((await requests()).find((request) => request.id === receipt.id)?.status, 'pendiente')
    assert.equal((await call('/auth/logout', 'POST', {})).status, 200)
    assert.equal((await call('/requests')).status, 401)
  })
  await t.test('el respaldo se puede abrir y conserva solicitudes y decisiones', async () => {
    const file = await backupLocalDatabase(path, join(directory, 'backups'))
    const restored = openDatabase(file)
    try {
      assert.equal(Number(restored.prepare('SELECT count(*) AS n FROM requests').get()!.n), 2)
      assert.equal(Number(restored.prepare('SELECT count(*) AS n FROM students').get()!.n), 1)
      assert.equal(Number(restored.prepare('SELECT count(*) AS n FROM consent_confirmations').get()!.n), 1)
      assert.equal(restored.prepare('SELECT status FROM requests WHERE id = 1').get()!.status, 'pendiente')
    } finally { restored.close() }
  })
  await t.test('limita intentos de acceso fallidos', async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
      assert.equal((await call('/auth/login', 'POST', { email: 'test@example.test', password: 'incorrecta' })).status, 401)
    }
    assert.equal((await call('/auth/login', 'POST', { email: 'test@example.test', password: 'incorrecta' })).status, 429)
  })
})
