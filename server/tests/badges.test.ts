import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { request as httpRequest } from 'node:http'
import { mkdir,mkdtemp,rm } from 'node:fs/promises'
import { dirname,join,resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { studentAccounts } from '../student-accounts.ts'
import { hashPassword } from '../auth.ts'
import { validateSubmission } from '../validation.ts'
import { challengesRepository } from '../challenges.ts'
import { badgesRepository } from '../badges.ts'
import { badgeDefinitions } from '../../shared/badges.ts'
import { backupLocalDatabase } from '../backup.ts'
import { verifyLocalBackup } from '../verify-backup.ts'
import { openDatabase } from '../database.ts'
import type { BadgeApplication,BadgeSnapshot,EarnedBadge,OwnPost,StudentUser } from '../contracts.ts'

test('Insignias: reglas verificables, revisión privada, concesión y compartición',async t=>{
 const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'badges-')),path=join(directory,'fixture.sqlite')
 let time=new Date('2026-11-12T18:00:00Z'),app=createApplication(path,{}, {challengeClock:()=>time}),base=''
 const start=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const address=app.server.address();assert.ok(address&&typeof address==='object');base='http://127.0.0.1:'+address.port}
 const close=()=>new Promise<void>((resolve,reject)=>app.server.close(error=>error?reject(error):resolve()))
 await start();t.after(async()=>{if(app.server.listening)await close();assert.equal(dirname(directory),root);assert.ok(directory.startsWith(join(root,'badges-')));await rm(directory,{recursive:true})})
 const password='Pruebas ficticias de insignias CAI 2026',hash=await hashPassword(password),admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(hash).lastInsertRowid)
 const ids:Record<string,string>={},users:Record<string,StudentUser>={},cookies:Record<string,string>={}
 for(const actor of ['alice','bob','outside','achiever','gaps','limited','revoked']){
  const receipt=accessRepository(app.db).submit(validateSubmission({firstName:'Alumno',lastName:'Ficticio',birthDate:'2000-01-01',email:actor+'@example.test',filledBy:'alumno',program:'Business English',group:actor==='outside'?'Viernes · 18:00':'Mar y jue · 19:30',displayName:'Alumno F.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}),randomUUID());accessRepository(app.db).decide(receipt.id,1,'approve',admin);ids[actor]=receipt.id;app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString());users[actor]=(await studentAccounts(app.db).login(actor+'@example.test',password))!
 }
 const call=(route:string,method='GET',data?:unknown,actor='alice',key?:string,origin=base)=>fetch(base+'/api/local'+route,{method,headers:{Origin:origin,Cookie:cookies[actor]??'',...(data===undefined?{}:{'Content-Type':'application/json'}),...(key?{'Idempotency-Key':key}:{})},body:data===undefined?undefined:JSON.stringify(data)})
 const login=async(actor:string)=>{const r=await call(actor==='admin'?'/auth/login':'/student/login','POST',{email:actor+'@example.test',password},'anonymous');assert.equal(r.status,200);cookies[actor]=r.headers.getSetCookie().at(-1)!.split(';')[0]!}
 for(const actor of ['admin',...Object.keys(ids)])await login(actor)
 const snapshot=async(actor='alice')=>(await (await call('/student/badges','GET',undefined,actor)).json()) as BadgeSnapshot
 const apply=(badgeId='movie-explorer',description='Vi una película y aprendí expresiones para pedir ayuda.',key=randomUUID(),actor='alice')=>call('/student/badge-requests','POST',{badgeId,description},actor,key)
 const detail=async(id:string)=>(await (await call('/badge-requests/'+id,'GET',undefined,'admin')).json()) as {request:BadgeApplication;history:unknown[]}
 const decide=async(id:string,decision='approve',revision?:number)=>call('/badge-requests/'+id+'/'+decision,'POST',{revision:revision??(await detail(id)).request.revision,reason:'Revisión privada ficticia del aprendizaje.',confirmed:true},'admin')
 const correction=(grant:EarnedBadge,status:'active'|'revoked')=>call('/badge-grants/'+grant.id,'PATCH',{revision:grant.revision,status,reason:'Corrección privada ficticia del reconocimiento.',confirmed:true},'admin')
 const post=(grantId?:string,key=randomUUID(),actor='alice')=>call('/student/posts','POST',{title:'Celebro mi avance en inglés',body:'Una historia voluntaria para celebrar que sigo practicando.',category:'achievement',...(grantId?{badgeGrantId:grantId}:{})},actor,key)
 const seed=(actor:string,days:number[],onlyFirst=false)=>{
  const repo=challengesRepository(app.db,()=>time)
  for(const day of days){time=new Date(`2026-11-${String(day).padStart(2,'0')}T18:00:00Z`);for(const q of repo.snapshot(users[actor]!).items.slice(0,onlyFirst?1:3))repo.answer(users[actor]!,q.id,{revision:q.revision,answerIndex:0},randomUUID())}
  time=new Date('2026-11-12T18:00:00Z')
 }
 let request:BadgeApplication,grant:EarnedBadge,shared:OwnPost
 const key=randomUUID()
 await t.test('privacidad y catálogo real preservado sin concesiones ficticias',async()=>{
  assert.equal(badgeDefinitions.length,9);assert.equal(new Set(badgeDefinitions.map(b=>b.id)).size,9)
  const data=await snapshot();assert.equal(data.catalog.length,9);assert.equal(data.grants.length,0);assert.equal(data.requests.items.length,0)
  for(const actor of ['anonymous','admin'])assert.equal((await call('/student/badges','GET',undefined,actor)).status,401)
  for(const route of ['/badge-counts','/badge-requests','/badge-grants'])assert.equal((await call(route)).status,401)
  assert.equal((await call('/badge-grants','POST',{},'alice',randomUUID())).status,401)
 })
 await t.test('primera respuesta, tres días completos seguidos y cinco completos totales',async()=>{
  seed('achiever',[1,2,3,4,5]);seed('gaps',[1,3,5,7,9]);seed('revoked',[1],true)
  const achieved=await snapshot('achiever'),gaps=await snapshot('gaps'),first=await snapshot('revoked')
  assert.equal(achieved.grants.length,3);assert.equal(gaps.grants.length,2);assert.equal(first.grants.length,1)
  assert.ok(!gaps.grants.some(g=>g.badge.id==='three-consecutive'));assert.equal(achieved.grants.find(g=>g.badge.id==='three-consecutive')!.awardedAt,'2026-11-03T18:00:00.000Z');assert.equal(achieved.grants.find(g=>g.badge.id==='five-days')!.awardedAt,'2026-11-05T18:00:00.000Z')
  const count=app.db.prepare('SELECT COUNT(*) AS n FROM badge_grants').get()!.n,notices=app.db.prepare('SELECT COUNT(*) AS n FROM local_notices').get()!.n
  assert.deepEqual(await snapshot('achiever'),achieved);assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM badge_grants').get()!.n,count);assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM local_notices').get()!.n,notices)
 })
 await t.test('solicitud privada, validación, replay y bloqueo de duplicados',async()=>{
  for(const badge of ['first-answer','good-companion','unknown'])assert.equal((await apply(badge)).status,400)
  for(const description of ['','corto','x'.repeat(601),'Texto inválido con \u0000 control'])assert.equal((await apply('movie-explorer',description,randomUUID(),'limited')).status,400)
  assert.equal((await call('/student/badge-requests','POST',{badgeId:'movie-explorer',description:'Una descripción suficiente de mi aventura',studentId:ids.bob},'alice',randomUUID())).status,400)
  const r=await apply('movie-explorer',undefined,key);assert.equal(r.status,201);request=(await r.json() as {request:BadgeApplication}).request
  assert.equal((await apply('movie-explorer',undefined,key)).status,201);assert.equal((await apply('movie-explorer','Un texto diferente que sí tiene suficientes caracteres',key)).status,409);assert.equal((await apply()).status,409)
  assert.equal((await snapshot()).grants.length,0);assert.equal((await snapshot('bob')).requests.items.length,0);assert.equal((await call('/student/badge-requests/'+request.id,'GET',undefined,'bob')).status,404)
  assert.equal((await call('/student/badge-requests/'+request.id,'GET',undefined,'outside')).status,404)
 })
 await t.test('revisión con motivo privado, rechazo y nueva solicitud conservan historial',async()=>{
  assert.equal((await call('/badge-requests/'+request.id+'/approve','POST',{revision:1,reason:'Motivo suficiente para revisar'},'admin')).status,400)
  assert.equal((await decide(request.id,'reject')).status,200);assert.equal((await snapshot()).requests.items[0]!.status,'rejected');assert.equal((await detail(request.id)).history.length,2)
  const response=await apply();assert.equal(response.status,201);request=(await response.json() as {request:BadgeApplication}).request
  assert.equal((await decide(request.id)).status,200);grant=(await snapshot()).grants[0]!
  assert.equal(grant.source,'cai');assert.equal(grant.badge.id,'movie-explorer');assert.ok(!grant.condition.includes('privada'));assert.equal((await decide(request.id,'approve',1)).status,409);assert.equal((await apply()).status,409)
  assert.equal((await call('/student/posts')).status,200);assert.equal((await (await call('/student/posts')).json() as {posts:unknown[]}).posts.length,0)
 })
 await t.test('compartir exige concesión propia activa; pasa por moderación sin texto privado',async()=>{
  assert.equal((await post(grant.id,randomUUID(),'bob')).status,409)
  assert.equal((await call('/student/posts','POST',{title:'Un logro con categoría inválida',body:'Historia de muestra con texto suficiente.',category:'experience',badgeGrantId:grant.id},'alice',randomUUID())).status,400)
  const postKey=randomUUID(),r=await post(grant.id,postKey);assert.equal(r.status,201);shared=(await r.json() as {post:OwnPost}).post
  assert.equal((await post(grant.id,postKey)).status,201);assert.equal((await post(grant.id)).status,409)
  assert.equal((await (await call('/student/posts','GET',undefined,'bob')).json() as {posts:unknown[]}).posts.length,0)
  assert.equal((await call('/posts/'+shared.id+'/approve','POST',{revision:shared.revision,confirmed:true},'admin')).status,200)
  const feed=(await (await call('/student/posts','GET',undefined,'bob')).json() as {posts:OwnPost[]}).posts
  assert.equal(feed[0]!.recognition!.title,grant.badge.title);assert.deepEqual(Object.keys(feed[0]!.recognition!).sort(),['awardedAt','badgeId','title']);assert.ok(!JSON.stringify(feed).includes('privada'));assert.ok(!JSON.stringify(feed).includes('solicitud'));assert.ok(!JSON.stringify(feed).includes('source_request'));assert.ok(!JSON.stringify(feed).includes('@'))
  assert.equal((await (await call('/student/posts','GET',undefined,'outside')).json() as {posts:unknown[]}).posts.length,0)
 })
 await t.test('publicación genérica no concede nada; retirar/restituir no republica',async()=>{
  assert.equal((await post(undefined,randomUUID(),'bob')).status,201);assert.equal((await snapshot('bob')).grants.length,0)
  assert.equal((await correction(grant,'revoked')).status,200);grant=(await snapshot()).grants[0]!;assert.equal(grant.status,'revoked');assert.equal((await post(grant.id)).status,409)
  const held=(await (await call('/student/posts')).json() as {mine:OwnPost[]}).mine.find(p=>p.id===shared.id)!;assert.equal(held.status,'pendiente');assert.equal((await call('/posts/'+shared.id+'/approve','POST',{revision:held.revision,confirmed:true},'admin')).status,409)
  assert.equal((await (await call('/student/posts','GET',undefined,'bob')).json() as {posts:unknown[]}).posts.length,0)
  const at=grant.awardedAt;assert.equal((await correction(grant,'active')).status,200);grant=(await snapshot()).grants[0]!;assert.equal(grant.awardedAt,at)
  assert.equal((await (await call('/student/posts','GET',undefined,'bob')).json() as {posts:unknown[]}).posts.length,0)
  assert.equal((await call('/posts/'+shared.id+'/approve','POST',{revision:held.revision,confirmed:true},'admin')).status,200)
  const h=await (await call('/student/badges/'+grant.id)).json() as {history:unknown[]};assert.equal(h.history.length,3)
 })
 await t.test('automática retirada no reaparece al recalcular; reglas y fecha quedan congeladas',async()=>{
  const first=(await snapshot('revoked')).grants[0]!;assert.equal((await correction(first,'revoked')).status,200)
  assert.equal((await snapshot('revoked')).grants[0]!.status,'revoked');assert.equal((await snapshot('revoked')).grants.length,1)
  const old=badgeDefinitions[0]!.title;try{badgeDefinitions[0]!.title='Otro título de catálogo';assert.equal((await snapshot('achiever')).grants.find(g=>g.badge.id==='first-answer')!.badge.title,old)}finally{badgeDefinitions[0]!.title=old}
 })
 await t.test('coordinación da distinción institucional idempotente y con revisión optimista',async()=>{
  const key=randomUUID(),data={studentId:ids.bob,badgeId:'good-companion',reason:'Acompañó a sus compañeros durante una práctica ficticia.',confirmed:true}
  const r=await call('/badge-grants','POST',data,'admin',key);assert.equal(r.status,201);const award=(await r.json() as {grant:EarnedBadge}).grant
  assert.equal((await call('/badge-grants','POST',data,'admin',key)).status,201);assert.equal((await call('/badge-grants','POST',{...data,reason:'Otro motivo de reconocimiento suficiente'},'admin',key)).status,409)
  assert.equal((await call('/badge-grants','POST',data,'admin',randomUUID())).status,409);assert.equal((await call('/badge-grants','POST',{...data,badgeId:'movie-explorer'},'admin',randomUUID())).status,400)
  assert.equal((await correction(award,'revoked')).status,200);assert.equal((await correction(award,'revoked')).status,409)
  assert.equal((await call('/student/badges/'+award.id,'GET',undefined,'alice')).status,404)
 })
 await t.test('retirada propia y paginación no exponen solicitudes o razones a otra cuenta',async()=>{
  let r=await apply('music-catcher');const own=(await r.json() as {request:BadgeApplication}).request
  assert.equal((await call('/student/badge-requests/'+own.id+'/withdraw','POST',{revision:1,confirmed:true},'bob')).status,404)
  assert.equal((await call('/student/badge-requests/'+own.id+'/withdraw','POST',{revision:1,confirmed:true})).status,200);assert.equal((await decide(own.id)).status,409)
  const repo=badgesRepository(app.db)
  for(let i=0;i<23;i++){const row=repo.apply(users.bob!,{badgeId:'music-catcher',description:'Aprendí una expresión con una canción ficticia '+i},randomUUID());repo.decide(row.id,'reject',{revision:1,reason:'Reforzar el ejemplo y explicar lo aprendido.',confirmed:true},admin)}
  r=await call('/student/badge-requests','GET',undefined,'bob');const first=await r.json() as {items:BadgeApplication[];nextCursor:number};assert.equal(first.items.length,20)
  assert.equal((await (await call('/student/badge-requests?before='+first.nextCursor,'GET',undefined,'bob')).json() as {items:BadgeApplication[]}).items.length,3)
  assert.equal((await call('/badge-requests?status=rejected','GET',undefined,'admin')).status,200);assert.equal((await call('/badge-requests?status=__proto__','GET',undefined,'admin')).status,400);assert.equal((await call('/student/badge-requests?before=NaN')).status,400)
 })
 await t.test('suspensión y sesión revocada durante el cuerpo impiden conceder o solicitar',async()=>{
  const n=app.db.prepare('SELECT COUNT(*) AS n FROM badge_requests').get()!.n
  const status=await new Promise<number>((resolve,reject)=>{const req=httpRequest(base+'/api/local/student/badge-requests',{method:'POST',headers:{Origin:base,Cookie:cookies.revoked!,'Content-Type':'application/json','Idempotency-Key':randomUUID(),'Transfer-Encoding':'chunked'}},response=>{response.resume();response.on('end',()=>resolve(response.statusCode!))});req.on('error',reject);req.write('{"badgeId":"book-buddy",');setTimeout(()=>{app.db.prepare('DELETE FROM student_sessions WHERE request_id=?').run(Number(ids.revoked!.slice(4)));req.end('"description":"Una aventura ficticia que no debe registrarse"}')},30)})
  assert.equal(status,401);assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM badge_requests').get()!.n,n)
  const repo=accessRepository(app.db),student=repo.students().find(s=>s.id===ids.outside)!;repo.setStudentStatus(student.id,student.revision,'suspendido',admin)
  assert.equal((await call('/student/badges','GET',undefined,'outside')).status,401)
  assert.equal((await call('/badge-grants','POST',{studentId:ids.outside,badgeId:'good-companion',reason:'Motivo de reconocimiento suficiente.',confirmed:true},'admin',randomUUID())).status,409)
 })
 await t.test('límites por cuenta y origen no alteran concesiones ni bloquean consulta',async()=>{
  assert.equal((await call('/student/badge-requests','POST',{badgeId:'book-buddy',description:'Una descripción ficticia suficiente'},'alice',randomUUID(),'https://otro.example')).status,403)
  let limited=false;for(let i=0;i<21;i++){const response=await apply('book-buddy','corto',randomUUID(),'limited');if(response.status===429){limited=true;break}assert.equal(response.status,400)}assert.equal(limited,true);assert.equal((await call('/student/badges','GET',undefined,'limited')).status,200)
 })
 await t.test('copia separada y reinicio conservan concesión, revisión y vínculos',async()=>{
  const before=await snapshot(),copy=await backupLocalDatabase(path,join(directory,'copies'));assert.equal((await verifyLocalBackup(copy)).schema,16);await close();app=createApplication(copy,{}, {challengeClock:()=>time});await start();assert.deepEqual(await snapshot(),before)
  assert.equal((await (await call('/student/posts','GET',undefined,'bob')).json() as {posts:OwnPost[]}).posts[0]!.recognition!.badgeId,'movie-explorer')
 })
 await t.test('migración 15→16 conserva retos y sesiones; no concede por demo',async()=>{
  const copy=await backupLocalDatabase(path,join(directory,'legacy')),legacy=openDatabase(copy),attempts=legacy.prepare('SELECT * FROM challenge_attempts ORDER BY id').all(),sessions=legacy.prepare('SELECT * FROM student_sessions ORDER BY token_hash').all()
  legacy.exec('DROP INDEX publication_badge_grant; ALTER TABLE publications DROP COLUMN badge_grant_id; DROP TABLE badge_audit; DROP TABLE badge_grants; DROP TABLE badge_requests; DELETE FROM migrations WHERE version=16');legacy.close();assert.equal((await verifyLocalBackup(copy)).schema,15)
  const migrated=openDatabase(copy);try{assert.deepEqual(migrated.prepare('SELECT * FROM challenge_attempts ORDER BY id').all(),attempts);assert.deepEqual(migrated.prepare('SELECT * FROM student_sessions ORDER BY token_hash').all(),sessions);assert.equal(migrated.prepare('SELECT COUNT(*) AS n FROM badge_grants').get()!.n,0)}finally{migrated.close()}
 })
})
