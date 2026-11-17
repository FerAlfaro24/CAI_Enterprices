import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { request as httpRequest } from 'node:http'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { studentAccounts } from '../student-accounts.ts'
import { publications } from '../publications.ts'
import { hashPassword } from '../auth.ts'
import { validateSubmission } from '../validation.ts'
import { backupLocalDatabase } from '../backup.ts'
import { verifyLocalBackup } from '../verify-backup.ts'
import { openDatabase } from '../database.ts'
import type { PublishedPost, CommunityControls } from '../contracts.ts'

const password='Frase ficticia de reacciones para pruebas 2026'
const profile={firstName:'Alumno',lastName:'Ficticio',birthDate:'2000-01-01',filledBy:'alumno',program:'Business English',group:'Mar y jue · 19:30',displayName:'Alumno F.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}
test('Reacciones: identidad, audiencia, revisión, reintentos y persistencia',async t=>{
 const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'reactions-')),path=join(directory,'fixture.sqlite')
 let app=createApplication(path),base=''
 const start=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const address=app.server.address();assert.ok(address&&typeof address==='object');base='http://127.0.0.1:'+address.port}
 const close=()=>new Promise<void>((resolve,reject)=>app.server.close(error=>error?reject(error):resolve()))
 await start();t.after(async()=>{if(app.server.listening)await close();assert.equal(dirname(directory),root);assert.ok(directory.startsWith(join(root,'reactions-')));await rm(directory,{recursive:true})})
 const hash=await hashPassword(password),admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(hash).lastInsertRowid)
 const ids:Record<string,string>={}
 for(const name of ['alice','bob','carol']){
  const receipt=accessRepository(app.db).submit(validateSubmission({...profile,email:name+'@example.test',...(name==='carol'?{group:'Viernes · 18:00'}:{})}),randomUUID())
  accessRepository(app.db).decide(receipt.id,1,'approve',admin);ids[name]=receipt.id;app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString())
 }
 const cookies:Record<string,string>={}
 const call=(route:string,method='GET',data?:unknown,actor='alice',key?:string,headers:Record<string,string>={})=>fetch(base+'/api/local'+route,{method,headers:{Origin:base,Cookie:cookies[actor]??'',...(data===undefined?{}:{'Content-Type':'application/json'}),...(key?{'Idempotency-Key':key}:{}),...headers},body:data===undefined?undefined:JSON.stringify(data)})
 const login=async(actor:string)=>{const r=await call(actor==='admin'?'/auth/login':'/student/login','POST',{email:actor+'@example.test',password},'anonymous');assert.equal(r.status,200);cookies[actor]=r.headers.getSetCookie().at(-1)!.split(';')[0]!}
 for(const actor of ['admin','alice','bob','carol'])await login(actor)
 const account=await studentAccounts(app.db).login('alice@example.test',password),posts=publications(app.db)
 const post=posts.create(account!,{title:'Un logro para celebrar',body:'Historia ficticia compartida con el grupo para probar reacciones.',category:'achievement'},randomUUID())
 posts.decide(post.id,1,'approve',admin,undefined,true)
 const pending=posts.create(account!,{title:'Historia pendiente',body:'Historia que aún no fue aprobada por coordinación.',category:'experience'},randomUUID())
 const route='/student/posts/'+post.id+'/reaction'
 const react=(reaction:unknown,revision:unknown,key=randomUUID(),actor='alice')=>call(route,'PATCH',{reaction,revision},actor,key)
 const feed=async(actor='alice')=>(await (await call('/student/posts','GET',undefined,actor)).json()) as {posts:PublishedPost[]}
 const summary=async(actor='alice')=>(await feed(actor)).posts.find(p=>p.id===post.id)!.engagement!
 const settings=async()=>(await (await call('/configuration','GET',undefined,'admin')).json() as {settings:CommunityControls}).settings
 const enable=async(open:boolean)=>{assert.equal((await call('/configuration','PATCH',{...await settings(),reactionsOpen:open},'admin')).status,200)}
 await t.test('solo alumnos activos acceden; administración controla la pausa',async()=>{
  assert.equal((await react('love',0,randomUUID(),'anonymous')).status,401);assert.equal((await react('love',0,randomUUID(),'admin')).status,401)
  assert.equal((await settings()).reactionsOpen,false);assert.equal((await react('love',0)).status,409)
  assert.equal((await call('/configuration','PATCH',{...await settings(),reactionsOpen:true},'alice')).status,401)
  await enable(true)
 })
 await t.test('valida reacción, revisión, claves, campos, origen y publicación visible',async()=>{
  for(const [reaction,revision] of [['other',0],[undefined,0],['love',-1],['love','0'],['love',0.5]])assert.equal((await react(reaction,revision)).status,400)
  assert.equal((await call(route,'PATCH',{reaction:'love',revision:0})).status,400)
  assert.equal((await call(route,'PATCH',{reaction:'love',revision:0,studentId:ids.bob},'alice',randomUUID())).status,400)
  assert.equal((await call(route,'PATCH',{reaction:'love',revision:0},'alice',randomUUID(),{Origin:'https://otro.example'})).status,403)
  assert.equal((await call('/student/posts/'+pending.id+'/reaction','PATCH',{reaction:'love',revision:0},'alice',randomUUID())).status,404)
  assert.equal((await react('love',0,randomUUID(),'carol')).status,404);assert.deepEqual((await feed('carol')).posts,[])
 })
 let key=randomUUID()
 await t.test('guarda una selección sin duplicados y solo expone totales/reacción propia',async()=>{
  assert.equal((await react('love',0,key)).status,200);assert.equal((await react('love',0,key)).status,200)
  const own=await summary(),peer=await summary('bob');assert.equal(own.counts.love,1);assert.equal(own.myReaction,'love');assert.equal(own.revision,1);assert.equal(peer.myReaction,null)
  assert.deepEqual(Object.keys(own).sort(),['counts','myReaction','revision']);assert.ok(!JSON.stringify(await feed()).includes('@'))
  assert.equal((await react('wellDone',0,key)).status,409)
 })
 await t.test('cambiar y quitar son explícitos; un envío antiguo no sobrescribe otro posterior',async()=>{
  assert.equal((await react('wellDone',1)).status,200);assert.equal((await react('love',0,key)).status,200)
  assert.equal((await summary()).myReaction,'wellDone');assert.equal((await summary()).counts.love,0)
  assert.equal((await react(null,2)).status,200);assert.equal((await summary()).myReaction,null);assert.equal((await summary()).revision,3)
  assert.equal((await react('funny',1)).status,409)
 })
 await t.test('dos ventanas no sobrescriben su elección; otra cuenta tiene revisión independiente',async()=>{
  const outcomes=await Promise.all([react('amazing',3),react('congrats',3)]);assert.deepEqual(outcomes.map(r=>r.status).sort(),[200,409])
  assert.equal((await react('funny',0,randomUUID(),'bob')).status,200)
  assert.equal((await summary('bob')).myReaction,'funny');assert.notEqual((await summary()).myReaction,'funny')
 })
 await t.test('pausar conserva lectura y permite retirar, sin aceptar nuevas selecciones',async()=>{
  await enable(false);assert.equal((await react('love',4)).status,409);assert.equal((await react(null,4)).status,200)
  assert.equal((await summary('bob')).counts.funny,1);await enable(true)
 })
 await t.test('suspensión del que reacciona se refleja en los contadores y revoca su sesión',async()=>{
  const repo=accessRepository(app.db),bob=repo.students().find(s=>s.id===ids.bob)!
  repo.setStudentStatus(bob.id,bob.revision,'suspendido',admin)
  assert.equal((await summary()).counts.funny,0);assert.equal((await react('love',1,randomUUID(),'bob')).status,401)
  const suspended=repo.students().find(s=>s.id===ids.bob)!;repo.setStudentStatus(suspended.id,suspended.revision,'activo',admin);await login('bob')
 })
 await t.test('revoca una sesión mientras se recibe el cuerpo y no escribe la reacción',async()=>{
  const received=once(app.server,'request')
  const response=new Promise<number>((resolve,reject)=>{
   const req=httpRequest(base+'/api/local'+route,{method:'PATCH',headers:{Origin:base,Cookie:cookies.bob!, 'Content-Type':'application/json','Idempotency-Key':randomUUID()}},r=>{r.resume();resolve(r.statusCode!)})
   req.on('error',reject);req.write('{"reaction":"love",')
   void received.then(()=>{const repo=accessRepository(app.db),bob=repo.students().find(s=>s.id===ids.bob)!;repo.setStudentStatus(bob.id,bob.revision,'suspendido',admin);req.end('"revision":1}')})
  })
  assert.equal(await response,401)
  assert.equal(app.db.prepare('SELECT reaction FROM post_reactions WHERE student_id=?').get(Number(ids.bob!.slice(4)))!.reaction,'funny')
 })
 await t.test('copias/reinicio conservan selección y claves; verificador admite esquema 13',async()=>{
  key=randomUUID();assert.equal((await react('love',5,key)).status,200);const before=await summary(),copy=await backupLocalDatabase(path,join(directory,'copies'))
  assert.equal((await verifyLocalBackup(copy)).schema,16)
  await close();app=createApplication(copy);await start();assert.deepEqual(await summary(),before);assert.equal((await react('love',5,key)).status,200)
 })
 await t.test('migración 12→13 conserva datos/sesiones y empieza sin reacciones',async()=>{
  const copy=await backupLocalDatabase(path,join(directory,'migration')),db=openDatabase(copy)
  const before=db.prepare('SELECT id,payload,revision FROM requests ORDER BY id').all(),sessions=db.prepare('SELECT * FROM student_sessions ORDER BY token_hash').all()
  db.exec('DROP INDEX publication_badge_grant; ALTER TABLE publications DROP COLUMN badge_grant_id; DROP TABLE badge_audit; DROP TABLE badge_grants; DROP TABLE badge_requests; DELETE FROM migrations WHERE version=16; DROP TABLE challenge_attempts; DROP TABLE daily_challenges; DROP TABLE challenge_bank; DROP TABLE challenge_controls; DELETE FROM migrations WHERE version=15; DROP TABLE comment_audit; DROP TABLE post_comments; ALTER TABLE community_controls DROP COLUMN comments_open; ALTER TABLE publications DROP COLUMN comments_open; DELETE FROM migrations WHERE version=14; DROP TABLE reaction_requests; DROP TABLE post_reactions; ALTER TABLE community_controls DROP COLUMN reactions_open; DELETE FROM migrations WHERE version=13');db.close()
  assert.equal((await verifyLocalBackup(copy)).schema,12);const upgraded=openDatabase(copy)
  try{assert.deepEqual(upgraded.prepare('SELECT id,payload,revision FROM requests ORDER BY id').all(),before);assert.deepEqual(upgraded.prepare('SELECT * FROM student_sessions ORDER BY token_hash').all(),sessions);assert.equal(upgraded.prepare('SELECT COUNT(*) AS n FROM post_reactions').get()!.n,0);assert.equal(upgraded.prepare('SELECT reactions_open FROM community_controls').get()!.reactions_open,0)}finally{upgraded.close()}
 })
 await t.test('retirar la publicación bloquea cualquier nueva reacción o reintento',async()=>{
  const current=publications(app.db).review().find(p=>p.id===post.id)!
  publications(app.db).withdraw(account!,post.id,current.revision)
  assert.equal((await react('love',5,key)).status,404);assert.ok(!(await feed()).posts.some(p=>p.id===post.id))
 })
 await t.test('límite de cambios por cuenta sin bloquear a otros alumnos',async()=>{
  let limited=false
  for(let i=0;i<61;i++){const response=await react('love',6);if(response.status===429){limited=true;break}assert.equal(response.status,404)}
  assert.equal(limited,true);assert.equal((await react('love',0,randomUUID(),'carol')).status,404)
 })
})

