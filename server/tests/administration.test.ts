import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { administration } from '../administration.ts'
import { validateSubmission } from '../validation.ts'
import type { CatalogGroup, CommunityControls, OwnPost, PublicCatalog, StudentUser } from '../contracts.ts'

const password = 'Frase ficticia de grupos para pruebas 2026'
const profile = { firstName: 'Alumno', lastName: 'Prueba', birthDate: '2000-01-01', filledBy: 'alumno', email: 'alumno@example.test', program: 'Business English', group: 'Mar y jue · 19:30', displayName: 'Alumno P.', avatarColor: '#1f56d6', visibility: 'privado', message: '', guardianConsent: false, acceptRules: true, acceptPrivacy: true }

test('Administración: catálogo, pausas y asignación sin mezclar audiencias', async t => {
  const root = resolve('.local/tests'); await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'administration-')), path = join(directory, 'test.sqlite')
  let app = createApplication(path), repo = accessRepository(app.db)
  const listen = async () => { app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening'); const address = app.server.address(); assert.ok(address && typeof address === 'object'); return `http://127.0.0.1:${address.port}` }
  const close = () => new Promise<void>((resolve, reject) => app.server.close(error => error ? reject(error) : resolve()))
  let base = await listen()
  t.after(async () => { if (app.server.listening) await close(); assert.equal(dirname(directory), root); assert.ok(directory.startsWith(join(root, 'administration-'))); await rm(directory, { recursive: true }) })
  const hash = await hashPassword(password)
  const admin = Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(hash).lastInsertRowid)
  const enroll = (email: string) => {
    const receipt = repo.submit(validateSubmission({ ...profile, email }), randomUUID()); repo.decide(receipt.id, 1, 'approve', admin)
    app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)), hash, new Date().toISOString()); return receipt.id
  }
  const alice = enroll('alice@example.test'); enroll('bob@example.test')
  const cookies: Record<string, string> = { anonymous: '' }
  const call = (path: string, method = 'GET', data?: unknown, actor = 'admin', key?: string) => fetch(base + '/api/local' + path, { method, headers: { Origin: base, Cookie: cookies[actor] ?? '', ...(data === undefined ? {} : { 'Content-Type': 'application/json' }), ...(key ? { 'Idempotency-Key': key } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) })
  const login = async (name: string) => { const r = await call(name === 'admin' ? '/auth/login' : '/student/login', 'POST', { email: `${name}@example.test`, password }, 'anonymous'); assert.equal(r.status, 200); cookies[name] = r.headers.getSetCookie().at(-1)!.split(';')[0]!; return (await r.json() as { user: StudentUser }).user }
  await login('admin'); const originalUser = await login('alice'); await login('bob')
  const config = async () => await (await call('/configuration')).json() as { groups: CatalogGroup[]; settings: CommunityControls }
  const publicCatalog = async () => await (await call('/catalog', 'GET', undefined, 'anonymous')).json() as PublicCatalog
  const currentStudent = () => repo.students().find(student => student.id === alice)!
  let newGroup: CatalogGroup, post: OwnPost

  await t.test('el catálogo público es mínimo; solo administración escribe', async () => {
    for (const actor of ['anonymous', 'alice']) {
      assert.equal((await call('/configuration', 'GET', undefined, actor)).status, 401)
      assert.equal((await call('/groups', 'POST', { program: 'Nuevo', name: 'Sábado' }, actor)).status, 401)
      assert.equal((await call('/configuration', 'PATCH', { revision: 1, registrationOpen: false, submissionsOpen: false }, actor)).status, 401)
      assert.equal((await call(`/students/${alice}/assignment`, 'PATCH', { revision: 1, program: 'Nuevo', group: 'Sábado', confirmed: true }, actor)).status, 401)
    }
    const catalog = await publicCatalog()
    assert.ok(catalog.groups.length > 0); assert.deepEqual(Object.keys(catalog.groups[0]!).sort(), ['id', 'name', 'program'])
    assert.ok(!JSON.stringify(catalog).includes('@')); assert.ok(!('revision' in catalog.settings))
  })
  await t.test('crear programa/grupo sirve al registro; archivo no borra y evita nuevas selecciones', async () => {
    assert.equal((await call('/groups', 'POST', { program: 'Programa de prueba', name: 'Grupo nuevo', active: true })).status, 400)
    const r = await call('/groups', 'POST', { program: 'Programa de prueba', name: 'Grupo nuevo' }); assert.equal(r.status, 201)
    const { id } = await r.json() as { id: number }; newGroup = (await config()).groups.find(group => group.id === id)!
    assert.equal((await call('/groups', 'POST', { program: newGroup.program, name: newGroup.name })).status, 409)
    const request = { ...profile, email: 'new-group@example.test', program: newGroup.program, group: newGroup.name }
    assert.equal((await call('/requests', 'POST', request, 'anonymous', randomUUID())).status, 201)
    assert.equal((await call(`/groups/${id}`, 'PATCH', { active: false, revision: newGroup.revision })).status, 200)
    assert.ok(!(await publicCatalog()).groups.some(group => group.id === id))
    assert.equal((await call('/requests', 'POST', { ...request, email: 'archived@example.test' }, 'anonymous', randomUUID())).status, 400)
    assert.equal((await call(`/groups/${id}`, 'PATCH', { active: true, revision: newGroup.revision })).status, 409)
    newGroup = (await config()).groups.find(group => group.id === id)!
    assert.equal((await call(`/groups/${id}`, 'PATCH', { active: true, revision: newGroup.revision })).status, 200)
    newGroup = (await config()).groups.find(group => group.id === id)!
  })
  await t.test('pausar solicitudes se aplica en servidor y no permite alterar reglas protegidas', async () => {
    const before = (await config()).settings
    assert.equal((await call('/configuration', 'PATCH', { ...before, requireGuardianConsent: false })).status, 400)
    assert.equal((await call('/configuration', 'PATCH', { ...before, registrationOpen: false })).status, 200)
    assert.equal((await call('/requests', 'POST', { ...profile, email: 'paused@example.test' }, 'anonymous', randomUUID())).status, 409)
    assert.equal((await call('/configuration', 'PATCH', before)).status, 409)
    const current = (await config()).settings
    assert.equal((await call('/configuration', 'PATCH', { ...current, registrationOpen: true })).status, 200)
  })
  await t.test('pausar envíos conserva lectura, retiro y reintentos ya guardados', async () => {
    const draft = { title: 'Historia del grupo anterior', body: 'Una experiencia ficticia que conserva su audiencia original.', category: 'experience' }, key = randomUUID()
    const r = await call('/student/posts', 'POST', draft, 'alice', key); assert.equal(r.status, 201); post = (await r.json() as { post: OwnPost }).post
    const before = (await config()).settings
    assert.equal((await call('/configuration', 'PATCH', { ...before, submissionsOpen: false })).status, 200)
    assert.equal((await call('/student/posts', 'POST', draft, 'alice', key)).status, 201)
    assert.equal((await call('/student/posts', 'POST', draft, 'alice', randomUUID())).status, 409)
    assert.equal((await call('/student/posts', 'GET', undefined, 'alice')).status, 200)
    const current = (await config()).settings
    assert.equal((await call('/configuration', 'PATCH', { ...current, submissionsOpen: true })).status, 200)
    assert.equal((await call(`/posts/${post.id}/approve`, 'POST', { revision: post.revision, confirmed: true })).status, 200)
  })
  await t.test('reasignación exige confirmación/revisión/catálogo; revoca acceso y oculta historias antiguas', async () => {
    const before = currentStudent(), assignment = { revision: before.revision, program: newGroup.program, group: newGroup.name, confirmed: true }
    assert.equal((await call(`/students/${alice}/assignment`, 'PATCH', { ...assignment, confirmed: false })).status, 400)
    assert.equal((await call(`/students/${alice}/assignment`, 'PATCH', { ...assignment, program: 'Inventado' })).status, 400)
    assert.equal((await call(`/students/${alice}/assignment`, 'PATCH', { ...assignment, revision: before.revision + 1 })).status, 409)
    assert.equal((await call(`/students/${alice}/assignment`, 'PATCH', assignment)).status, 200)
    assert.equal((await call('/student/me', 'GET', undefined, 'alice')).status, 401)
    const changed = await login('alice'); assert.equal(changed.publicId, originalUser.publicId); assert.equal(changed.group, newGroup.name)
    const oldFeed = await (await call('/student/posts', 'GET', undefined, 'bob')).json() as { posts: OwnPost[] }
    assert.ok(!oldFeed.posts.some(item => item.id === post.id))
    const ownFeed = await (await call('/student/posts', 'GET', undefined, 'alice')).json() as { posts: OwnPost[]; mine: OwnPost[] }
    assert.ok(!ownFeed.posts.some(item => item.id === post.id)); assert.equal(ownFeed.mine.find(item => item.id === post.id)!.status, 'pendiente')
    const reviewed = app.db.prepare('SELECT program,group_name FROM publications WHERE id = ?').get(Number(post.id.slice(4)))!
    assert.equal(reviewed.program, profile.program); assert.equal(reviewed.group_name, profile.group)
    assert.equal((await call(`/posts/${post.id}/approve`, 'POST', { revision: ownFeed.mine.find(item => item.id === post.id)!.revision, confirmed: true })).status, 409)
  })
  await t.test('volver de grupo no republica; el historial permanece y hace falta otra revisión', async () => {
    assert.equal((await call(`/students/${alice}/assignment`, 'PATCH', { revision: currentStudent().revision, program: profile.program, group: profile.group, confirmed: true })).status, 200)
    await login('alice')
    const feed = await (await call('/student/posts', 'GET', undefined, 'alice')).json() as { posts: OwnPost[]; mine: OwnPost[] }
    assert.equal(feed.posts.length, 0); const pending = feed.mine.find(item => item.id === post.id)!; assert.equal(pending.status, 'pendiente')
    assert.equal((await call(`/posts/${post.id}/approve`, 'POST', { revision: pending.revision, confirmed: true })).status, 200)
    const settings = (await config()).settings
    assert.equal((await call('/configuration', 'PATCH', { ...settings, submissionsOpen: false })).status, 200)
    assert.equal((await call(`/student/posts/${post.id}/withdraw`, 'POST', { revision: pending.revision + 1 }, 'alice')).status, 200)
  })
  await t.test('catálogo, controles, auditoría y asignación sobreviven al reinicio sin perder cuentas', async () => {
    const before = await config(), counts = app.db.prepare('SELECT count(*) AS n FROM student_accounts').get()!.n
    assert.ok(Number(app.db.prepare('SELECT count(*) AS n FROM administration_audit').get()!.n) >= 8)
    await close(); app = createApplication(path); repo = accessRepository(app.db); base = await listen()
    assert.deepEqual(await config(), before); assert.equal(currentStudent().group, profile.group)
    assert.equal(app.db.prepare('SELECT count(*) AS n FROM student_accounts').get()!.n, counts)
    assert.equal(app.db.prepare('SELECT count(*) AS n FROM migrations WHERE version = 7').get()!.n, 1)
    assert.equal(administration(app.db).settings().submissionsOpen, false)
  })
})
