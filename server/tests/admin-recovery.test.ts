import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { mkdir,mkdtemp,rm,readFile } from 'node:fs/promises'
import { dirname,join,resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { adminRecovery,type AdminRecoveryMail } from '../admin-recovery.ts'
import { hashPassword,authRepository,verifyPassword } from '../auth.ts'
import { backupLocalDatabase } from '../backup.ts'
import { openDatabase } from '../database.ts'
import { verifyLocalBackup } from '../verify-backup.ts'

test('Recuperación administrativa: entrega privada, enlace de un uso y revocación',async t=>{
  const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'admin-recovery-')),path=join(directory,'fixture.sqlite')
  let app=createApplication(path)
  const listen=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const address=app.server.address();assert.ok(address&&typeof address==='object');return `http://127.0.0.1:${address.port}`}
  const close=()=>new Promise<void>((resolve,reject)=>app.server.close(error=>error?reject(error):resolve()))
  let base=await listen()
  t.after(async()=>{if(app.server.listening)await close();assert.equal(dirname(directory),root);assert.ok(directory.startsWith(join(root,'admin-recovery-')));await rm(directory,{recursive:true})})
  const initial='Frase ficticia inicial de recuperación administrativa 2026',next='Frase ficticia nueva de recuperación 2026 '+'x'.repeat(65),encoded=await hashPassword(initial)
  const ids:Record<string,number>={}
  for(const name of ['owner','other','expired','parallel','during','email','delivery','failure','renew','pending','queued-a','queued-b'])ids[name]=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,?,?,'admin')").run(`${name}@example.test`,name,encoded).lastInsertRowid)
  const sent:AdminRecoveryMail[]=[],cookies:Record<string,string>={}
  let fail=false,hold:(()=>Promise<void>)|undefined
  let recovery=adminRecovery(app.db,async mail=>{sent.push(mail);if(hold)await hold();if(fail)throw new Error('Detalle privado que no debe salir por HTTP')})
  const token=(name:string)=>new URLSearchParams(sent.filter(m=>m.to===`${name}@example.test`).at(-1)!.path.split('#')[1]).get('token')!
  const call=(path:string,method='GET',data?:unknown,who='anonymous',headers:Record<string,string>={})=>fetch(base+'/api/local'+path,{method,headers:{Origin:base,Cookie:cookies[who]??'',...(data===undefined?{}:{'Content-Type':'application/json'}),...headers},body:data===undefined?undefined:JSON.stringify(data)})
  const login=async(name:string,password=initial)=>{const r=await call('/auth/login','POST',{email:`${name}@example.test`,password});assert.equal(r.status,200);cookies[name]=r.headers.getSetCookie().at(-1)!.split(';')[0]!}
  const issue=async(name:string)=>{recovery.request(`${name}@example.test`);await recovery.deliverPending();return token(name)}
  const change=(value:string,password=next)=>call('/admin-recovery/reset','POST',{token:value,password,confirm:password})
  const row=(name:string)=>app.db.prepare('SELECT * FROM admin_password_resets WHERE user_id=?').get(ids[name]!)
  await login('owner');cookies.stale=cookies.owner!;await login('owner');await login('other')

  await t.test('solicitud uniforme y sin secretos; sin proveedor no emite enlace ni cambia acceso',async()=>{
    const known=await call('/admin-recovery/request','POST',{email:'OWNER@example.test'}),unknown=await call('/admin-recovery/request','POST',{email:'missing@example.test'})
    assert.equal(known.status,202);assert.equal(unknown.status,202);assert.deepEqual(await known.json(),await unknown.json())
    assert.equal(row('owner')!.state,'pending');assert.equal(row('owner')!.token_hash,null)
    assert.equal((await call('/requests','GET',undefined,'owner')).status,200)
    assert.equal((await call('/admin-recovery/preview')).status,401)
    assert.equal((await call('/admin-recovery/preview','GET',undefined,'other')).status,404)
  })
  await t.test('origen, formato, tamaño, correo y campos estrictos',async()=>{
    assert.equal((await call('/admin-recovery/request','POST',{email:'owner@example.test' },'anonymous',{Origin:'https://other.test'})).status,403)
    assert.equal((await call('/admin-recovery/request','POST',{email:'owner@example.test' },'anonymous',{'Content-Type':'text/plain'})).status,415)
    assert.equal((await call('/admin-recovery/request','POST',{email:'x'.repeat(17000)})).status,413)
    for(const data of [{email:'incorrecto'},{email:'owner@example.test',to:'other@example.test'},{email:'owner@example.test',id:ids.other}])assert.equal((await call('/admin-recovery/request','POST',data)).status,400)
    for(const data of [{token:'x',password:next,confirm:next,email:'other@example.test'},{token:'x',password:next,confirm:'distinta'},{token:'x',password:'corta',confirm:'corta'}])assert.equal((await call('/admin-recovery/reset','POST',data)).status,400)
  })
  await t.test('entrega solo al correo registrado; hash privado, sin link en HTTP ni auditoría',async()=>{
    await recovery.deliverPending();const value=token('owner')
    assert.match(value,/^[a-f0-9]{64}$/);assert.equal(sent[0]!.to,'owner@example.test');assert.equal(row('owner')!.state,'delivered');assert.notEqual(row('owner')!.token_hash,value)
    const audit=JSON.stringify(app.db.prepare('SELECT * FROM administration_audit').all());assert.ok(!audit.includes(value));assert.ok(!audit.includes(encoded))
    recovery.request('owner@example.test');await recovery.deliverPending();assert.equal(sent.length,1)
  })
  await t.test('restablece contraseña larga, revoca solo sus sesiones y no inicia sesión',async()=>{
    const response=await change(token('owner'));assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});assert.match(response.headers.get('set-cookie')!,/Max-Age=0/)
    assert.equal(row('owner'),undefined)
    for(const who of ['owner','stale'])assert.equal((await call('/requests','GET',undefined,who)).status,401)
    assert.equal((await call('/requests','GET',undefined,'other')).status,200)
    assert.equal(await authRepository(app.db).login('owner@example.test',initial),null)
    assert.ok(await authRepository(app.db).login('owner@example.test',next));assert.equal((await change(token('owner'))).status,400)
    const audit=app.db.prepare("SELECT details FROM administration_audit WHERE kind='account.password_recovered'").get()!;assert.deepEqual(JSON.parse(String(audit.details)),{sessionsRevoked:2})
  })
  await t.test('abrir el enlace desde otra cuenta no elimina su sesión ni cambia su identidad',async()=>{
    const value=await issue('renew'),response=await call('/admin-recovery/reset','POST',{token:value,password:next,confirm:next},'other')
    assert.equal(response.status,200);assert.equal(response.headers.get('set-cookie'),null)
    assert.equal((await call('/requests','GET',undefined,'other')).status,200)
    const session=await (await call('/auth/session','GET',undefined,'other')).json() as {user:{id:number}}
    assert.equal(session.user.id,ids.other)
  })
  await t.test('no mezcla tokens de alumnos; inválido, caducado o renovado no modifica cuenta',async()=>{
    assert.equal((await change('0'.repeat(64))).status,400)
    const expired=await issue('expired');app.db.prepare('UPDATE admin_password_resets SET expires_at=0 WHERE user_id=?').run(ids.expired!);assert.equal((await change(expired)).status,400)
    const first=await issue('renew');app.db.prepare('UPDATE admin_password_resets SET requested_at=0 WHERE user_id=?').run(ids.renew!);const second=await issue('renew');assert.notEqual(first,second);assert.equal((await change(first)).status,400)
    assert.equal((await call('/recovery/reset','POST',{token:second,password:next,confirm:next})).status,400)
    assert.equal(app.db.prepare('SELECT password_hash FROM admin_users WHERE id=?').get(ids.expired!)!.password_hash,encoded)
  })
  await t.test('dos usos simultáneos permiten exactamente un cambio',async()=>{
    const value=await issue('parallel'),results=await Promise.allSettled([recovery.changePassword(value,next),recovery.changePassword(value,initial+' distinta')])
    assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(results.filter(r=>r.status==='rejected').length,1)
    assert.equal(app.db.prepare("SELECT COUNT(*) AS n FROM administration_audit WHERE actor_id=? AND kind='account.password_recovered'").get(ids.parallel!)!.n,1)
  })
  await t.test('revalida caducidad y credencial tras scrypt; correo cambiado también invalida',async()=>{
    const value=await issue('during'),pending=recovery.changePassword(value,next)
    app.db.prepare('UPDATE admin_password_resets SET expires_at=0 WHERE user_id=?').run(ids.during!);await assert.rejects(pending)
    const emailToken=await issue('email');app.db.prepare('UPDATE admin_users SET email=? WHERE id=?').run('changed@example.test',ids.email!);await assert.rejects(recovery.changePassword(emailToken,next))
    await login('other');const old=await issue('other')
    assert.equal((await call('/auth/password','POST',{currentPassword:initial,password:next,confirm:next},'other')).status,200)
    assert.equal(row('other'),undefined);await assert.rejects(recovery.changePassword(old,next))
  })
  await t.test('enlace sin entrega confirmada o entrega fallida no puede utilizarse',async()=>{
    let release!:()=>void,started!:()=>void;const began=new Promise<void>(resolve=>{started=resolve}),gate=new Promise<void>(resolve=>{release=resolve})
    hold=()=>{started();return gate};recovery.request('delivery@example.test');const delivering=recovery.deliverPending();await began
    assert.equal(row('delivery')!.state,'sending');await assert.rejects(recovery.changePassword(token('delivery'),next));release();await delivering;hold=undefined
    fail=true;const failed=await issue('failure');fail=false;assert.equal(row('failure')!.state,'failed');assert.equal(row('failure')!.token_hash,null);await assert.rejects(recovery.changePassword(failed,next))
  })
  await t.test('sustituir credencial durante el hash o correo durante entrega cancela el enlace',async()=>{
    app.db.prepare('UPDATE admin_password_resets SET requested_at=0 WHERE user_id=?').run(ids.during!)
    const value=await issue('during'),replacement=await hashPassword('Reemplazo ficticio para prueba concurrente 2026')
    const pending=recovery.changePassword(value,next)
    app.db.prepare('UPDATE admin_users SET password_hash=? WHERE id=?').run(replacement,ids.during!)
    await assert.rejects(pending);assert.ok(await verifyPassword('Reemplazo ficticio para prueba concurrente 2026',String(app.db.prepare('SELECT password_hash FROM admin_users WHERE id=?').get(ids.during!)!.password_hash)))
    app.db.prepare('UPDATE admin_password_resets SET requested_at=0 WHERE user_id=?').run(ids.delivery!)
    let release!:()=>void,started!:()=>void;const began=new Promise<void>(resolve=>{started=resolve}),gate=new Promise<void>(resolve=>{release=resolve})
    hold=()=>{started();return gate};recovery.request('delivery@example.test');const delivering=recovery.deliverPending();await began
    app.db.prepare('UPDATE admin_users SET email=? WHERE id=?').run('changed-delivery@example.test',ids.delivery!)
    release();await delivering;hold=undefined
    assert.equal(row('delivery')!.state,'cancelled');await assert.rejects(recovery.changePassword(token('delivery'),next))
  })
  await t.test('procesa también una solicitud recibida durante otra entrega',async()=>{
    let release!:()=>void,started!:()=>void;const began=new Promise<void>(resolve=>{started=resolve}),gate=new Promise<void>(resolve=>{release=resolve})
    hold=()=>{started();return gate};recovery.request('queued-a@example.test');const delivering=recovery.deliverPending();await began
    recovery.request('queued-b@example.test');await recovery.deliverPending();release();await delivering;hold=undefined
    assert.equal(row('queued-a')!.state,'delivered');assert.equal(row('queued-b')!.state,'delivered')
  })
  await t.test('respaldo/reinicio conservan credenciales y token entregado sin texto privado',async()=>{
    const value=await issue('pending'),copy=await backupLocalDatabase(path,join(directory,'backups')),bytes=await readFile(copy)
    assert.equal(bytes.includes(Buffer.from(value)),false);assert.equal((await verifyLocalBackup(copy)).schema,14)
    const restored=openDatabase(copy);try{assert.ok(await authRepository(restored).login('owner@example.test',next));await adminRecovery(restored).changePassword(value,next)}finally{restored.close()}
    recovery.stop();await close();app=createApplication(path);base=await listen();recovery=adminRecovery(app.db)
    assert.equal((await change(value)).status,200);assert.equal((await change(value)).status,400)
  })
  await t.test('límite de solicitudes y reinicio no reviven sesiones ni exponen cola',async()=>{
    for(let i=0;i<10;i++)assert.equal((await call('/admin-recovery/request','POST',{email:'missing@example.test'})).status,202)
    assert.equal((await call('/admin-recovery/request','POST',{email:'owner@example.test'})).status,429)
    assert.equal((await call('/requests','GET',undefined,'stale')).status,401)
    assert.equal((await call('/admin-recovery/preview')).status,401)
  })
})

