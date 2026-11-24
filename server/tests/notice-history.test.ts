import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { openDatabase } from '../database.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { validateSubmission } from '../validation.ts'
import { queueNotice, notices } from '../notices.ts'
import { institutionalPosts } from '../institutional-posts.ts'
import { publications } from '../publications.ts'
import { backupLocalDatabase } from '../backup.ts'
import { verifyLocalBackup } from '../verify-backup.ts'
import type { StudentNotice, StudentUser, InstitutionalDraft } from '../contracts.ts'

// All persisted data below is synthetic and created under .local/tests.
test('Notificaciones: cierre, prioridad, historial privado y migración aditiva', async t => {
  const root=resolve('.local/tests');await mkdir(root,{recursive:true})
  const directory=await mkdtemp(join(root,'notice-history-')),path=join(directory,'fixture.sqlite')
  let app=createApplication(path),base=''
  const start=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const address=app.server.address();assert.ok(address&&typeof address==='object');base=`http://127.0.0.1:${address.port}`}
  const close=()=>new Promise<void>((done,fail)=>app.server.close(error=>error?fail(error):done()))
  await start();t.after(async()=>{if(app.server.listening)await close()})
  const password='Frase ficticia para notificaciones 2026',encoded=await hashPassword(password)
  const admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(encoded).lastInsertRowid)
  const repo=accessRepository(app.db),ids:Record<string,number>={},users:Record<string,StudentUser>={},cookies:Record<string,string>={}
  const call=(path:string,method='GET',body?:unknown,actor='alice',headers:Record<string,string>={})=>fetch(base+'/api/local'+path,{method,headers:{Origin:base,Cookie:cookies[actor]??'',...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},body:body===undefined?undefined:JSON.stringify(body)})
  for(const name of ['alice','bob','outside','suspended','unassigned']){
    const receipt=repo.submit(validateSubmission({firstName:'Alumno',lastName:'Ficticio',birthDate:'2000-01-01',email:name+'@example.test',filledBy:'alumno',program:'Business English',group:name==='outside'?'Viernes · 18:00':'Mar y jue · 19:30',displayName:'Alumno F.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}),randomUUID())
    repo.decide(receipt.id,1,'approve',admin);ids[name]=Number(receipt.id.slice(4));app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(ids[name]!,encoded,new Date().toISOString())
    const response=await call('/student/login','POST',{email:name+'@example.test',password},'none');assert.equal(response.status,200);cookies[name]=response.headers.getSetCookie().at(-1)!.split(';')[0]!
    users[name]=(await(await call('/student/me','GET',undefined,name)).json() as {user:StudentUser}).user
  }
  repo.setStudentStatus(users.suspended!.id,1,'suspendido',admin)
  const raw=app.db.prepare('SELECT payload FROM requests WHERE id=?').get(ids.unassigned!)!
  app.db.prepare('UPDATE requests SET payload=? WHERE id=?').run(JSON.stringify({...JSON.parse(String(raw.payload)),group:'Por asignar'}),ids.unassigned!)
  const inbox=async(actor='alice')=>(await(await call('/student/notices','GET',undefined,actor)).json() as {notices:StudentNotice[]}).notices
  const make=(subject:string,kind='information',owner=ids.alice!)=>{queueNotice(app.db,owner,subject,'Mensaje sintético privado.',kind);return Number(app.db.prepare('SELECT MAX(id) AS id FROM local_notices').get()!.id)}
  const ordinary=make('Insignia conseguida'),important=make('Nuevo aviso de CAI','announcement'),foreign=make('Solo Bob','information',ids.bob!)
  const archive='/student/notices/archive-viewed',dismiss='/student/notices/dismiss-history'
  await t.test('consultar la bandeja no marca leído; prioridad decidida por servidor',async()=>{
    for(let i=0;i<2;i++){const items=await inbox();assert.equal(items.find(n=>n.id===ordinary)!.read,false);assert.equal(items.find(n=>n.id===important)!.read,false)}
    assert.equal((await inbox()).find(n=>n.id===ordinary)!.important,false);assert.equal((await inbox()).find(n=>n.id===important)!.important,true)
    assert.equal((await call(archive,'POST',{ids:[ordinary],important:false})).status,400)
  })
  await t.test('mutaciones requieren sesión, origen, pertenencia y cuerpo estricto',async()=>{
    for(const endpoint of [archive,dismiss]){
      assert.equal((await call(endpoint,'POST',{ids:[ordinary],confirmed:true},'none')).status,401)
      assert.equal((await call(endpoint,'POST',{ids:[ordinary]},'alice',{Origin:'https://foreign.example.test'})).status,403)
    }
    for(const body of [{ids:'1'},{ids:[ordinary,ordinary]},{ids:[-1]},{ids:[1.5]},{ids:Array.from({length:501},(_,i)=>i+1)},{ids:[ordinary],read:true}])assert.equal((await call(archive,'POST',body)).status,400)
    assert.equal((await call(archive,'POST',{ids:[ordinary,foreign]})).status,404)
    assert.equal((await inbox()).find(n=>n.id===ordinary)!.read,false)
    assert.equal((await call(dismiss,'POST',{ids:[foreign],confirmed:true})).status,404)
  })
  await t.test('cerrar archiva solo las ordinarias vistas, incluso ante prioridad manipulada',async()=>{
    assert.equal((await call(archive,'POST',{ids:[ordinary,important]})).status,200)
    const seen=app.db.prepare('SELECT student_seen_at FROM local_notices WHERE id=?').get(ordinary)!.student_seen_at
    assert.equal((await call(archive,'POST',{ids:[ordinary,important]})).status,200)
    assert.equal(app.db.prepare('SELECT student_seen_at FROM local_notices WHERE id=?').get(ordinary)!.student_seen_at,seen)
    const items=await inbox();assert.equal(items.find(n=>n.id===ordinary)!.read,true);assert.equal(items.find(n=>n.id===important)!.read,false)
  })
  await t.test('el historial no puede borrar avisos sin leer y exige confirmación',async()=>{
    assert.equal((await call(dismiss,'POST',{ids:[ordinary]})).status,400)
    assert.equal((await call(dismiss,'POST',{ids:[ordinary,important],confirmed:true})).status,409)
    assert.ok((await inbox()).some(n=>n.id===ordinary))
    assert.equal((await call(`/student/notices/${important}/seen`,'POST',{})).status,200)
    assert.equal((await call(dismiss,'POST',{ids:[important],confirmed:true})).status,200)
    assert.equal((await call(dismiss,'POST',{ids:[important],confirmed:true})).status,200)
    assert.ok(!(await inbox()).some(n=>n.id===important));assert.ok(notices(app.db).list().some(n=>n.id===important))
    assert.equal(app.db.prepare('SELECT acknowledged FROM local_notices WHERE id=?').get(important)!.acknowledged,0)
  })
  let late:number
  await t.test('vaciar usa una instantánea de leídas, conserva novedades y auditoría',async()=>{
    const history=(await inbox()).filter(n=>n.read).map(n=>n.id);late=make('Novedad posterior')
    assert.equal((await call(dismiss,'POST',{ids:history,confirmed:true})).status,200)
    assert.ok((await inbox()).some(n=>n.id===late&&!n.read));assert.ok(!(await inbox()).some(n=>n.id===ordinary))
    notices(app.db).acknowledge(ordinary);assert.equal(app.db.prepare('SELECT acknowledged FROM local_notices WHERE id=?').get(ordinary)!.acknowledged,1)
  })
  const draft:InstitutionalDraft={title:'Aviso restringido de prueba',body:'Texto privado del grupo que no debe filtrarse en la notificación.',kind:'notice',audience:'group',program:'Business English',group:'Mar y jue · 19:30',imageIds:[],showInGallery:false,highlighted:true,expiresAt:null,confirmed:true}
  await t.test('un aviso de grupo notifica una vez solo a activos de esa audiencia',()=>{
    const before=app.db.prepare("SELECT COUNT(*) AS n FROM local_notices WHERE kind='announcement'").get()!.n,key=randomUUID()
    const official=institutionalPosts(app.db);official.create(draft,key,admin);official.create(draft,key,admin)
    const rows=app.db.prepare("SELECT * FROM local_notices WHERE kind='announcement' ORDER BY id DESC LIMIT 2").all()
    assert.equal(Number(app.db.prepare("SELECT COUNT(*) AS n FROM local_notices WHERE kind='announcement'").get()!.n)-Number(before),2)
    assert.deepEqual(rows.map(n=>Number(n.request_id)).sort(),[ids.alice!,ids.bob!].sort());assert.ok(rows.every(n=>n.important===1&&!String(n.message).includes(draft.body)&&!String(n.message).includes(draft.title)))
  })
  await t.test('un aviso comunitario incluye sin grupo; historias no generan notificaciones',()=>{
    const official=institutionalPosts(app.db),before=Number(app.db.prepare("SELECT COUNT(*) AS n FROM local_notices WHERE kind='announcement'").get()!.n)
    official.create({...draft,kind:'story'},randomUUID(),admin)
    assert.equal(Number(app.db.prepare("SELECT COUNT(*) AS n FROM local_notices WHERE kind='announcement'").get()!.n),before)
    official.create({...draft,audience:'community',program:'',group:''},randomUUID(),admin)
    assert.equal(Number(app.db.prepare("SELECT COUNT(*) AS n FROM local_notices WHERE kind='announcement'").get()!.n)-before,4)
    assert.ok(app.db.prepare("SELECT id FROM local_notices WHERE request_id=? AND kind='announcement'").get(ids.unassigned!))
    assert.ok(!app.db.prepare("SELECT id FROM local_notices WHERE request_id=? AND kind='announcement'").get(ids.suspended!))
  })
  await t.test('aprobación y rechazo de publicación siempre requieren confirmación',()=>{
    const posts=publications(app.db)
    for(const decision of ['approve','reject'] as const){const item=posts.create(users.alice!,{title:'Publicación ficticia de prueba',body:'Una experiencia ficticia para comprobar la prioridad de revisión.',category:'experience'},randomUUID());posts.decide(item.id,1,decision,admin,decision==='reject'?'Revisa el ejemplo de prueba.':undefined,true)}
    assert.ok(notices(app.db).forStudent(users.alice!).filter(n=>n.kind==='publication-review').length>=2)
    assert.ok(notices(app.db).forStudent(users.alice!).filter(n=>n.kind==='publication-review').every(n=>n.important&&!n.read))
  })
  await t.test('reinicio y copia conservan lectura y borrado; coordinación conserva registros',async()=>{
    const before=await inbox(),adminBefore=notices(app.db).list(),copy=await backupLocalDatabase(path,join(directory,'copies'));assert.equal((await verifyLocalBackup(copy)).schema,21)
    await close();app=createApplication(copy);await start();assert.deepEqual(await inbox(),before);assert.deepEqual(notices(app.db).list(),adminBefore)
    assert.ok(app.db.prepare('SELECT student_dismissed_at FROM local_notices WHERE id=?').get(ordinary)!.student_dismissed_at)
  })
  await t.test('migración desde 19 preserva IDs, lecturas y revisiones administrativas',async()=>{
    const copy=await backupLocalDatabase(path,join(directory,'legacy-copies'))
    const legacy=openDatabase(copy),before=legacy.prepare('SELECT id,request_id,subject,student_seen_at,acknowledged FROM local_notices ORDER BY id').all()
    legacy.exec('DROP INDEX student_notice_inbox; ALTER TABLE local_notices DROP COLUMN important; ALTER TABLE local_notices DROP COLUMN student_dismissed_at; DELETE FROM migrations WHERE version=21; DELETE FROM migrations WHERE version=20');legacy.close()
    assert.equal((await verifyLocalBackup(copy)).schema,19)
    const migrated=openDatabase(copy)
    try{assert.deepEqual(migrated.prepare('SELECT id,request_id,subject,student_seen_at,acknowledged FROM local_notices ORDER BY id').all(),before);assert.equal(migrated.prepare('SELECT MAX(version) AS n FROM migrations').get()!.n,21);assert.equal(migrated.prepare('SELECT important FROM local_notices WHERE id=?').get(ordinary)!.important,0);assert.equal(migrated.prepare('SELECT important FROM local_notices WHERE id=?').get(important)!.important,1);assert.equal(migrated.prepare('SELECT COUNT(*) AS n FROM local_notices WHERE student_dismissed_at IS NOT NULL').get()!.n,0)}finally{migrated.close()}
    const again=openDatabase(copy);assert.equal(again.prepare('SELECT COUNT(*) AS n FROM migrations WHERE version=20').get()!.n,1);again.close()
  })
})
