import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mkdir,mkdtemp,rm } from 'node:fs/promises'
import { dirname,join,resolve } from 'node:path'
import type { IncomingMessage } from 'node:http'
import { createApplication } from '../app.ts'
import { hashPassword,authRepository } from '../auth.ts'
import { adminTeam } from '../admin-team.ts'
import { adminRecovery,type AdminRecoveryMail } from '../admin-recovery.ts'
import { backupLocalDatabase } from '../backup.ts'
import { verifyLocalBackup } from '../verify-backup.ts'
import { openDatabase } from '../database.ts'
import { accessRepository } from '../access-repository.ts'
import { validateSubmission } from '../validation.ts'
import type { AdminAccount,ActivationInvitation } from '../contracts.ts'

test('Equipo administrativo: invitación, estado y conservación del último acceso',async t=>{
  const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'admin-team-')),path=join(directory,'fixture.sqlite')
  let app=createApplication(path)
  const listen=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const a=app.server.address();assert.ok(a&&typeof a==='object');return `http://127.0.0.1:${a.port}`}
  const close=()=>new Promise<void>((resolve,reject)=>app.server.close(error=>error?reject(error):resolve()))
  let base=await listen()
  t.after(async()=>{if(app.server.listening)await close();assert.equal(dirname(directory),root);assert.ok(directory.startsWith(join(root,'admin-team-')));await rm(directory,{recursive:true})})
  const initial='Frase ficticia de equipo administrativo 2026',chosen='Frase ficticia elegida por nuevo administrador 2026 '+'x'.repeat(65),encoded=await hashPassword(initial),cookies:Record<string,string>={},ids:Record<string,number>={}
  for(const name of ['owner','peer','validation','limited'])ids[name]=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,?,?,'admin')").run(`${name}@example.test`,name,encoded).lastInsertRowid)
  const call=(path:string,method='GET',data?:unknown,who='owner',key?:string,headers:Record<string,string>={})=>fetch(base+'/api/local'+path,{method,headers:{Origin:base,Cookie:cookies[who]??'',...(data===undefined?{}:{'Content-Type':'application/json'}),...(key?{'Idempotency-Key':key}:{}),...headers},body:data===undefined?undefined:JSON.stringify(data)})
  const login=async(name:string,password=initial)=>{const r=await call('/auth/login','POST',{email:`${name}@example.test`,password},'anonymous');assert.equal(r.status,200);cookies[name]=r.headers.getSetCookie().at(-1)!.split(';')[0]!}
  for(const name of Object.keys(ids))await login(name)
  const repo=accessRepository(app.db),receipt=repo.submit(validateSubmission({firstName:'Alumno',lastName:'Ficticio',birthDate:'2000-01-01',email:'student@example.test',filledBy:'alumno',displayName:'Alumno F.',avatarColor:'#1f56d6',visibility:'privado',program:'Business English',group:'Mar y jue · 19:30',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}),randomUUID())
  repo.decide(receipt.id,1,'approve',ids.owner!);app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),encoded,new Date().toISOString())
  const student=await call('/student/login','POST',{email:'student@example.test',password:initial},'anonymous');cookies.student=student.headers.getSetCookie().at(-1)!.split(';')[0]!
  const proof={currentPassword:initial,confirmed:true},newData={name:'Responsable Ficticio',email:'new@example.test',...proof},key=randomUUID()
  const list=async()=>((await (await call('/admin-team')).json()) as {accounts:AdminAccount[]}).accounts
  const current=async(id:number)=>(await list()).find(a=>a.id===id)!
  const request=(who='owner')=>({headers:{cookie:cookies[who]}} as IncomingMessage)
  const token=(link:ActivationInvitation)=>new URLSearchParams(link.path.split('#')[1]).get('token')!
  const invite=async(account:AdminAccount)=>{const r=await call(`/admin-team/${account.id}/invitation`,'POST',{revision:account.revision,...proof});assert.equal(r.status,200);return await r.json() as ActivationInvitation}
  let added:AdminAccount,first:ActivationInvitation,second:ActivationInvitation

  await t.test('directorio solo para administradores; origen/JSON/tamaño y campos protegidos',async()=>{
    for(const who of ['anonymous','student']){assert.equal((await call('/admin-team','GET',undefined,who)).status,401);assert.equal((await call('/admin-team','POST',newData,who,key)).status,401)}
    assert.deepEqual(Object.keys((await list())[0]!).sort(),['activated','active','email','id','name','revision'])
    assert.equal((await call('/admin-team','POST',newData,'owner',key,{Origin:'https://other.test'})).status,403)
    assert.equal((await call('/admin-team','POST',newData,'owner',key,{'Content-Type':'text/plain'})).status,415)
    assert.equal((await call('/admin-team','POST',{...newData,name:'x'.repeat(17000)},'owner',key)).status,413)
    for(const invalid of [{role:'owner'},{active:true},{activated:true},{password:'No asignar contraseñas ajenas'}])assert.equal((await call('/admin-team','POST',{...newData,...invalid},'validation',key)).status,400)
    for(const invalid of [{name:' '},{name:'Dos\nlíneas'},{email:'incorrecto'},{confirmed:false},{currentPassword:'Incorrecta'}])assert.equal((await call('/admin-team','POST',{...newData,...invalid},'validation',key)).status,400)
  })
  await t.test('alta pendiente e idempotente sin conceder acceso ni duplicar auditoría',async()=>{
    const r=await call('/admin-team','POST',newData,'owner',key);assert.equal(r.status,201);added=(await r.json() as {account:AdminAccount}).account
    assert.equal(added.active,true);assert.equal(added.activated,false)
    assert.equal((await call('/admin-team','POST',newData,'owner',key)).status,201)
    assert.equal((await call('/admin-team','POST',{...newData,name:'Otro nombre'},'owner',key)).status,409)
    assert.equal((await call('/admin-team','POST',newData,'owner',randomUUID())).status,409)
    assert.equal(await authRepository(app.db).login(newData.email,initial),null)
    const recovery=adminRecovery(app.db);recovery.request(newData.email);assert.equal(app.db.prepare('SELECT user_id FROM admin_password_resets WHERE user_id=?').get(added.id),undefined)
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM administration_audit WHERE kind='team.account_created'").get()!.n,1)
  })
  await t.test('invitar exige contraseña/revisión; renovar invalida el anterior y no expone hash',async()=>{
    assert.equal((await call(`/admin-team/${added.id}/invitation`,'POST',{revision:added.revision,...proof,currentPassword:'incorrecta'})).status,400)
    first=await invite(added);second=await invite(await current(added.id))
    assert.equal((await call('/admin-activation','POST',{token:token(first),password:chosen,confirm:chosen},'anonymous')).status,400)
    assert.equal((await call(`/admin-team/${added.id}/invitation`,'POST',{revision:added.revision,...proof})).status,409)
    const row=app.db.prepare('SELECT token_hash FROM admin_invitations WHERE user_id=?').get(added.id)!
    assert.notEqual(row.token_hash,token(second));assert.ok(!JSON.stringify(await list()).includes(token(second)))
    assert.ok(!JSON.stringify(app.db.prepare('SELECT * FROM administration_audit').all()).includes(token(second)))
  })
  await t.test('activación exige confirmación, no mezcla alumnos y no cambia sesión distinta',async()=>{
    assert.equal((await call('/activation','POST',{token:token(second),password:chosen,confirm:chosen},'anonymous')).status,400)
    assert.equal((await call('/admin-activation','POST',{token:token(second),password:chosen,confirm:'no coincide'},'anonymous')).status,400)
    const r=await call('/admin-activation','POST',{token:token(second),password:chosen,confirm:chosen},'peer');assert.equal(r.status,200);assert.equal(r.headers.get('set-cookie'),null)
    assert.equal((await call('/requests','GET',undefined,'peer')).status,200)
    assert.equal((await call('/admin-activation','POST',{token:token(second),password:chosen,confirm:chosen},'anonymous')).status,400)
    await login('new',chosen);assert.equal((await current(added.id)).activated,true)
    assert.equal((await call(`/admin-team/${added.id}/invitation`,'POST',{revision:(await current(added.id)).revision,...proof})).status,409)
  })
  await t.test('desactivar revoca sesiones/recuperación; reactivar exige login y no revive enlaces',async()=>{
    const sent:AdminRecoveryMail[]=[],recovery=adminRecovery(app.db,async mail=>{sent.push(mail)});recovery.request(newData.email);await recovery.deliverPending()
    const oldToken=new URLSearchParams(sent[0]!.path.split('#')[1]).get('token')!,before=await current(added.id)
    const value={revision:before.revision,active:false,...proof}
    assert.equal((await call(`/admin-team/${added.id}`,'PATCH',value)).status,200)
    assert.equal((await call(`/admin-team/${added.id}`,'PATCH',value)).status,200)
    assert.equal((await call('/requests','GET',undefined,'new')).status,401)
    assert.equal(await authRepository(app.db).login(newData.email,chosen),null);await assert.rejects(recovery.changePassword(oldToken,initial))
    assert.equal((await call('/student/me','GET',undefined,'student')).status,200)
    const disabled=await current(added.id);assert.equal((await call(`/admin-team/${added.id}`,'PATCH',{revision:disabled.revision,active:true,...proof})).status,200)
    assert.equal((await call('/requests','GET',undefined,'new')).status,401);await login('new',chosen)
    await assert.rejects(recovery.changePassword(oldToken,initial));assert.equal((await call(`/admin-team/${added.id}`,'PATCH',{revision:before.revision,active:false,...proof})).status,409)
  })
  await t.test('revocar durante scrypt de login o reautenticación impide el acceso antiguo',async()=>{
    const service=adminTeam(app.db),target=await current(added.id),pending=authRepository(app.db).login(newData.email,chosen)
    app.db.prepare('UPDATE admin_users SET active=0 WHERE id=?').run(added.id);assert.equal(await pending,null)
    app.db.prepare('UPDATE admin_users SET active=1 WHERE id=?').run(added.id)
    const creating=service.create(request('peer'),{...newData,email:'cancelled@example.test'},randomUUID())
    app.db.prepare('DELETE FROM sessions WHERE user_id=?').run(ids.peer!);await assert.rejects(creating)
    assert.equal(app.db.prepare('SELECT id FROM admin_users WHERE email=?').get('cancelled@example.test'),undefined)
    assert.equal((await current(added.id)).revision,target.revision);await login('peer')
  })
  await t.test('desactivar y reactivar durante un login tampoco revive su prueba anterior',async()=>{
    const pending=authRepository(app.db).login(newData.email,chosen)
    app.db.prepare('UPDATE admin_users SET active=0,revision=revision+1 WHERE id=?').run(added.id)
    app.db.prepare('DELETE FROM sessions WHERE user_id=?').run(added.id)
    app.db.prepare('UPDATE admin_users SET active=1,revision=revision+1 WHERE id=?').run(added.id)
    assert.equal(await pending,null);assert.ok(await authRepository(app.db).login(newData.email,chosen))
  })
  await t.test('invitación suspendida/caducada o revocada durante activación no funciona',async()=>{
    const service=adminTeam(app.db),pending=await service.create(request(),{...newData,email:'pending@example.test'},randomUUID()),link=await service.invite(request(),pending.id,{revision:pending.revision,...proof})
    const activating=service.activate(token(link),chosen)
    // Forzar la transición de fixture mientras scrypt sigue pendiente, sin esperar otra derivación.
    app.db.prepare('UPDATE admin_users SET active=0,revision=revision+1 WHERE id=?').run(pending.id)
    app.db.prepare('DELETE FROM admin_invitations WHERE user_id=?').run(pending.id)
    await assert.rejects(activating)
    let row=await current(pending.id);await service.setActive(request(),pending.id,{revision:row.revision,active:true,...proof})
    await assert.rejects(service.activate(token(link),chosen));row=await current(pending.id)
    const expired=await service.invite(request(),row.id,{revision:row.revision,...proof});app.db.prepare('UPDATE admin_invitations SET expires_at=0 WHERE user_id=?').run(row.id);await assert.rejects(service.activate(token(expired),chosen))
    const fresh=await service.invite(request(),row.id,{revision:(await current(row.id)).revision,...proof})
    const results=await Promise.allSettled([service.activate(token(fresh),chosen),service.activate(token(fresh),initial)])
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1)
  })
  await t.test('protege última cuenta activada y propia; dos desactivaciones cruzadas dejan una',async()=>{
    const service=adminTeam(app.db),before=await list()
    app.db.prepare('UPDATE admin_users SET active=0 WHERE id<>?').run(ids.owner!)
    // Un pendiente habilitado no cuenta como administrador capaz de entrar.
    app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role,active,activated) VALUES ('only-pending@example.test','Pendiente','pending','admin',1,0)").run()
    let owner=await current(ids.owner!)
    await assert.rejects(service.setActive(request(),owner.id,{revision:owner.revision,active:false,...proof}),error=>error instanceof Error&&error.message.includes('última cuenta'))
    app.db.prepare('UPDATE admin_users SET active=1 WHERE id=?').run(ids.peer!)
    await assert.rejects(service.setActive(request(),owner.id,{revision:owner.revision,active:false,...proof}),error=>error instanceof Error&&error.message.includes('propia cuenta'))
    const peer=await current(ids.peer!);owner=await current(ids.owner!)
    const results=await Promise.allSettled([service.setActive(request(),peer.id,{revision:peer.revision,active:false,...proof}),service.setActive(request('peer'),owner.id,{revision:owner.revision,active:false,...proof})])
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM admin_users WHERE active=1 AND activated=1').get()!.n,1)
    for(const row of before)app.db.prepare('UPDATE admin_users SET active=? WHERE id=?').run(row.active?1:0,row.id)
    await login('owner');await login('peer')
  })
  await t.test('estado y auditoría se conservan en copia/reinicio sin cambiar otras cuentas',async()=>{
    const before=await list(),copy=await backupLocalDatabase(path,join(directory,'backups'));assert.equal((await verifyLocalBackup(copy)).schema,16)
    const restored=openDatabase(copy);try{assert.deepEqual(adminTeam(restored).list(),before)}finally{restored.close()}
    await close();app=createApplication(path);base=await listen();assert.deepEqual(await list(),before)
    assert.ok(!JSON.stringify(app.db.prepare('SELECT * FROM administration_audit').all()).includes(initial));assert.ok(!JSON.stringify(await list()).includes('password_hash'))
  })
  await t.test('limita la reautenticación por cuenta sin bloquear otro administrador',async()=>{
    for(let i=0;i<30;i++)assert.equal((await call('/admin-team','POST',{...newData,currentPassword:'incorrecta'},'limited',randomUUID())).status,400)
    assert.equal((await call('/admin-team','POST',newData,'limited',randomUUID())).status,429)
    assert.equal((await call('/admin-team','GET',undefined,'peer')).status,200)
  })
})