test('migración 10 preserva cuentas, sesiones y copias históricas de esquema 9',async()=>{
  const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'recovery-migration-')),path=join(directory,'legacy.sqlite')
  try {
    const db=openDatabase(path);db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('legacy@example.test','Prueba','hash-ficticio','admin')").run()
    db.prepare('INSERT INTO sessions VALUES (?,?,?)').run('token-hash-ficticio',1,Date.now()+60000)
    db.exec('DROP TABLE comment_audit; DROP TABLE post_comments; ALTER TABLE community_controls DROP COLUMN comments_open; ALTER TABLE publications DROP COLUMN comments_open; DELETE FROM migrations WHERE version=14; DROP TABLE reaction_requests; DROP TABLE post_reactions; ALTER TABLE community_controls DROP COLUMN reactions_open; DELETE FROM migrations WHERE version=13; DROP TABLE student_record_changes; DELETE FROM migrations WHERE version=12; DROP TABLE admin_invitations; DROP INDEX admin_create_key; ALTER TABLE admin_users DROP COLUMN create_key; ALTER TABLE admin_users DROP COLUMN revision; ALTER TABLE admin_users DROP COLUMN activated; ALTER TABLE admin_users DROP COLUMN active; DELETE FROM migrations WHERE version=11; DROP TABLE admin_password_resets; DELETE FROM migrations WHERE version=10');db.close()
    assert.equal((await verifyLocalBackup(path)).schema,9)
    const migrated=openDatabase(path);try{assert.equal(migrated.prepare('SELECT COUNT(*) AS n FROM admin_users').get()!.n,1);assert.equal(migrated.prepare('SELECT COUNT(*) AS n FROM sessions').get()!.n,1);assert.equal(migrated.prepare('SELECT COUNT(*) AS n FROM admin_password_resets').get()!.n,0);assert.equal(migrated.prepare('SELECT MAX(version) AS n FROM migrations').get()!.n,14)}finally{migrated.close()}
  }finally{assert.equal(dirname(directory),root);assert.ok(directory.startsWith(join(root,'recovery-migration-')));await rm(directory,{recursive:true})}
})
