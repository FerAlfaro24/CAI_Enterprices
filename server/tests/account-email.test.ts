import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { accountEmail, type AccountMail, type AccountMailDelivery } from '../account-email.ts'
import { studentAccounts } from '../student-accounts.ts'
import { notices } from '../notices.ts'
import { validateSubmission } from '../validation.ts'
import { hashPassword } from '../auth.ts'
import { accountEmailContent, validateMailSettings } from '../email-delivery.ts'

async function fixture(deliver?:AccountMailDelivery) {
  const app=createApplication(':memory:')
  const actor=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('mail-admin@example.test','Coordinación',?,'admin')").run(await hashPassword('Frase ficticia para pruebas de correo')).lastInsertRowid)
  const service=accountEmail(app.db,deliver),repo=accessRepository(app.db,service.approved)
  const request=repo.submit(validateSubmission({className:'Inglés',firstName:'Alumno',lastName:'Correo',birthDate:'2000-01-01',email:'mail-student@example.test',displayName:'Alumno C.',avatarColor:'#1f56d6',visibility:'privado',message:'',acceptRules:true,acceptPrivacy:true}),randomUUID())
  return {...app,actor,service,repo,id:request.id,key:Number(request.id.slice(4)),accounts:studentAccounts(app.db),close:()=>{service.stop();app.db.close()}}
}
const token=(mail:AccountMail)=>new URLSearchParams(mail.path.split('#')[1]).get('token')!

test('Correo de cuentas: aprobación, entrega confirmada y activación de un uso',async t=>{
  let release!:()=>void;const captured:AccountMail[]=[],f=await fixture(async mail=>{captured.push(mail);await new Promise<void>(resolve=>{release=resolve})});t.after(f.close)
  f.repo.decide(f.id,1,'approve',f.actor)
  assert.equal(f.service.forStudent(f.id).delivery?.state,'pending')
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM student_invitations').get()!.n,0)
  const pending=f.service.deliverPending();assert.equal(f.service.forStudent(f.id).delivery?.state,'sending')
  await assert.rejects(f.accounts.activate(token(captured[0]!),'abcdefgh'),/enlace/)
  release();await pending
  assert.equal(f.service.forStudent(f.id).delivery?.state,'accepted');assert.equal(captured[0]!.to,'mail-student@example.test')
  assert.ok(!JSON.stringify(f.db.prepare('SELECT * FROM account_emails').all()).includes(token(captured[0]!)))
  await f.accounts.activate(token(captured[0]!),'abcdefgh')
  await assert.rejects(f.accounts.activate(token(captured[0]!),'abcdefgh'),/enlace/)
  assert.ok(await f.accounts.login('mail-student@example.test','abcdefgh'))
  await f.service.deliverPending();assert.equal(captured.length,1)
})

test('Una entrega fallida mantiene aprobación, oculta errores privados y admite reintento controlado',async t=>{
  const captured:AccountMail[]=[];let fail=true
  const f=await fixture(async mail=>{captured.push(mail);if(fail)throw Error('Secreto SMTP y token '+mail.path)});t.after(f.close)
  f.repo.decide(f.id,1,'approve',f.actor);await f.service.deliverPending()
  assert.equal(f.repo.requests()[0]!.status,'aprobada');assert.equal(f.service.forStudent(f.id).delivery?.state,'failed')
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM student_invitations').get()!.n,0)
  assert.ok(!JSON.stringify(f.service.forStudent(f.id)).includes('Secreto'))
  assert.throws(()=>f.service.resend(f.id,1,f.actor),/minuto/)
  f.db.prepare('UPDATE account_emails SET created_at=created_at-61000').run();fail=false
  f.service.resend(f.id,1,f.actor);await f.service.deliverPending()
  await assert.rejects(f.accounts.activate(token(captured[0]!),'abcdefgh'),/enlace/)
  await f.accounts.activate(token(captured[1]!),'abcdefgh')
  f.db.prepare('UPDATE account_emails SET created_at=created_at-61000').run();f.service.resend(f.id,f.repo.students()[0]!.revision,f.actor)
  f.db.prepare('UPDATE account_emails SET created_at=created_at-61000').run()
  assert.throws(()=>f.service.resend(f.id,f.repo.students()[0]!.revision,f.actor),/tres correos/)
})

test('Suspender y reactivar durante el envío no resucita un enlace',async t=>{
  let release!:()=>void;const captured:AccountMail[]=[],f=await fixture(async mail=>{captured.push(mail);await new Promise<void>(resolve=>{release=resolve})});t.after(f.close)
  f.repo.decide(f.id,1,'approve',f.actor);const pending=f.service.deliverPending()
  f.repo.setStudentStatus(f.id,1,'suspendido',f.actor);f.repo.setStudentStatus(f.id,2,'activo',f.actor)
  release();await pending;assert.equal(f.service.forStudent(f.id).delivery?.state,'cancelled')
  await assert.rejects(f.accounts.activate(token(captured[0]!),'abcdefgh'),/enlace/)
})