test('migración 11 conserva cuentas y sesiones de esquema 10',async()=>{
  const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'admin-team-migration-')),path=join(directory,'legacy.sqlite')
  try{
    const db=openDatabase(path);db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('legacy@example.test','Prueba','hash-ficticio','admin')").run();db.prepare('INSERT INTO sessions VALUES (?,?,?)').run('token-ficticio',1,Date.now()+60000)
    db.exec('DROP INDEX publication_badge_grant; ALTER TABLE publications DROP COLUMN badge_grant_id; DROP TABLE badge_audit; DROP TABLE badge_grants; DROP TABLE badge_requests; DELETE FROM migrations WHERE version=16; DROP TABLE challenge_attempts; DROP TABLE daily_challenges; DROP TABLE challenge_bank; DROP TABLE challenge_controls; DELETE FROM migrations WHERE version=15; DROP TABLE comment_audit; DROP TABLE post_comments; ALTER TABLE community_controls DROP COLUMN comments_open; ALTER TABLE publications DROP COLUMN comments_open; DELETE FROM migrations WHERE version=14; DROP TABLE reaction_requests; DROP TABLE post_reactions; ALTER TABLE community_controls DROP COLUMN reactions_open; DELETE FROM migrations WHERE version=13; DROP TABLE student_record_changes; DELETE FROM migrations WHERE version=12; DROP TABLE admin_invitations; DROP INDEX admin_create_key; ALTER TABLE admin_users DROP COLUMN create_key; ALTER TABLE admin_users DROP COLUMN revision; ALTER TABLE admin_users DROP COLUMN activated; ALTER TABLE admin_users DROP COLUMN active; DELETE FROM migrations WHERE version=11');db.close()
    assert.equal((await verifyLocalBackup(path)).schema,10)
    const migrated=openDatabase(path)
    try{assert.deepEqual(adminTeam(migrated).list(),[{id:1,name:'Prueba',email:'legacy@example.test',active:true,activated:true,revision:1}]);assert.equal(migrated.prepare('SELECT COUNT(*) AS n FROM sessions').get()!.n,1)}finally{migrated.close()}
  }finally{assert.equal(dirname(directory),root);assert.ok(directory.startsWith(join(root,'admin-team-migration-')));await rm(directory,{recursive:true})}
})
