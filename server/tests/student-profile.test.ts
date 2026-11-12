import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { request as httpRequest } from 'node:http'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { hashPassword } from '../auth.ts'
import { validateSubmission } from '../validation.ts'
import type { StudentProfile, Submission, StudentUser, PublishedPost, OwnPost } from '../contracts.ts'

test('Perfil propio: privacidad, concurrencia y persistencia', async t => {
  const root = resolve('.local/tests'); await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'student-profile-')), path = join(directory, 'fixture.sqlite')
  let app = createApplication(path)
  const listen = async () => { app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening'); const a = app.server.address(); assert.ok(a && typeof a === 'object'); return `http://127.0.0.1:${a.port}` }
  const close = () => new Promise<void>((resolve, reject) => app.server.close(error => error ? reject(error) : resolve()))
  let base = await listen()
  t.after(async () => { if (app.server.listening) await close(); assert.equal(dirname(directory), root); assert.ok(directory.startsWith(join(root, 'student-profile-'))); await rm(directory, { recursive: true }) })
  const password = 'Frase ficticia de perfil de alumno 2026', encoded = await hashPassword(password)
  const admin = Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Prueba',?,'admin')").run(encoded).lastInsertRowid)
  const repo = accessRepository(app.db)
  const original: Submission = { firstName: 'Alumno', lastName: 'Ficticio', birthDate: '2000-01-01', email: 'adult@example.test', filledBy: 'alumno', displayName: 'Alumno F.', avatarColor: '#1f56d6', visibility: 'privado', program: 'Business English', group: 'Mar y jue · 19:30', message: '', guardianConsent: false, acceptRules: true, acceptPrivacy: true }
  const ids: Record<string, number> = {}
  for (const who of ['adult', 'peer', 'minor', 'google']) {
    const receipt = repo.submit(validateSubmission({ ...original, email: `${who}@example.test`, ...(who === 'minor' ? { birthDate: `${new Date().getFullYear() - 15}-01-01`, guardianConsent: true, guardian: { name: 'Tutor Ficticio', relationship: 'Tutor', contact: 'tutor@example.test' } } : {}) }), randomUUID())
    if (who === 'minor') repo.decide(receipt.id, 1, 'consent', admin, 'Referencia ficticia para prueba')
    repo.decide(receipt.id, who === 'minor' ? 2 : 1, 'approve', admin)
    ids[who] = Number(receipt.id.slice(4))
    if (who === 'google') app.db.prepare('INSERT INTO google_identities VALUES (?,?,?,?)').run('subject-fixture', `${who}@example.test`, ids[who]!, new Date().toISOString())
    else app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(ids[who]!, encoded, new Date().toISOString())
  }
  const cookies: Record<string, string> = {}
  const call = (path: string, method = 'GET', data?: unknown, actor = 'adult', headers: Record<string, string> = {}) => fetch(base + '/api/local' + path, { method, headers: { Origin: base, Cookie: cookies[actor] ?? '', ...(data === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers }, body: data === undefined ? undefined : JSON.stringify(data) })
  for (const who of ['adult', 'peer', 'minor', 'admin']) {
    const r = await call(who === 'admin' ? '/auth/login' : '/student/login', 'POST', { email: `${who}@example.test`, password }, 'anonymous'); assert.equal(r.status, 200); cookies[who] = r.headers.getSetCookie().at(-1)!.split(';')[0]!
  }
  // Misma sesión de alumno emitida por el recorrido Google; no se inventa acceso público.
  const { studentAccounts } = await import('../student-accounts.ts')
  const accounts = studentAccounts(app.db)
  cookies.google = accounts.start(accounts.forGoogle('subject-fixture')!).split(';')[0]!
  const profile = async (who = 'adult') => (await (await call('/student/profile', 'GET', undefined, who)).json() as { profile: StudentProfile }).profile
  const draft = async (who = 'adult') => { const p = await profile(who); return { revision: p.revision, displayName: p.displayName, avatarColor: p.avatarColor } }
  const payload = (who = 'adult') => JSON.parse(String(app.db.prepare('SELECT payload FROM requests WHERE id=?').get(ids[who]!)!.payload)) as Submission

  await t.test('solo sesión de alumno; lectura mínima, origen, formato y tamaño', async () => {
    for (const who of ['anonymous', 'admin']) for (const method of ['GET', 'PATCH']) assert.equal((await call('/student/profile', method, method === 'PATCH' ? {} : undefined, who)).status, 401)
    assert.deepEqual(Object.keys(await profile()).sort(), ['avatarColor', 'displayName', 'nameOptions', 'revision'])
    assert.equal((await profile()).nameOptions, null)
    const value = await draft()
    assert.equal((await call('/student/profile', 'PATCH', value, 'adult', { Origin: 'https://other.example' })).status, 403)
    assert.equal((await call('/student/profile', 'PATCH', value, 'adult', { 'Content-Type': 'text/plain' })).status, 415)
    assert.equal((await call('/student/profile', 'PATCH', { ...value, displayName: 'x'.repeat(17000) })).status, 413)
  })
  await t.test('no permite elegir expediente ni cambiar datos protegidos; valida texto y color', async () => {
    const before = payload(), value = await draft()
    for (const field of ['id', 'publicId', 'email', 'birthDate', 'guardian', 'visibility', 'program', 'group', 'role', 'nameOptions']) assert.equal((await call('/student/profile', 'PATCH', { ...value, [field]: 'modificar' })).status, 400)
    for (const invalid of [{ displayName: '' }, { displayName: 'x'.repeat(142) }, { displayName: 'Dos\nlíneas' }, { displayName: 'Invisible\u202ename' }, { displayName: null }, { avatarColor: 'url(x)' }, { avatarColor: '#abcd12;' }, { revision: 0 }]) assert.equal((await call('/student/profile', 'PATCH', { ...value, ...invalid })).status, 400)
    assert.deepEqual(payload(), before)
  })
  await t.test('menores conservan abreviaturas sin recibir nacimiento/tutor ni cambiar visibilidad', async () => {
    const before = payload('minor'), p = await profile('minor')
    assert.deepEqual(p.nameOptions, ['Alumno F.', 'A. F.'])
    assert.equal((await call('/student/profile', 'PATCH', { ...(await draft('minor')), displayName: 'Alumno Ficticio' }, 'minor')).status, 400)
    assert.equal((await call('/student/profile', 'PATCH', { ...(await draft('minor')), displayName: 'A. F.' }, 'minor')).status, 200)
    assert.deepEqual(payload('minor'), { ...before, displayName: 'A. F.' })
  })
  await t.test('actualiza únicamente datos visibles, sesiones/directorio/autor; reintento no duplica auditoría', async () => {
    const before = payload(), peer = payload('peer'), user = (await (await call('/student/me')).json() as { user: StudentUser }).user
    const postResponse = await call('/student/posts', 'POST', { title: 'Historia ficticia de perfil', body: 'Contenido ficticio para comprobar identidad pública estable.', category: 'experience' }, 'adult', { 'Idempotency-Key': randomUUID() })
    assert.equal(postResponse.status, 201)
    const post = (await postResponse.json() as { post: OwnPost }).post
    assert.equal((await call(`/posts/${post.id}/approve`, 'POST', { revision: post.revision, confirmed: true }, 'admin')).status, 200)
    const value = { ...(await draft()), displayName: 'Nuevo alias ficticio', avatarColor: '#5B3AA8' }
    assert.equal((await call('/student/profile', 'PATCH', value)).status, 200)
    assert.equal((await call('/student/profile', 'PATCH', value)).status, 200)
    assert.deepEqual(payload(), { ...before, displayName: value.displayName, avatarColor: '#5b3aa8' }); assert.deepEqual(payload('peer'), peer)
    const current = (await (await call('/student/me')).json() as { user: StudentUser }).user
    assert.equal(current.publicId, user.publicId); assert.equal(current.displayName, value.displayName); assert.equal(current.name, user.name)
    const feed = await (await call('/student/posts', 'GET', undefined, 'peer')).json() as { posts: PublishedPost[] }
    assert.deepEqual(feed.posts.find(p => p.id === post.id)!.author, { id: user.publicId, displayName: value.displayName, avatarColor: '#5b3aa8' })
    const group = JSON.stringify(await (await call('/student/group', 'GET', undefined, 'peer')).json()); assert.ok(group.includes(value.displayName)); assert.ok(!group.includes('birthDate')); assert.ok(!group.includes('@'))
    assert.equal(app.db.prepare("SELECT count(*) AS n FROM audit_log WHERE request_id=? AND action='student.profile_updated'").get(ids.adult!)!.n, 1)
  })
  await t.test('no sobrescribe otro cambio; acciones administrativas ven revisión actualizada', async () => {
    const old = await draft(), student = repo.students().find(s => Number(s.id.slice(4)) === ids.adult)!
    assert.equal((await call('/student/profile', 'PATCH', { ...old, displayName: 'Alias concurrente A' })).status, 200)
    assert.equal((await call('/student/profile', 'PATCH', { ...old, displayName: 'Alias concurrente B' })).status, 409)
    assert.equal((await call(`/students/${student.id}`, 'PATCH', { revision: student.revision, status: 'suspendido' }, 'admin')).status, 409)
    assert.equal(payload().displayName, 'Alias concurrente A')
  })
  await t.test('funciona para Google sin exponer identidad verificada', async () => {
    const value = { ...(await draft('google')), displayName: 'Alias Google ficticio' }
    assert.equal((await call('/student/profile', 'PATCH', value, 'google')).status, 200)
    assert.equal(accounts.forGoogle('subject-fixture')!.displayName, value.displayName)
    assert.equal(app.db.prepare('SELECT email FROM google_identities WHERE subject=?').get('subject-fixture')!.email, 'google@example.test')
  })
  await t.test('persiste tras reinicio con UUID, revisión y sin migración', async () => {
    const before = await profile(); await close(); app = createApplication(path); base = await listen()
    assert.deepEqual(await profile(), before); assert.equal(app.db.prepare('SELECT MAX(version) AS n FROM migrations').get()!.n, 9)
  })
  await t.test('caducar sesión durante lectura del cuerpo impide editar', async () => {
    const before = payload(), value = JSON.stringify({ ...(await draft()), displayName: 'No guardar' }), received = once(app.server, 'request')
    let finish!: () => void
    const result = new Promise<number>((resolve, reject) => {
      const pending = httpRequest(new URL('/api/local/student/profile', base), { method: 'PATCH', headers: { Origin: base, Cookie: cookies.adult!, 'Content-Type': 'application/json' } }, response => { response.resume(); response.once('end', () => resolve(response.statusCode!)) })
      pending.once('error', reject); pending.write(value.slice(0, 10)); finish = () => pending.end(value.slice(10))
    })
    await received; app.db.prepare('DELETE FROM student_sessions WHERE request_id=?').run(ids.adult!); finish()
    assert.equal(await result, 401); assert.deepEqual(payload(), before)
  })
  await t.test('límite por alumno sin bloquear perfiles de otros alumnos', async () => {
    const value = await draft('peer')
    for (let i = 0; i < 30; i++) assert.equal((await call('/student/profile', 'PATCH', value, 'peer')).status, 200)
    assert.equal((await call('/student/profile', 'PATCH', value, 'peer')).status, 429)
    assert.equal((await call('/student/profile', 'PATCH', await draft('minor'), 'minor')).status, 200)
  })
})
