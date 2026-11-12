import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { hashPassword } from '../auth.ts'
import { validateSubmission } from '../validation.ts'
import { queueNotice } from '../notices.ts'
import { contactPrograms } from '../../src/features/landing/data/content.ts'
import type { ContactInquiry, ContactReceipt, StudentNotice } from '../contracts.ts'

test('Bandejas: contacto privado, avisos propios y persistencia', async t => {
  const root = resolve('.local/tests'); await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'inbox-')), path = join(directory, 'test.sqlite')
  let app = createApplication(path)
  const listen = async () => { app.server.listen(0,'127.0.0.1'); await once(app.server,'listening'); const address=app.server.address(); assert.ok(address&&typeof address==='object'); return `http://127.0.0.1:${address.port}` }
  const close = () => new Promise<void>((resolve,reject)=>app.server.close(error=>error?reject(error):resolve()))
  let base = await listen()
  t.after(async()=>{if(app.server.listening)await close();assert.equal(dirname(directory),root);assert.ok(directory.startsWith(join(root,'inbox-')));await rm(directory,{recursive:true})})
  const password='Frase ficticia de contacto y avisos 2026', hash=await hashPassword(password)
  const admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(hash).lastInsertRowid)
  const repo=accessRepository(app.db), owners:Record<string,string>={}
  for(const name of ['alice','bob']){
    const receipt=repo.submit(validateSubmission({firstName:'Alumno',lastName:'Prueba',birthDate:'2000-01-01',email:`${name}@example.test`,filledBy:'alumno',program:'Business English',group:'Mar y jue · 19:30',displayName:'Alumno P.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}),randomUUID())
    repo.decide(receipt.id,1,'approve',admin);app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString());owners[name]=receipt.id
  }
  const cookies:Record<string,string>={anonymous:''}
  const call=(path:string,method='GET',data?:unknown,actor='admin',extra:Record<string,string>={})=>fetch(base+'/api/local'+path,{method,headers:{Origin:base,Cookie:cookies[actor]??'',...(data===undefined?{}:{'Content-Type':'application/json'}),...extra},body:data===undefined?undefined:JSON.stringify(data)})
  for(const name of ['admin','alice','bob']){const r=await call(name==='admin'?'/auth/login':'/student/login','POST',{email:`${name}@example.test`,password},'anonymous');assert.equal(r.status,200);cookies[name]=r.headers.getSetCookie().at(-1)!.split(';')[0]!}
  const draft={name:'Persona de prueba',contact:'consulta@example.test',program:contactPrograms[0]!.id,consent:true}
  const submit=(data:unknown=draft,key=randomUUID(),headers:Record<string,string>={})=>call('/contact','POST',data,'anonymous',{'Idempotency-Key':key,...headers})
  const inquiries=async()=> (await (await call('/contacts')).json() as {contacts:ContactInquiry[]}).contacts
  const notices=async(actor:string)=>(await(await call('/student/notices','GET',undefined,actor)).json() as {notices:StudentNotice[]}).notices
  let receipt:ContactReceipt

  await t.test('el contacto exige datos, consentimiento, clave y origen; no admite asignaciones privadas',async()=>{
    for(const invalid of [{name:'a'},{contact:'inválido'},{program:'no-existe'},{consent:false},{consent:'true'},{status:'atendida'},{note:'privada'},{name:'a'.repeat(81)}])assert.equal((await submit({...draft,...invalid})).status,400)
    assert.equal((await call('/contact','POST',draft,'anonymous')).status,400)
    assert.equal((await submit(draft,randomUUID(),{Origin:'https://otro.example'})).status,403)
    assert.equal((await submit({...draft,contact:'+52 5512345678'})).status,201)
  })
  await t.test('guardar y reintentar no duplica ni devuelve datos de otros contactos',async()=>{
    const key=randomUUID();const r=await submit(draft,key);assert.equal(r.status,201);receipt=await r.json() as ContactReceipt
    assert.deepEqual(Object.keys(receipt).sort(),['createdAt','id']);assert.match(receipt.id,/^CON-\d{4,}$/)
    assert.deepEqual(await(await submit(draft,key)).json(),receipt)
    assert.equal((await submit({...draft,name:'Otra persona'},key)).status,409)
    assert.equal((await inquiries()).filter(item=>item.id===receipt.id).length,1)
  })
  await t.test('solo administración consulta y atiende; notas y estados usan revisión',async()=>{
    for(const actor of ['anonymous','alice']){assert.equal((await call('/contacts','GET',undefined,actor)).status,401);assert.equal((await call(`/contacts/${receipt.id}`,'PATCH',{revision:1,status:'atendida',note:''},actor)).status,401)}
    assert.equal((await call(`/contacts/${receipt.id}`,'PATCH',{revision:1,status:['atendida'],note:''})).status,400)
    assert.equal((await call(`/contacts/${receipt.id}`,'PATCH',{revision:1,status:'seguimiento',note:'Primera revisión\nPendiente de respuesta.'})).status,200)
    assert.equal((await call(`/contacts/${receipt.id}`,'PATCH',{revision:1,status:'atendida',note:'No debe sobrescribir'})).status,409)
    assert.equal((await inquiries()).find(item=>item.id===receipt.id)!.status,'seguimiento')
    const audit=app.db.prepare("SELECT details FROM administration_audit WHERE kind='contact.updated'").get()!
    assert.ok(!String(audit.details).includes(draft.contact));assert.ok(!String(audit.details).includes('Primera revisión'))
  })
  await t.test('los avisos del alumno no incluyen destinatarios ni datos de otros; lectura independiente',async()=>{
    queueNotice(app.db,Number(owners.alice!.slice(4)),'Solo para Alice','Contenido de prueba privado.')
    const own=await notices('alice'), other=await notices('bob'), item=own.find(item=>item.subject==='Solo para Alice')!
    assert.ok(item);assert.ok(!other.some(other=>other.id===item.id));assert.deepEqual(Object.keys(item).sort(),['createdAt','id','kind','message','read','subject'])
    assert.ok(!JSON.stringify(own).includes('@'));assert.ok(!JSON.stringify(own).includes('token='))
    assert.equal((await call('/student/notices','GET',undefined,'anonymous')).status,401)
    assert.equal((await call(`/student/notices/${item.id}/seen`,'POST',{},'bob')).status,404)
    assert.equal((await call(`/student/notices/${item.id}/seen`,'POST',{requestId:owners.alice},'alice')).status,400)
    assert.equal((await call(`/student/notices/${item.id}/seen`,'POST',{},'alice')).status,200)
    assert.equal((await notices('alice')).find(row=>row.id===item.id)!.read,true)
    assert.equal(app.db.prepare('SELECT acknowledged FROM local_notices WHERE id=?').get(item.id)!.acknowledged,0)
  })
  await t.test('marcar revisado por coordinación no marca leído por el alumno; suspensión revoca avisos',async()=>{
    const item=(await notices('bob'))[0]!
    assert.equal((await call(`/notices/${item.id}/acknowledge`,'POST',{})).status,200)
    assert.equal((await notices('bob')).find(row=>row.id===item.id)!.read,false)
    repo.setStudentStatus(owners.bob!,1,'suspendido',admin)
    assert.equal((await call('/student/notices','GET',undefined,'bob')).status,401)
  })
  await t.test('consultas, notas y lecturas sobreviven al reinicio sin recrear tablas',async()=>{
    const before=await inquiries(), own=await notices('alice')
    await close();app=createApplication(path);base=await listen()
    assert.deepEqual(await inquiries(),before);assert.deepEqual(await notices('alice'),own)
    assert.equal(app.db.prepare('SELECT count(*) AS n FROM migrations WHERE version=8').get()!.n,1)
  })
})
