import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { notices } from '../notices.ts'
import { hashPassword } from '../auth.ts'
import { studentAccounts } from '../student-accounts.ts'
import { validateSubmission } from '../validation.ts'

test('Recuperación: respuesta uniforme, permisos, enlaces y revocación', async (t) => {
  const app = createApplication(':memory:')
  app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening')
  t.after(() => new Promise<void>((resolve) => app.server.close(() => resolve())))
  const address = app.server.address(); assert.ok(address && typeof address === 'object')
  const base = `http://127.0.0.1:${address.port}`
  const repo = accessRepository(app.db), mail = notices(app.db), accounts = studentAccounts(app.db)
  const password = 'Contraseña ficticia inicial 2026', next = 'Contraseña ficticia renovada 2026'
  const encoded = await hashPassword(password)
  const admin = Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(encoded).lastInsertRowid)
  const receipt = repo.submit(validateSubmission({firstName:'Alumno',lastName:'Prueba',birthDate:'2000-01-01',filledBy:'alumno',email:'recovery@example.test',program:'Business English',group:'Mar y jue · 19:30',displayName:'Alumno P.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}),randomUUID())
  repo.decide(receipt.id,1,'approve',admin)
  const id = Number(receipt.id.slice(4))
  app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(id,encoded,new Date().toISOString())
  const call = (path: string, data: unknown, cookie = '') => fetch(`${base}/api/local${path}`,{method:'POST',headers:{Origin:base,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(data)})
  const known = await call('/recovery/request',{email:'recovery@example.test'}), unknown = await call('/recovery/request',{email:'absent@example.test'})
  assert.equal(known.status,202); assert.deepEqual(await known.json(),await unknown.json())
  assert.equal((await fetch(`${base}/api/local/notices`)).status,401)
  assert.equal((await call('/notices/1/preview',{})).status,401)
  mail.requestRecovery('recovery@example.test')
  const notice = app.db.prepare("SELECT id FROM local_notices WHERE kind='recovery'").get()!
  assert.equal(app.db.prepare("SELECT count(*) AS n FROM local_notices WHERE kind='recovery'").get()!.n,1)
  const token = () => new URLSearchParams(mail.previewRecovery(Number(notice.id),admin).path.split('#')[1]).get('token')!
  const old = token(), current = token()
  await assert.rejects(mail.changePassword(old,next),/enlace/)
  await assert.rejects(mail.changePassword(current,'corta'),/15/)
  const user = await accounts.login('recovery@example.test',password); assert.ok(user)
  const session = accounts.start(user)
  const changed = await call('/recovery/reset',{token:current,password:next,confirm:next},session)
  assert.equal(changed.status,200)
  assert.equal(await accounts.login('recovery@example.test',password),null)
  assert.ok(await accounts.login('recovery@example.test',next))
  assert.equal(app.db.prepare('SELECT count(*) AS n FROM student_sessions').get()!.n,0)
  await assert.rejects(mail.changePassword(current,password),/enlace/)
  let fresh = token()
  app.db.prepare('UPDATE password_resets SET expires_at=0').run()
  await assert.rejects(mail.changePassword(fresh,password),/enlace/)
  fresh = token()
  repo.setStudentStatus(receipt.id,1,'suspendido',admin)
  repo.setStudentStatus(receipt.id,2,'activo',admin)
  await assert.rejects(mail.changePassword(fresh,password),/enlace/)
  fresh = token()
  const pending = mail.changePassword(fresh,password)
  token() // renovar durante el cálculo debe invalidar el enlace anterior
  await assert.rejects(pending,/enlace/)
  fresh = token()
  const race = await Promise.allSettled([mail.changePassword(fresh,password),mail.changePassword(fresh,password)])
  assert.equal(race.filter((r) => r.status==='fulfilled').length,1)
  assert.equal(race.filter((r) => r.status==='rejected').length,1)
  assert.ok(mail.list().some((item) => item.subject==='Contraseña cambiada'))
  assert.ok(!JSON.stringify(mail.list()).includes('#token='))
})
