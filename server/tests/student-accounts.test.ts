import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { randomUUID, scrypt } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'
import { createApplication } from '../app.ts'
import { hashPassword, verifyPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { migrateDatabase } from '../database.ts'
import { studentAccounts } from '../student-accounts.ts'
import { validateSubmission } from '../validation.ts'
import type { ActivationInvitation, StudentUser, GroupMember } from '../contracts.ts'

const testPassword = 'Una frase ficticia para pruebas 2026'
const baseSubmission = {
  firstName: 'Alumna', lastName: 'Prueba', birthDate: '2000-01-01', filledBy: 'alumno',
  email: 'alumna@example.test', program: 'Business English', group: 'Mar y jue · 19:30',
  displayName: 'Alumna P.', avatarColor: '#1f56d6', visibility: 'privado', message: '',
  guardianConsent: false, acceptRules: true, acceptPrivacy: true,
}

test('Cuentas de alumnos: activación, permisos, grupos y revocación', async (t) => {
  const root = resolve('.local/tests')
  await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'accounts-'))
  const path = join(directory, 'test.sqlite')
  let app = createApplication(path)
  let repo = accessRepository(app.db)
  const listen = async () => {
    app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening')
    const address = app.server.address()
    assert.ok(address && typeof address === 'object')
    return `http://127.0.0.1:${address.port}`
  }
  let base = await listen()
  const close = () => new Promise<void>((resolve, reject) => app.server.close((error) => error ? reject(error) : resolve()))
  t.after(async () => {
    if (app.server.listening) await close()
    assert.equal(dirname(directory), root)
    assert.ok(directory.startsWith(join(root, 'accounts-')))
    await rm(directory, { recursive: true })
  })
  const adminId = Number(app.db.prepare("INSERT INTO admin_users(email, name, password_hash, role) VALUES ('admin@example.test', 'Coordinación', ?, 'admin')").run(await hashPassword(testPassword)).lastInsertRowid)
  let adminCookie = '', studentCookie = ''
  const call = (path: string, method = 'GET', data?: unknown, role: 'admin' | 'student' | 'anonymous' = 'admin') => fetch(`${base}/api/local${path}`, {
    method, headers: { Origin: base, Cookie: role === 'admin' ? adminCookie : role === 'student' ? studentCookie : '', ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: data === undefined ? undefined : JSON.stringify(data),
  })
  const extractCookie = (response: Response) => response.headers.getSetCookie().at(-1)!.split(';')[0]!
  const login = await call('/auth/login', 'POST', { email: 'admin@example.test', password: testPassword })
  assert.equal(login.status, 200); adminCookie = extractCookie(login)
  const enroll = (email: string, overrides: Record<string, unknown> = {}, approve = true) => {
    const receipt = repo.submit(validateSubmission({ ...baseSubmission, email, ...overrides }), randomUUID())
    if (approve) repo.decide(receipt.id, 1, 'approve', adminId)
    return receipt.id
  }
  const student = (id: string) => repo.students().find((s) => s.id === id)!
  const invite = async (id: string) => {
    const response = await call(`/students/${id}/invitation`, 'POST', { revision: student(id).revision })
    assert.equal(response.status, 200)
    return await response.json() as ActivationInvitation
  }
  const token = (invite: ActivationInvitation) => new URLSearchParams(invite.path.split('#')[1]).get('token')!
  const activate = (invitation: ActivationInvitation) => call('/activation', 'POST', { token: token(invitation), password: testPassword, confirm: testPassword }, 'anonymous')
  const alice = enroll('alice@example.test')
  const bob = enroll('bob@example.test', { firstName: 'Compañero', displayName: 'Compañero P.' })
  const carol = enroll('carol@example.test', { firstName: 'OtroGrupo', displayName: 'OtroGrupo P.', group: 'Viernes · 18:00' })

  await t.test('solo coordinación prepara enlaces y solo para alumnos aprobados y activos', async () => {
    assert.equal((await call(`/students/${alice}/invitation`, 'POST', { revision: 1 }, 'anonymous')).status, 401)
    const pending = enroll('pending@example.test', {}, false)
    assert.equal((await call(`/students/${pending}/invitation`, 'POST', { revision: 1 })).status, 409)
    assert.equal((await call('/student/login', 'POST', { email: 'pending@example.test', password: testPassword }, 'anonymous')).status, 401)
    assert.equal((await call('/student/me', 'GET', undefined, 'anonymous')).status, 401)
  })
  await t.test('renovar invalida el enlace anterior; activar es de un solo uso', async () => {
    const old = await invite(alice), current = await invite(alice)
    assert.equal((await activate(old)).status, 400)
    assert.equal((await call('/activation', 'POST', { token: token(current), password: 'corta', confirm: 'corta' }, 'anonymous')).status, 400)
    assert.equal((await call('/activation', 'POST', { token: token(current), password: testPassword, confirm: testPassword, role: 'admin' }, 'anonymous')).status, 400)
    const response = await activate(current)
    assert.equal(response.status, 200)
    assert.match(response.headers.get('set-cookie')!, /cai_student_session=;.*Max-Age=0/)
    assert.equal((await activate(current)).status, 400)
    assert.equal(student(alice).accountStatus, 'activada')
    const hash = app.db.prepare('SELECT password_hash FROM student_accounts WHERE request_id = ?').get(Number(alice.slice(4)))!.password_hash
    assert.notEqual(hash, testPassword); assert.match(String(hash), /^scrypt-v2:/)
  })
  await t.test('el alumno entra a su perfil y no puede actuar como administrador', async () => {
    const response = await call('/student/login', 'POST', { email: 'alice@example.test', password: testPassword, role: 'admin' }, 'anonymous')
    assert.equal(response.status, 200)
    assert.match(response.headers.getSetCookie().at(-1)!, /HttpOnly/)
    studentCookie = extractCookie(response)
    assert.match(studentCookie, /^cai_student_session=/)
    const { user } = await response.json() as { user: StudentUser }
    assert.equal(user.role, 'student'); assert.equal(user.id, alice)
    const own = await (await call(`/student/me?requestId=${carol}`, 'GET', undefined, 'student')).json() as { user: StudentUser }
    assert.equal(own.user.id, alice)
    for (const path of ['/requests', '/students']) assert.equal((await call(path, 'GET', undefined, 'student')).status, 401)
    assert.equal((await call(`/requests/${bob}/undo`, 'POST', { revision: 2 }, 'student')).status, 401)
    assert.equal((await call(`/students/${bob}/invitation`, 'POST', { revision: 1 }, 'student')).status, 401)
    assert.equal((await call('/requests')).status, 200)
  })
  await t.test('el directorio de grupo omite otros grupos y todos los datos administrativos', async () => {
    assert.equal((await activate(await invite(bob))).status, 200)
    assert.equal((await activate(await invite(carol))).status, 200)
    const response = await call('/student/group', 'GET', undefined, 'student')
    assert.equal(response.status, 200)
    const { members } = await response.json() as { members: GroupMember[] }
    assert.deepEqual(members.map((m) => m.displayName), ['Alumna P.', 'Compañero P.'])
    assert.ok(members.every((member) => Object.keys(member).sort().join(',') === 'avatarColor,displayName'))
    assert.ok(!JSON.stringify(members).includes('@'))
  })
  await t.test('activar otra cuenta cierra la sesión previa de alumno sin cerrar coordinación', async () => {
    const id = enroll('switch@example.test', { program: 'Inglés general A2', group: 'Lun y mié · 8:00' })
    const link = await invite(id)
    const response = await call('/activation', 'POST', { token: token(link), password: testPassword, confirm: testPassword }, 'student')
    assert.equal(response.status, 200)
    assert.match(response.headers.get('set-cookie')!, /Max-Age=0/)
    assert.equal((await call('/student/me', 'GET', undefined, 'student')).status, 401)
    assert.equal((await call('/requests')).status, 200)
    const login = await call('/student/login', 'POST', { email: 'alice@example.test', password: testPassword }, 'anonymous')
    assert.equal(login.status, 200); studentCookie = extractCookie(login)
  })
  await t.test('dos activaciones simultáneas no pueden consumir el mismo enlace', async () => {
    const id = enroll('race@example.test')
    const invitation = await invite(id)
    const results = await Promise.all([activate(invitation), activate(invitation)])
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 400])
  })
  await t.test('caducidad, suspensión y renovación durante el hash cancelan la activación', async () => {
    const id = enroll('expiring@example.test')
    let invitation = await invite(id)
    app.db.prepare('UPDATE student_invitations SET expires_at = 0 WHERE request_id = ?').run(Number(id.slice(4)))
    assert.equal((await activate(invitation)).status, 400)
    invitation = await invite(id)
    repo.setStudentStatus(id, student(id).revision, 'suspendido', adminId)
    assert.equal((await activate(invitation)).status, 400)
    assert.equal((await call(`/students/${id}/invitation`, 'POST', { revision: student(id).revision })).status, 409)
    repo.setStudentStatus(id, student(id).revision, 'activo', adminId)
    invitation = await invite(id)
    const accounts = studentAccounts(app.db)
    const inFlight = accounts.activate(token(invitation), testPassword)
    accounts.invite(id, student(id).revision, adminId)
    await assert.rejects(inFlight, /enlace no es válido/)
  })
  await t.test('suspender revoca la sesión y reactivar exige volver a entrar', async () => {
    assert.equal((await call(`/students/${alice}`, 'PATCH', { revision: student(alice).revision, status: 'suspendido' })).status, 200)
    assert.equal((await call('/student/me', 'GET', undefined, 'student')).status, 401)
    assert.equal((await call('/student/login', 'POST', { email: 'alice@example.test', password: testPassword }, 'anonymous')).status, 401)
    assert.equal((await call(`/students/${alice}`, 'PATCH', { revision: student(alice).revision, status: 'activo' })).status, 200)
    assert.equal((await call('/student/me', 'GET', undefined, 'student')).status, 401)
    const response = await call('/student/login', 'POST', { email: 'alice@example.test', password: testPassword }, 'anonymous')
    assert.equal(response.status, 200); studentCookie = extractCookie(response)
  })
  await t.test('devolver a pendientes bloquea el acceso, conserva cuenta y no revive sesiones', async () => {
    repo.decide(alice, 2, 'undo', adminId)
    assert.equal((await call('/student/me', 'GET', undefined, 'student')).status, 401)
    assert.ok(app.db.prepare('SELECT request_id FROM student_accounts WHERE request_id = ?').get(Number(alice.slice(4))))
    repo.decide(alice, 3, 'approve', adminId)
    assert.equal((await call('/student/me', 'GET', undefined, 'student')).status, 401)
    const response = await call('/student/login', 'POST', { email: 'alice@example.test', password: testPassword }, 'anonymous')
    assert.equal(response.status, 200); studentCookie = extractCookie(response)
  })
  await t.test('cuentas y sesiones conservan permisos tras reiniciar; logout es independiente', async () => {
    await close(); app = createApplication(path); repo = accessRepository(app.db); base = await listen()
    assert.equal((await call('/student/me', 'GET', undefined, 'student')).status, 200)
    assert.equal((await call('/student/logout', 'POST', {}, 'student')).status, 200)
    assert.equal((await call('/student/me', 'GET', undefined, 'student')).status, 401)
    assert.equal((await call('/requests')).status, 200)
  })
})