test('Un enlace manual preparado durante el envío tiene prioridad y no se reemplaza',async t=>{
  let release!:()=>void;const captured:AccountMail[]=[],f=await fixture(async mail=>{captured.push(mail);await new Promise<void>(resolve=>{release=resolve})});t.after(f.close)
  f.repo.decide(f.id,1,'approve',f.actor);const pending=f.service.deliverPending(),manual=f.accounts.invite(f.id,1,f.actor)
  release();await pending;assert.equal(f.service.forStudent(f.id).delivery?.state,'cancelled')
  await assert.rejects(f.accounts.activate(token(captured[0]!),'abcdefgh'),/enlace/)
  await f.accounts.activate(new URLSearchParams(manual.path.split('#')[1]).get('token'),'abcdefgh')
})

test('Recuperación automática: un enlace, cambios privados y revocación de sesión',async t=>{
  const captured:AccountMail[]=[],f=await fixture(async mail=>{captured.push(mail)});t.after(f.close)
  f.repo.decide(f.id,1,'approve',f.actor);await f.service.deliverPending();await f.accounts.activate(token(captured[0]!),'abcdefgh')
  const user=await f.accounts.login('mail-student@example.test','abcdefgh');assert.ok(user);f.accounts.start(user)
  f.service.requestRecovery('ausente@example.test');f.service.requestRecovery('mail-student@example.test');f.service.requestRecovery('mail-student@example.test')
  await f.service.deliverPending();assert.equal(captured.length,2);assert.equal(captured[1]!.kind,'recovery')
  await notices(f.db).changePassword(token(captured[1]!),'ijklmnop')
  assert.equal(await f.accounts.login('mail-student@example.test','abcdefgh'),null);assert.ok(await f.accounts.login('mail-student@example.test','ijklmnop'))
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM student_sessions').get()!.n,0)
  await assert.rejects(notices(f.db).changePassword(token(captured[1]!),'abcdefgh'),/enlace/)
})

test('Reinicio distingue pendientes de entregas interrumpidas sin duplicar envíos',async t=>{
  const captured:AccountMail[]=[],f=await fixture(async mail=>{captured.push(mail)});t.after(f.close)
  f.repo.decide(f.id,1,'approve',f.actor)
  const resumed=accountEmail(f.db,async mail=>{captured.push(mail)})
  await resumed.deliverPending();await resumed.deliverPending();assert.equal(captured.length,1)
  f.db.prepare("UPDATE account_emails SET state='sending'").run()
  const interrupted=accountEmail(f.db,async()=>{throw Error('No debe reenviar')})
  await interrupted.deliverPending();assert.equal(interrupted.forStudent(f.id).delivery?.state,'failed')
})

test('Aprobación Google notifica sin pedir una contraseña CAI',async t=>{
  const captured:AccountMail[]=[],f=await fixture(async mail=>{captured.push(mail)});t.after(f.close)
  f.db.prepare('INSERT INTO google_identities VALUES (?,?,?,?)').run('fictional-subject','mail-student@example.test',f.key,new Date().toISOString())
  f.repo.decide(f.id,1,'approve',f.actor);await f.service.deliverPending()
  assert.equal(captured[0]!.kind,'google-approved');assert.equal(captured[0]!.path,'/login')
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM student_invitations').get()!.n,0)
})

test('Modo sin proveedor conserva enlaces manuales y no crea trabajos de correo',async t=>{
  const f=await fixture();t.after(f.close);f.repo.decide(f.id,1,'approve',f.actor)
  assert.equal(f.service.enabled,false);assert.equal(f.service.forStudent(f.id).delivery,null)
  assert.throws(()=>f.service.resend(f.id,1,f.actor),/configurado/)
  assert.ok(f.accounts.invite(f.id,1,f.actor).path.startsWith('/activar#token='))
})

test('Transporte y contenido: TLS, origen fijo, rutas y errores sin secretos',()=>{
  const settings={host:'smtp.gmail.com',port:465,user:'cai@example.test',from:'cai@example.test',password:'Credencial ficticia exclusiva',publicOrigin:'https://cai.example.test'}
  assert.equal(validateMailSettings(settings,{mode:'production',publicOrigin:'https://cai.example.test',trustedProxy:'loopback'}).port,465)
  for(const extra of [{port:25},{port:'465'},{host:'localhost'},{from:'CAI <caiexample.test>'},{publicOrigin:'https://evil.example.test'},{password:'x\r\ny'}])assert.throws(()=>validateMailSettings({...settings,...extra},{mode:'production',publicOrigin:'https://cai.example.test',trustedProxy:'loopback'}))
  const message:AccountMail={to:'alumno@example.test',kind:'activation',path:'/activar#token='+'a'.repeat(64),expiresAt:'2026-11-25T12:00:00Z'}
  const content=accountEmailContent(message,settings.publicOrigin);assert.ok(content.text.includes('https://cai.example.test/activar#token='));assert.ok(content.html.includes('Activar mi cuenta'));assert.ok(!content.text.includes(settings.password))
  for(const path of ['https://evil.example.test/activar#token='+'a'.repeat(64),'/activar#token=no','/recuperar#token='+'a'.repeat(64)])assert.throws(()=>accountEmailContent({...message,path},settings.publicOrigin))
})
