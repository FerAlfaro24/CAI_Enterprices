import assert from 'node:assert/strict'
import test from 'node:test'
import { request as httpRequest, type IncomingMessage } from 'node:http'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { authRepository, hashPassword, verifyPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { validateSubmission, HttpError } from '../validation.ts'
import { backupLocalDatabase } from '../backup.ts'
import { openDatabase } from '../database.ts'

test('Cuenta administrativa: contraseña propia, revocación y pruebas concurrentes', async t => {
  const root=resolve('.local/tests');await mkdir(root,{recursive:true})
  const directory=await mkdtemp(join(root,'admin-security-')),path=join(directory,'fixture.sqlite')
  let app=createApplication(path)
  const listen=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const address=app.server.address();assert.ok(address&&typeof address==='object');return `http://127.0.0.1:${address.port}`}
  const close=()=>new Promise<void>((resolve,reject)=>app.server.close(error=>error?reject(error):resolve()))
  let base=await listen()
  t.after(async()=>{if(app.server.listening)await close();assert.equal(dirname(directory),root);assert.ok(directory.startsWith(join(root,'admin-security-')));await rm(directory,{recursive:true})})
  const initial='Contraseña ficticia administrativa 2026',updated='Contraseña ficticia renovada 2026 '+'x'.repeat(65),encoded=await hashPassword(initial)
  const ids:Record<string,number>={}
  for(const name of ['owner','other','limited'])ids[name]=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,?,?,'admin')").run(`${name}@example.test`,name,encoded).lastInsertRowid)
  const repo=accessRepository(app.db),receipt=repo.submit(validateSubmission({firstName:'Alumno',lastName:'Ficticio',birthDate:'2000-01-01',email:'student@example.test',filledBy:'alumno',program:'Business English',group:'Mar y jue · 19:30',displayName:'Alumno F.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}),randomUUID())
  repo.decide(receipt.id,1,'approve',ids.owner!)
  app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),encoded,new Date().toISOString())
  const cookies:Record<string,string>={anonymous:''}
  const call=(route:string,method='GET',data?:unknown,actor='owner',headers:Record<string,string>={})=>fetch(base+'/api/local'+route,{method,headers:{Origin:base,Cookie:cookies[actor]??'',...(data===undefined?{}:{'Content-Type':'application/json'}),...headers},body:data===undefined?undefined:JSON.stringify(data)})
  const login=async(name:string,secret=initial,key=name)=>{const r=await call(name==='student'?'/student/login':'/auth/login','POST',{email:`${name}@example.test`,password:secret},'anonymous');assert.equal(r.status,200);cookies[key]=r.headers.getSetCookie().at(-1)!.split(';')[0]!}
  const request=(name='owner')=>({headers:{cookie:cookies[name]}} as IncomingMessage)
  const credentials=()=>String(app.db.prepare('SELECT password_hash FROM admin_users WHERE id=?').get(ids.owner!)!.password_hash)
  const audit=()=>app.db.prepare("SELECT * FROM administration_audit WHERE kind='account.password_changed'").all()
  const draft=(password=updated,currentPassword=initial)=>({currentPassword,password,confirm:password})
  for(const name of ['owner','other','limited','student'])await login(name)
  await login('owner',initial,'stale')
  let current=initial

  await t.test('permiso de administrador, origen y cuerpo limitado se mantienen en el cambio',async()=>{
    for(const actor of ['anonymous','student'])assert.equal((await call('/auth/password','POST',draft(),actor)).status,401)
    assert.equal((await call('/auth/password','POST',draft(),'owner',{Origin:'https://otro.example'})).status,403)
    assert.equal((await call('/auth/password','POST',draft(),'owner',{'Content-Type':'text/plain'})).status,415)
    assert.equal((await call('/auth/password','POST',{...draft(),confirm:'x'.repeat(20_000)})).status,413)
    assert.equal(credentials(),encoded);assert.equal(audit().length,0)
  })
  await t.test('validación estricta y contraseña actual: sin modificar cuenta ni aceptar otro usuario',async()=>{
    const service=authRepository(app.db)
    for(const value of [[],{...draft(),userId:ids.other},{...draft(),email:'other@example.test'},{...draft(),currentPassword:5},{...draft(),password:'corta',confirm:'corta'},{...draft(),password:' '.repeat(20),confirm:' '.repeat(20)},{...draft(),password:'a'.repeat(129),confirm:'a'.repeat(129)},{...draft(),confirm:'no coincide'},draft(initial),{...draft(),currentPassword:'Contraseña errónea de prueba'}]){
      await assert.rejects(service.changePassword(request(),value),error=>error instanceof HttpError&&error.status===400)
    }
    assert.equal(credentials(),encoded);assert.equal((await call('/requests')).status,200);assert.equal(audit().length,0)
  })
  await t.test('limita intentos por cuenta sin bloquear otras cuentas administrativas',async()=>{
    for(let i=0;i<5;i++)assert.equal((await call('/auth/password','POST',{...draft(),currentPassword:'Incorrecta'},'limited')).status,400)
    assert.equal((await call('/auth/password','POST',draft(),'limited')).status,429)
    assert.equal((await call('/requests','GET',undefined,'other')).status,200)
  })
  await t.test('actualiza solo su hash, revoca todas sus sesiones y exige nuevo acceso',async()=>{
    const response=await call('/auth/password','POST',draft());assert.equal(response.status,200)
    assert.deepEqual(await response.json(),{ok:true});assert.match(response.headers.get('set-cookie')!,/Max-Age=0/)
    assert.notEqual(credentials(),encoded);assert.ok(await verifyPassword(updated,credentials()))
    assert.equal(app.db.prepare('SELECT count(*) AS n FROM sessions WHERE user_id=?').get(ids.owner!)!.n,0)
    for(const actor of ['owner','stale'])assert.equal((await call('/requests','GET',undefined,actor)).status,401)
    assert.equal((await call('/requests','GET',undefined,'other')).status,200)
    assert.equal((await call('/student/me','GET',undefined,'student')).status,200)
    assert.equal((await call('/auth/login','POST',{email:'owner@example.test',password:initial},'anonymous')).status,401)
    assert.ok(updated.length>64);await login('owner',updated);current=updated
    assert.equal(audit().length,1)
    const data=JSON.stringify(audit());for(const secret of [initial,updated,encoded,credentials()])assert.ok(!data.includes(secret))
  })
  await t.test('dos cambios simultáneos no sobrescriben una nueva credencial',async()=>{
    const service=authRepository(app.db),candidates=['Nueva frase ficticia concurrente A 2026','Nueva frase ficticia concurrente B 2026']
    const results=await Promise.allSettled(candidates.map(password=>service.changePassword(request(),draft(password,current))))
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1)
    const failure=results.find(r=>r.status==='rejected') as PromiseRejectedResult
    assert.ok(failure.reason instanceof HttpError);assert.equal(failure.reason.status,401)
    current=candidates[results.findIndex(r=>r.status==='fulfilled')]!
    assert.ok(await verifyPassword(current,credentials()));assert.equal(audit().length,2)
  })
  await t.test('caducar sesión o alterar la credencial durante el hash cancela el cambio',async()=>{
    await login('owner',current)
    const original=credentials(),service=authRepository(app.db)
    const expiring=service.changePassword(request(),draft('No guardar con sesión caducada 2026',current))
    app.db.prepare('UPDATE sessions SET expires_at=0 WHERE user_id=?').run(ids.owner!)
    await assert.rejects(expiring,error=>error instanceof HttpError&&error.status===401)
    assert.equal(credentials(),original)
    await login('owner',current)
    const replacement=await hashPassword('Otra credencial ficticia de mantenimiento 2026')
    const changing=service.changePassword(request(),draft('No sobrescribir una credencial nueva 2026',current))
    app.db.prepare('UPDATE admin_users SET password_hash=? WHERE id=?').run(replacement,ids.owner!)
    await assert.rejects(changing,error=>error instanceof HttpError&&error.status===409)
    assert.equal(credentials(),replacement);assert.equal(audit().length,2)
    app.db.prepare('UPDATE admin_users SET password_hash=? WHERE id=?').run(original,ids.owner!)
  })
  await t.test('un login ya iniciado no revive la contraseña anterior después de cambiar el hash',async()=>{
    const original=credentials(),replacement=await hashPassword('Reemplazo ficticio para verificar login 2026')
    const pending=authRepository(app.db).login('owner@example.test',current)
    app.db.prepare('UPDATE admin_users SET password_hash=? WHERE id=?').run(replacement,ids.owner!)
    assert.equal(await pending,null)
    app.db.prepare('UPDATE admin_users SET password_hash=? WHERE id=?').run(original,ids.owner!)
  })
  await t.test('reinicio y copia conservan credencial nueva, revocación e historial sin migración',async()=>{
    const copy=await backupLocalDatabase(path,join(directory,'backups')),restored=openDatabase(copy)
    try{assert.equal((await authRepository(restored).login('owner@example.test',current))?.id,ids.owner);assert.equal(await authRepository(restored).login('owner@example.test',initial),null)}finally{restored.close()}
    await close();app=createApplication(path);base=await listen()
    assert.equal((await call('/requests','GET',undefined,'stale')).status,401)
    await login('owner',current);assert.equal((await call('/requests')).status,200)
    assert.equal((await call('/requests','GET',undefined,'other')).status,200)
    assert.equal((await call('/student/me','GET',undefined,'student')).status,200)
    assert.equal(audit().length,2);assert.equal(app.db.prepare('SELECT MAX(version) AS n FROM migrations').get()!.n,12)
  })
  await t.test('revocar sesiones cancela una escritura cuyo cuerpo todavía estaba llegando',async()=>{
    app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('stream@example.test','stream',?,'admin')").run(encoded)
    await login('stream')
    const before=await(await call('/configuration','GET',undefined,'other')).json() as {settings:{revision:number;registrationOpen:boolean;submissionsOpen:boolean}}
    const payload=JSON.stringify({...before.settings,registrationOpen:!before.settings.registrationOpen})
    const received=once(app.server,'request')
    let finish!:()=>void
    const result=new Promise<number>((resolve,reject)=>{
      const pending=httpRequest(new URL('/api/local/configuration',base),{method:'PATCH',headers:{Origin:base,Cookie:cookies.stream!,'Content-Type':'application/json'}},response=>{response.resume();response.once('end',()=>resolve(response.statusCode!))})
      pending.once('error',reject);pending.write(payload.slice(0,10));finish=()=>pending.end(payload.slice(10))
    })
    await received
    try{assert.equal((await call('/auth/password','POST',draft(),'stream')).status,200)}finally{finish()}
    assert.equal(await result,401)
    assert.deepEqual((await(await call('/configuration','GET',undefined,'other')).json() as typeof before).settings,before.settings)
  })
  await t.test('la misma comprobación impide publicar con una sesión de alumno suspendida durante el envío',async()=>{
    const payload=JSON.stringify({title:'Historia ficticia tardía',body:'Una prueba de escritura después de revocar la sesión del alumno.',category:'achievement'})
    const received=once(app.server,'request')
    let finish!:()=>void
    const result=new Promise<number>((resolve,reject)=>{
      const pending=httpRequest(new URL('/api/local/student/posts',base),{method:'POST',headers:{Origin:base,Cookie:cookies.student!,'Content-Type':'application/json','Idempotency-Key':randomUUID()}},response=>{response.resume();response.once('end',()=>resolve(response.statusCode!))})
      pending.once('error',reject);pending.write(payload.slice(0,10));finish=()=>pending.end(payload.slice(10))
    })
    await received
    const student=accessRepository(app.db).students().find(item=>item.id===receipt.id)!
    try{assert.equal((await call(`/students/${student.id}`,'PATCH',{revision:student.revision,status:'suspendido'},'other')).status,200)}finally{finish()}
    assert.equal(await result,401);assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM publications').get()!.n,0)
  })
})
