import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mkdir,mkdtemp,rm } from 'node:fs/promises'
import { dirname,join,resolve } from 'node:path'
import type { IncomingMessage } from 'node:http'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { validateSubmission } from '../validation.ts'
import { studentRecords } from '../student-records.ts'
import { studentAccounts } from '../student-accounts.ts'
import { publications } from '../publications.ts'
import { publicProfileId } from '../public-profiles.ts'
import { backupLocalDatabase } from '../backup.ts'
import { openDatabase } from '../database.ts'
import { verifyLocalBackup } from '../verify-backup.ts'
import { notices } from '../notices.ts'
import type { StudentRecord,StudentRecordDraft,Submission } from '../contracts.ts'

test('Corrección de expediente: datos privados, tutor, identidad y revisiones',async t=>{
  const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'student-records-')),path=join(directory,'fixture.sqlite')
  let app=createApplication(path)
  const listen=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const a=app.server.address();assert.ok(a&&typeof a==='object');return `http://127.0.0.1:${a.port}`}
  const close=()=>new Promise<void>((resolve,reject)=>app.server.close(error=>error?reject(error):resolve()))
  let base=await listen()
  t.after(async()=>{if(app.server.listening)await close();assert.equal(dirname(directory),root);assert.ok(directory.startsWith(join(root,'student-records-')));await rm(directory,{recursive:true})})
  const password='Frase ficticia de corrección de expediente 2026',encoded=await hashPassword(password),cookies:Record<string,string>={},ids:Record<string,string>={}
  const admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Prueba expediente',?,'admin')").run(encoded).lastInsertRowid)
  app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('validation@example.test','Prueba validación',?,'admin')").run(encoded)
  const profile:Submission={firstName:'Alumno',lastName:'Ficticio',birthDate:'2000-01-01',email:'adult@example.test',filledBy:'alumno',program:'Business English',group:'Mar y jue · 19:30',displayName:'Alias ficticio adulto',avatarColor:'#1f56d6',visibility:'comunidad',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}
  const guardian={name:'Tutor Ficticio',relationship:'Tutor',contact:'tutor@example.test'},minorBirth=`${new Date().getFullYear()-15}-01-01`
  const repo=accessRepository(app.db)
  for(const who of ['adult','minor','peer','google','suspended','pending']){
    const receipt=repo.submit(validateSubmission({...profile,email:`${who}@example.test`,...(who==='minor'?{birthDate:minorBirth,displayName:'Alumno F.',visibility:'privado',guardianConsent:true,guardian}:{})}),randomUUID())
    if(who==='minor')repo.decide(receipt.id,1,'consent',admin,'Referencia inicial ficticia')
    repo.decide(receipt.id,who==='minor'?2:1,'approve',admin);ids[who]=receipt.id
    if(who==='google')app.db.prepare('INSERT INTO google_identities VALUES (?,?,?,?)').run('subject-record-test',`${who}@example.test`,Number(receipt.id.slice(4)),new Date().toISOString())
    else if(who!=='pending')app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),encoded,new Date().toISOString())
  }
  const call=(path:string,method='GET',data?:unknown,who='admin',key?:string,headers:Record<string,string>={})=>fetch(base+'/api/local'+path,{method,headers:{Origin:base,Cookie:cookies[who]??'',...(data===undefined?{}:{'Content-Type':'application/json'}),...(key?{'Idempotency-Key':key}:{}),...headers},body:data===undefined?undefined:JSON.stringify(data)})
  const login=async(who:string)=>{const r=await call(who==='admin'||who==='validation'?'/auth/login':'/student/login','POST',{email:`${who}@example.test`,password},'anonymous');assert.equal(r.status,200);cookies[who]=r.headers.getSetCookie().at(-1)!.split(';')[0]!}
  for(const who of ['admin','validation','adult','minor','peer','suspended'])await login(who)
  const get=async(who='adult')=>(await (await call(`/students/${ids[who]}/record`)).json() as {record:StudentRecord}).record
  const draft=async(who='adult'):Promise<StudentRecordDraft>=>{const r=await get(who);return {revision:r.revision,firstName:r.firstName,lastName:r.lastName,birthDate:r.birthDate,studentCode:r.studentCode,guardian:r.guardian,reason:'Corrección ficticia comprobada',consentReference:'',currentPassword:password,confirmed:true}}
  const correct=(who:string,data:unknown,key=randomUUID(),actor='admin')=>call(`/students/${ids[who]}/record`,'PATCH',data,actor,key)
  const payload=(who:string)=>JSON.parse(String(app.db.prepare('SELECT payload FROM requests WHERE id=?').get(Number(ids[who]!.slice(4)))!.payload)) as Submission
  const postIds:Record<string,string>={}
  for(const who of ['adult','minor']){const account=await studentAccounts(app.db).login(`${who}@example.test`,password),post=publications(app.db).create(account!,{title:'Historia ficticia del expediente',body:'Historia ficticia sin datos personales para revisar privacidad.',category:'experience'},randomUUID());publications(app.db).decide(post.id,post.revision,'approve',admin,undefined,true);postIds[who]=post.id}

  await t.test('lectura/escritura solo administrativas; no expone expediente al grupo',async()=>{
    for(const who of ['anonymous','adult','peer']){assert.equal((await call(`/students/${ids.adult}/record`,'GET',undefined,who)).status,401);assert.equal((await correct('adult',await draft(),randomUUID(),who)).status,401)}
    assert.equal((await call('/students/CAI-9999/record')).status,404)
    const group=JSON.stringify(await (await call('/student/group','GET',undefined,'peer')).json());assert.ok(!group.includes('birthDate'));assert.ok(!group.includes('guardian'));assert.ok(!group.includes('@'))
  })
  await t.test('origen/formato/tamaño y campos protegidos; validación de datos/motivo/confirmación',async()=>{
    const value=await draft()
    assert.equal((await call(`/students/${ids.adult}/record`,'PATCH',value,'admin',randomUUID(),{Origin:'https://other.test'})).status,403)
    assert.equal((await call(`/students/${ids.adult}/record`,'PATCH',value,'admin',randomUUID(),{'Content-Type':'text/plain'})).status,415)
    assert.equal((await correct('adult',{...value,reason:'x'.repeat(17000)})).status,413)
    for(const field of ['email','program','group','role','visibility','displayName','googleSubject','status'])assert.equal((await correct('adult',{...value,[field]:'alterar'},randomUUID(),'validation')).status,400)
    for(const invalid of [{birthDate:'2020-02-31'},{birthDate:'2100-01-01'},{firstName:'Una\nlínea'},{studentCode:'!!!'},{reason:'corto'},{confirmed:false},{currentPassword:'Incorrecta'}])assert.equal((await correct('adult',{...value,firstName:'Alumno corregido',...invalid},randomUUID(),'validation')).status,400)
    assert.equal((await correct('adult',{...value,firstName:'Alumno corregido',guardian:{...guardian,contact:'inválido'}})).status,400)
  })
  await t.test('corrige con motivo/historial y reintento idempotente; conserva alias, cuenta y grupo',async()=>{
    const before=payload('adult'),publicId=publicProfileId(app.db,Number(ids.adult!.slice(4))),value={...await draft(),firstName:'Nombre corregido',studentCode:'CAI-2026'},key=randomUUID()
    const mail=notices(app.db);mail.requestRecovery('adult@example.test')
    const recoveryNotice=Number(app.db.prepare("SELECT id FROM local_notices WHERE request_id=? AND kind='recovery'").get(Number(ids.adult!.slice(4)))!.id)
    const recoveryLink=mail.previewRecovery(recoveryNotice,admin),recoveryToken=new URLSearchParams(recoveryLink.path.split('#')[1]).get('token')!
    assert.equal((await correct('adult',value,key)).status,200);assert.equal((await correct('adult',value,key)).status,200)
    await assert.rejects(mail.changePassword(recoveryToken,password+' nueva'))
    assert.equal(app.db.prepare('SELECT request_id FROM password_resets WHERE request_id=?').get(Number(ids.adult!.slice(4))),undefined)
    const current=await get();assert.equal(current.history.length,1);assert.equal(current.history[0]!.before.firstName,before.firstName);assert.equal(current.history[0]!.after.firstName,value.firstName)
    assert.equal(payload('adult').email,before.email);assert.equal(payload('adult').program,before.program);assert.equal(payload('adult').displayName,before.displayName);assert.equal(publicProfileId(app.db,Number(ids.adult!.slice(4))),publicId)
    assert.equal((await call('/student/me','GET',undefined,'adult')).status,401);assert.equal((await call('/student/me','GET',undefined,'peer')).status,200)
    assert.equal((await correct('adult',{...value,lastName:'Distinto'},key)).status,409)
    const audit=JSON.stringify(app.db.prepare("SELECT details FROM administration_audit WHERE kind='student.record_corrected'").all());assert.ok(!audit.includes(value.firstName));assert.ok(!audit.includes(password));assert.ok(!audit.includes(before.birthDate))
    await login('adult')
  })
  await t.test('menor exige nueva autorización distinta; abrevia y devuelve historias a revisión',async()=>{
    const value={...await draft('minor'),firstName:'Nombre corregido',guardian:{...guardian,contact:'nuevo-tutor@example.test'}}
    assert.equal((await correct('minor',value)).status,400)
    assert.equal((await correct('minor',{...value,consentReference:'Referencia inicial ficticia'})).status,400)
    assert.equal((await correct('minor',{...value,consentReference:'Nueva autorización ficticia de tutor 2026'})).status,200)
    const current=payload('minor');assert.equal(current.displayName,'Nombre F.');assert.equal(current.visibility,'privado')
    assert.equal(app.db.prepare('SELECT status FROM publications WHERE id=?').get(Number(postIds.minor!.slice(4)))!.status,'pendiente')
    assert.equal((await get('minor')).history[0]!.before.consentReference,'Referencia inicial ficticia')
    assert.equal((await call('/student/me','GET',undefined,'minor')).status,401)
  })
  await t.test('adulto corregido a menor necesita tutor; no cambia correo ni abre privacidad',async()=>{
    const value={...await draft(),birthDate:minorBirth,guardian:null}
    assert.equal((await correct('adult',value)).status,400)
    assert.equal((await correct('adult',{...value,guardian,consentReference:'Autorización ficticia por corrección de edad'})).status,200)
    assert.equal(payload('adult').visibility,'privado');assert.equal(payload('adult').displayName,'Nombre F.')
    assert.equal(app.db.prepare('SELECT status FROM publications WHERE id=?').get(Number(postIds.adult!.slice(4)))!.status,'pendiente')
    assert.equal(payload('adult').email,'adult@example.test')
    const next={...await draft(),birthDate:'2000-01-01',guardian:null}
    assert.equal((await correct('adult',next)).status,200);assert.equal(payload('adult').displayName,'Nombre F.');assert.equal(payload('adult').visibility,'privado')
    assert.equal((await get()).guardian,null);assert.ok((await get()).history.some(item=>item.before.guardian?.name===guardian.name))
  })
  await t.test('matrícula de menor no exige renovar autorización ni mueve publicaciones',async()=>{
    const value={...await draft('minor'),studentCode:'MENOR-26'}
    const prior=(await get('minor')).consentReference
    assert.equal((await correct('minor',value)).status,200);assert.equal((await get('minor')).consentReference,prior)
  })
  await t.test('conserva Google, revoca enlaces/sesiones y no reactiva alumnos suspendidos',async()=>{
    const accounts=studentAccounts(app.db),user=accounts.forGoogle('subject-record-test')!
    const googleCookie=accounts.start(user).split(';')[0]!,requestId=Number(ids.google!.slice(4))
    app.db.prepare('INSERT INTO google_sessions VALUES (?,?,?)').run('hash-google-fixture','subject-record-test',Date.now()+60000)
    assert.equal((await correct('google',{...await draft('google'),studentCode:'GOOG-26'})).status,200)
    assert.equal(app.db.prepare('SELECT subject FROM google_identities WHERE request_id=?').get(requestId)!.subject,'subject-record-test');assert.equal(accounts.session({headers:{cookie:googleCookie}} as IncomingMessage),null)
    assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM google_sessions').get()!.n,0)
    repo.setStudentStatus(ids.suspended!,repo.students().find(s=>s.id===ids.suspended)!.revision,'suspendido',admin)
    assert.equal((await correct('suspended',{...await draft('suspended'),studentCode:'SUSP-26'})).status,200)
    assert.equal(repo.students().find(s=>s.id===ids.suspended)!.status,'suspendido')
    const pendingId=Number(ids.pending!.slice(4)),pending=repo.students().find(s=>s.id===ids.pending)!
    accounts.invite(pending.id,pending.revision,admin)
    assert.equal((await correct('pending',{...await draft('pending'),studentCode:'PEND-26'})).status,200);assert.equal(app.db.prepare('SELECT request_id FROM student_invitations WHERE request_id=?').get(pendingId),undefined)
  })
  await t.test('grupo archivado permite corregir; dos revisiones no se sobrescriben',async()=>{
    const group=app.db.prepare('SELECT id FROM course_groups WHERE program=? AND name=?').get(profile.program,profile.group)!
    app.db.prepare('UPDATE course_groups SET active=0 WHERE id=?').run(Number(group.id))
    const value=await draft(),a=correct('adult',{...value,studentCode:'RACE-A'}),b=correct('adult',{...value,studentCode:'RACE-B'})
    const statuses=(await Promise.all([a,b])).map(r=>r.status).sort();assert.deepEqual(statuses,[200,409]);assert.ok(['RACE-A','RACE-B'].includes(payload('adult').studentCode!))
    app.db.prepare('UPDATE course_groups SET active=1 WHERE id=?').run(Number(group.id))
  })
  await t.test('revocación del administrador durante reautenticación cancela; login previo no revive alumno',async()=>{
    const request={headers:{cookie:cookies.validation}} as IncomingMessage,value={...await draft(),studentCode:'NO-SAVE'}
    const correcting=studentRecords(app.db).correct(request,ids.adult!,value,randomUUID())
    app.db.prepare("DELETE FROM sessions WHERE user_id=(SELECT id FROM admin_users WHERE email='validation@example.test')").run()
    await assert.rejects(correcting);assert.notEqual(payload('adult').studentCode,'NO-SAVE')
    const logging=studentAccounts(app.db).login('adult@example.test',password)
    app.db.prepare('UPDATE requests SET revision=revision+1 WHERE id=?').run(Number(ids.adult!.slice(4)))
    assert.equal(await logging,null)
  })
  await t.test('copia/reinicio conservan expediente, historial y otras cuentas',async()=>{
    const before=await get(),copy=await backupLocalDatabase(path,join(directory,'backups'));assert.equal((await verifyLocalBackup(copy)).schema,16)
    const restored=openDatabase(copy);try{assert.deepEqual(studentRecords(restored).get(ids.adult!),before)}finally{restored.close()}
    await close();app=createApplication(path);base=await listen();assert.deepEqual(await get(),before);assert.equal((await call('/student/me','GET',undefined,'peer')).status,200)
  })
  await t.test('migración 12 añade historial vacío sin alterar expedientes ni sesiones de esquema 11',async()=>{
    const copy=await backupLocalDatabase(path,join(directory,'legacy')),legacy=openDatabase(copy)
    const before=legacy.prepare('SELECT id,payload,revision FROM requests ORDER BY id').all(),sessions=legacy.prepare('SELECT * FROM student_sessions ORDER BY token_hash').all()
    legacy.exec('DROP INDEX publication_badge_grant; ALTER TABLE publications DROP COLUMN badge_grant_id; DROP TABLE badge_audit; DROP TABLE badge_grants; DROP TABLE badge_requests; DELETE FROM migrations WHERE version=16; DROP TABLE challenge_attempts; DROP TABLE daily_challenges; DROP TABLE challenge_bank; DROP TABLE challenge_controls; DELETE FROM migrations WHERE version=15; DROP TABLE comment_audit; DROP TABLE post_comments; ALTER TABLE community_controls DROP COLUMN comments_open; ALTER TABLE publications DROP COLUMN comments_open; DELETE FROM migrations WHERE version=14; DROP TABLE reaction_requests; DROP TABLE post_reactions; ALTER TABLE community_controls DROP COLUMN reactions_open; DELETE FROM migrations WHERE version=13; DROP TABLE student_record_changes; DELETE FROM migrations WHERE version=12');legacy.close()
    assert.equal((await verifyLocalBackup(copy)).schema,11)
    const upgraded=openDatabase(copy)
    try{assert.deepEqual(upgraded.prepare('SELECT id,payload,revision FROM requests ORDER BY id').all(),before);assert.deepEqual(upgraded.prepare('SELECT * FROM student_sessions ORDER BY token_hash').all(),sessions);assert.equal(upgraded.prepare('SELECT COUNT(*) AS n FROM student_record_changes').get()!.n,0);assert.equal(upgraded.prepare('SELECT MAX(version) AS n FROM migrations').get()!.n,16)}finally{upgraded.close()}
  })
  await t.test('limita confirmaciones por administrador sin bloquear otras cuentas',async()=>{
    await login('validation')
    const value={...await draft(),studentCode:'LIMIT-26',currentPassword:'Incorrecta'}
    for(let i=0;i<30;i++)assert.equal((await correct('adult',value,randomUUID(),'validation')).status,400)
    assert.equal((await correct('adult',value,randomUUID(),'validation')).status,429)
    assert.equal((await call(`/students/${ids.adult}/record`)).status,200)
  })
})
