import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { validateSubmission } from '../validation.ts'
import { studentAccounts } from '../student-accounts.ts'
import type { OwnPost, PublishedPost, ReviewPost } from '../contracts.ts'

const password = 'Frase ficticia de publicaciones 2026'
const baseProfile = {
  firstName: 'Alumna', lastName: 'Prueba', birthDate: '2000-01-01', filledBy: 'alumno',
  email: 'alumna@example.test', program: 'Business English', group: 'Mar y jue · 19:30',
  displayName: 'Alumna P.', avatarColor: '#1f56d6', visibility: 'privado', message: '',
  guardianConsent: false, acceptRules: true, acceptPrivacy: true,
}
const draft = { title: 'Mi avance de inglés', body: 'Pude mantener una conversación de práctica con mi grupo.', category: 'achievement' }

test('Publicaciones: revisión, privacidad, retirada y persistencia', async (t) => {
  const root = resolve('.local/tests'); await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'publications-'))
  const path = join(directory, 'test.sqlite')
  let app = createApplication(path), access = accessRepository(app.db)
  const listen = async () => {
    app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening')
    const address = app.server.address(); assert.ok(address && typeof address === 'object')
    return `http://127.0.0.1:${address.port}`
  }
  const close = () => new Promise<void>((resolve, reject) => app.server.close((error) => error ? reject(error) : resolve()))
  let base = await listen()
  t.after(async () => {
    if (app.server.listening) await close()
    assert.equal(dirname(directory), root); assert.ok(directory.startsWith(join(root, 'publications-')))
    await rm(directory, { recursive: true })
  })
  const encoded = await hashPassword(password)
  const adminId = Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(encoded).lastInsertRowid)
  const enroll = (email: string, overrides: Record<string, unknown> = {}) => {
    const receipt = access.submit(validateSubmission({ ...baseProfile, email, ...overrides }), randomUUID())
    access.decide(receipt.id, 1, 'approve', adminId)
    app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)), encoded, new Date().toISOString())
    return receipt.id
  }
  const alice = enroll('alice@example.test')
  enroll('bob@example.test', { firstName: 'Compañero', displayName: 'Compañero P.' })
  enroll('carol@example.test', { group: 'Viernes · 18:00' })
  const otherProgram = enroll('dan@example.test')
  const otherPayload = { ...baseProfile, email: 'dan@example.test', program: 'Inglés general A2' }
  app.db.prepare('UPDATE requests SET payload = ? WHERE id = ?').run(JSON.stringify(otherPayload), Number(otherProgram.slice(4)))
  const unassigned = enroll('unassigned@example.test')
  app.db.prepare('UPDATE requests SET payload = ? WHERE id = ?').run(JSON.stringify({ ...baseProfile, email: 'unassigned@example.test', group: 'Por asignar' }), Number(unassigned.slice(4)))
  const cookies: Record<string, string> = { anonymous: '' }
  const call = (route: string, method = 'GET', data?: unknown, actor = 'alice', headers: Record<string, string> = {}) => fetch(`${base}/api/local${route}`, {
    method, headers: { Origin: base, Cookie: cookies[actor] ?? '', ...headers, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) }, body: data === undefined ? undefined : JSON.stringify(data),
  })
  for (const name of ['admin', 'alice', 'bob', 'carol', 'dan', 'unassigned']) {
    const response = await call(name === 'admin' ? '/auth/login' : '/student/login', 'POST', { email: `${name}@example.test`, password }, 'anonymous')
    assert.equal(response.status, 200); cookies[name] = response.headers.getSetCookie().at(-1)!.split(';')[0]!
  }
  const create = (data: unknown = draft, key = randomUUID(), actor = 'alice') => call('/student/posts', 'POST', data, actor, { 'Idempotency-Key': key })
  const lists = async (actor = 'alice') => (await (await call('/student/posts', 'GET', undefined, actor)).json()) as { posts: PublishedPost[]; mine: OwnPost[] }
  const reviews = async () => (await (await call('/posts', 'GET', undefined, 'admin')).json()) as { posts: ReviewPost[] }
  const decide = (post: OwnPost, decision: string, extra: Record<string, unknown> = {}) => call(`/posts/${post.id}/${decision}`, 'POST', { revision: post.revision, ...extra }, 'admin')
  const latest = async (id: string) => (await reviews()).posts.find((post) => post.id === id)!
  let post: OwnPost

  await t.test('sin sesión no se consulta ni se escribe; el alumno no modera', async () => {
    assert.equal((await call('/student/posts', 'GET', undefined, 'anonymous')).status, 401)
    assert.equal((await create(draft, randomUUID(), 'anonymous')).status, 401)
    assert.equal((await call('/posts')).status, 401)
    assert.equal((await call('/posts/PUB-0001/approve', 'POST', { revision: 1, confirmed: true })).status, 401)
    assert.equal((await call('/student/posts', 'GET', undefined, 'admin')).status, 401)
  })
  await t.test('valida longitudes, tipo, campos adicionales, origen y grupo asignado', async () => {
    for (const invalid of [{ title: 'abc' }, { body: 'corto' }, { category: 'announcement' }, { category: 'toString' }, { title: 'a'.repeat(101) }, { body: 'a'.repeat(1201) }, { body: 'texto\u0000inválido' }, { status: 'publicada' }, { authorId: 2 }, { group: 'otro' }, { photos: [] }]) assert.equal((await create({ ...draft, ...invalid })).status, 400)
    assert.equal((await call('/student/posts', 'POST', draft)).status, 400)
    assert.equal((await call('/student/posts', 'POST', draft, 'alice', { Origin: 'https://otro.example', 'Idempotency-Key': randomUUID() })).status, 403)
    assert.equal((await create(draft, randomUUID(), 'unassigned')).status, 409)
    assert.deepEqual((await lists('unassigned')).posts, [])
  })
  await t.test('envía a revisión sin duplicar al reintentar y separa claves por autor', async () => {
    const key = randomUUID()
    let response = await create(draft, key); assert.equal(response.status, 201)
    post = (await response.json() as { post: OwnPost }).post
    assert.equal(post.status, 'pendiente'); assert.equal(post.publishedAt, null)
    response = await create(draft, key); assert.equal(response.status, 201)
    assert.equal((await response.json() as { post: OwnPost }).post.id, post.id)
    assert.equal((await create({ ...draft, title: 'Otro contenido' }, key)).status, 409)
    assert.equal((await create(draft, key, 'bob')).status, 201)
    assert.equal((await lists()).mine.length, 1)
    assert.equal((await lists('bob')).mine.length, 1)
    assert.deepEqual((await lists()).posts, [])
    assert.ok((await reviews()).posts.some((p) => p.id === post.id && p.studentId === alice))
  })
  await t.test('publicar exige revisión expresa y solo muestra datos públicos al mismo grupo/programa', async () => {
    assert.equal((await decide(post, 'approve')).status, 400)
    assert.equal((await decide(post, 'approve', { confirmed: true })).status, 200)
    assert.equal((await decide(post, 'reject', { reason: 'Un motivo ficticio' })).status, 409)
    const feed = (await lists('bob')).posts
    assert.equal(feed.length, 1); assert.equal(feed[0]!.id, post.id)
    assert.deepEqual(Object.keys(feed[0]!).sort(), ['author', 'body', 'category', 'createdAt', 'id', 'publishedAt', 'title'])
    assert.deepEqual(Object.keys(feed[0]!.author).sort(), ['avatarColor', 'displayName'])
    assert.ok(!JSON.stringify(feed).includes('@')); assert.ok(!JSON.stringify(feed).includes('studentId'))
    assert.deepEqual((await lists('carol')).posts, [])
    assert.deepEqual((await lists('dan')).posts, [])
    assert.ok(!(await lists('bob')).mine.some((p) => p.id === post.id))
  })
  await t.test('devolver a revisión la oculta y rechazar requiere un motivo privado para el autor', async () => {
    assert.equal((await decide(await latest(post.id), 'undo')).status, 200)
    assert.deepEqual((await lists('bob')).posts, [])
    const pending = await latest(post.id)
    assert.equal((await decide(pending, 'reject')).status, 400)
    assert.equal((await decide(pending, 'reject', { reason: 'Revisa los datos personales de muestra.' })).status, 200)
    const own = (await lists()).mine.find((p) => p.id === post.id)!
    assert.equal(own.status, 'rechazada'); assert.equal(own.reason, 'Revisa los datos personales de muestra.')
    assert.ok(!JSON.stringify(await lists('bob')).includes(own.reason!))
    assert.equal((await decide(await latest(post.id), 'undo')).status, 200)
    assert.equal((await decide(await latest(post.id), 'approve', { confirmed: true })).status, 200)
  })
  await t.test('solo el autor retira; el retiro prevalece sobre revisiones obsoletas y no se revierte', async () => {
    const current = await latest(post.id)
    assert.equal((await call(`/student/posts/${post.id}/withdraw`, 'POST', { revision: current.revision, authorId: 2 })).status, 400)
    assert.equal((await call(`/student/posts/${post.id}/withdraw`, 'POST', { revision: current.revision }, 'bob')).status, 404)
    const response = await create({ ...draft, title: 'Publicación para retirar' }); assert.equal(response.status, 201)
    const temporary = (await response.json() as { post: OwnPost }).post
    assert.equal((await call(`/student/posts/${temporary.id}/withdraw`, 'POST', { revision: temporary.revision })).status, 200)
    assert.equal((await decide(temporary, 'approve', { confirmed: true })).status, 409)
    assert.equal((await decide(await latest(temporary.id), 'undo')).status, 409)
    assert.equal((await latest(temporary.id)).status, 'retirada')
    assert.equal((await call(`/student/posts/${post.id}/withdraw`, 'POST', { revision: current.revision - 1 })).status, 409)
  })
  await t.test('decisiones simultáneas solo permiten una revisión y el retiro no desaparece del historial', async () => {
    const created = await create({ ...draft, title: 'Revisión simultánea' }, randomUUID(), 'bob')
    assert.equal(created.status, 201)
    const own = (await created.json() as { post: OwnPost }).post
    const results = await Promise.all([decide(own, 'approve', { confirmed: true }), decide(own, 'reject', { reason: 'Motivo ficticio de revisión' })])
    assert.deepEqual(results.map((response) => response.status).sort(), [200, 409])
    const current = await latest(own.id)
    assert.equal((await call(`/student/posts/${own.id}/withdraw`, 'POST', { revision: current.revision }, 'bob')).status, 200)
    assert.equal((await latest(own.id)).status, 'retirada')
  })
  await t.test('la suspensión oculta publicaciones y cancela lectura y escritura; no revive sesiones', async () => {
    access.setStudentStatus(alice, 1, 'suspendido', adminId)
    assert.equal((await call('/student/posts')).status, 401)
    assert.equal((await create()).status, 401)
    assert.deepEqual((await lists('bob')).posts, [])
    const unpublished = (await reviews()).posts.find((p) => p.studentId === alice && p.status === 'publicada')!
    assert.equal(unpublished.authorActive, false)
    assert.equal((await decide(unpublished, 'undo')).status, 200)
    assert.equal((await decide(await latest(post.id), 'approve', { confirmed: true })).status, 409)
    access.setStudentStatus(alice, 2, 'activo', adminId)
    assert.equal((await call('/student/posts')).status, 401)
    const login = await call('/student/login', 'POST', { email: 'alice@example.test', password }, 'anonymous')
    assert.equal(login.status, 200); cookies.alice = login.headers.getSetCookie().at(-1)!.split(';')[0]!
    assert.equal((await decide(await latest(post.id), 'approve', { confirmed: true })).status, 200)
    const withdrawn = await latest(post.id)
    assert.equal((await call(`/student/posts/${post.id}/withdraw`, 'POST', { revision: withdrawn.revision })).status, 200)
    assert.deepEqual((await lists('bob')).posts, [])
  })
  await t.test('las cuentas Google aprobadas usan los mismos permisos de publicaciones', async () => {
    const google = enroll('google@example.test')
    const key = Number(google.slice(4))
    app.db.prepare('DELETE FROM student_accounts WHERE request_id = ?').run(key)
    app.db.prepare('INSERT INTO google_identities VALUES (?,?,?,?)').run('subject-publications', 'google@example.test', key, new Date().toISOString())
    const account = studentAccounts(app.db)
    cookies.google = account.start(account.forGoogle('subject-publications')!).split(';')[0]!
    const response = await create({ ...draft, title: 'Avance con cuenta Google' }, randomUUID(), 'google')
    assert.equal(response.status, 201)
    const own = (await response.json() as { post: OwnPost }).post
    assert.equal((await decide(own, 'approve', { confirmed: true })).status, 200)
    assert.equal((await lists('bob')).posts.length, 1)
  })
  await t.test('reiniciar conserva publicaciones, revisiones, motivos y auditoría sin borrar cuentas', async () => {
    const before = await reviews()
    const accounts = app.db.prepare('SELECT count(*) AS n FROM student_accounts').get()!.n
    assert.ok(Number(app.db.prepare('SELECT count(*) AS n FROM publication_audit').get()!.n) > 5)
    await close(); app = createApplication(path); access = accessRepository(app.db); base = await listen()
    assert.deepEqual(await reviews(), before)
    assert.equal(app.db.prepare('SELECT count(*) AS n FROM student_accounts').get()!.n, accounts)
    assert.equal(app.db.prepare('SELECT count(*) AS n FROM migrations WHERE version = 4').get()!.n, 1)
    assert.equal((await lists('bob')).posts.length, 1)
    assert.ok((await lists()).mine.some((p) => p.status === 'retirada'))
  })
})