test('la migración 2 preserva una base de la versión 1', () => {
  const db = new DatabaseSync(':memory:')
  // Base v1 mínima: no se borran ni recrean expedientes al añadir cuentas.
  db.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    INSERT INTO migrations VALUES (1, '2026-11-11');
    CREATE TABLE admin_users (id INTEGER PRIMARY KEY);
    CREATE TABLE requests (id INTEGER PRIMARY KEY, payload TEXT NOT NULL);
    INSERT INTO requests VALUES (1, 'expediente-de-prueba');`)
  migrateDatabase(db)
  assert.equal(db.prepare('SELECT payload FROM requests WHERE id = 1').get()!.payload, 'expediente-de-prueba')
  assert.equal(db.prepare('SELECT version FROM migrations WHERE version = 2').get()!.version, 2)
  assert.equal(db.prepare('SELECT count(*) AS n FROM student_accounts').get()!.n, 0)
  migrateDatabase(db)
  assert.equal(db.prepare('SELECT count(*) AS n FROM migrations WHERE version = 2').get()!.n, 1)
  db.close()
})

test('las contraseñas administrativas anteriores siguen siendo válidas', async () => {
  const salt = '1'.repeat(32)
  const key = await new Promise<Buffer>((resolve, reject) => scrypt(testPassword, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)))
  assert.equal(await verifyPassword(testPassword, `scrypt:${salt}:${key.toString('hex')}`), true)
  assert.equal(await verifyPassword('incorrecta', `scrypt:${salt}:${key.toString('hex')}`), false)
})
