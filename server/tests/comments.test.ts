import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { request as httpRequest } from 'node:http'
import { randomUUID } from 'node:crypto'
import { mkdir,mkdtemp,rm } from 'node:fs/promises'
import { dirname,join,resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { studentAccounts } from '../student-accounts.ts'
import { publications } from '../publications.ts'
import { commentsRepository } from '../comments.ts'
import { hashPassword } from '../auth.ts'
import { validateSubmission } from '../validation.ts'
import { backupLocalDatabase } from '../backup.ts'
import { verifyLocalBackup } from '../verify-backup.ts'
import { openDatabase } from '../database.ts'
import type { OwnComment,CommentReview,CommentPage,PublicComment,CommunityControls,StudentRecord,PublishedPost } from '../contracts.ts'
const password='Frase ficticia de comentarios para pruebas 2026'
const profile={firstName:'Alumno',lastName:'Ficticio',birthDate:'2000-01-01',filledBy:'alumno',program:'Business English',group:'Mar y jue · 19:30',displayName:'Alumno F.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}
test('Comentarios: revisión privada, audiencia, cursores y recuperación',async t=>{
 const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'comments-')),path=join(directory,'fixture.sqlite')
 let app=createApplication(path),base=''
 const start=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const address=app.server.address();assert.ok(address&&typeof address==='object');base='http://127.0.0.1:'+address.port}
 const close=()=>new Promise<void>((resolve,reject)=>app.server.close(error=>error?reject(error):resolve()))
 await start();t.after(async()=>{if(app.server.listening)await close();assert.equal(dirname(directory),root);assert.ok(directory.startsWith(join(root,'comments-')));await rm(directory,{recursive:true})})
 const hash=await hashPassword(password),admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(hash).lastInsertRowid)
 const ids:Record<string,string>={}
 for(const name of ['alice','bob','carol','minor','record','limited']){
  const minor=name==='minor',receipt=accessRepository(app.db).submit(validateSubmission({...profile,email:name+'@example.test',...(name==='carol'?{group:'Viernes · 18:00'}:{}),...(minor?{birthDate:(new Date().getFullYear()-15)+'-01-01',guardianConsent:true,guardian:{name:'Tutor Ficticio',relationship:'Tutor',contact:'tutor@example.test'}}:{})}),randomUUID())
  if(minor)accessRepository(app.db).decide(receipt.id,1,'consent',admin,'Referencia inicial ficticia')
  accessRepository(app.db).decide(receipt.id,minor?2:1,'approve',admin);ids[name]=receipt.id;app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString())
 }
 const cookies:Record<string,string>={}
 const call=(route:string,method='GET',data?:unknown,actor='alice',key?:string,headers:Record<string,string>={})=>fetch(base+'/api/local'+route,{method,headers:{Origin:base,Cookie:cookies[actor]??'',...(data===undefined?{}:{'Content-Type':'application/json'}),...(key?{'Idempotency-Key':key}:{}),...headers},body:data===undefined?undefined:JSON.stringify(data)})
 const login=async(actor:string)=>{const r=await call(actor==='admin'?'/auth/login':'/student/login','POST',{email:actor+'@example.test',password},'anonymous');assert.equal(r.status,200);cookies[actor]=r.headers.getSetCookie().at(-1)!.split(';')[0]!}
 for(const actor of ['admin','alice','bob','carol','minor','record','limited'])await login(actor)
 const account=await studentAccounts(app.db).login('alice@example.test',password)
 const post=publications(app.db).create(account!,{title:'Una historia para conversar',body:'Historia ficticia compartida con el grupo para probar comentarios.',category:'experience'},randomUUID())
 publications(app.db).decide(post.id,1,'approve',admin,undefined,true)
 const route='/student/posts/'+post.id+'/comments'
 const create=(body:unknown='¡Un gran avance ficticio!',key=randomUUID(),actor='alice')=>call(route,'POST',{body},actor,key)
 const publicPage=async(actor='alice',before=0)=>(await (await call(route+'?before='+before,'GET',undefined,actor)).json()) as CommentPage<PublicComment>&{commentsOpen:boolean}
 const own=async(actor='alice')=>(await (await call(route+'/mine','GET',undefined,actor)).json()) as CommentPage<OwnComment>
 const detail=async(id:string)=>(await (await call('/comments/'+id,'GET',undefined,'admin')).json()) as {comment:CommentReview;history:{action:string;reason:string|null}[]}
 const decide=async(id:string,decision:string,reason='Motivo ficticio de coordinación',revision?:number)=>call('/comments/'+id+'/'+decision,'POST',{revision:revision??(await detail(id)).comment.revision,confirmed:true,reason},'admin')
 const settings=async()=>(await (await call('/configuration','GET',undefined,'admin')).json() as {settings:CommunityControls}).settings
 const enable=async(open:boolean)=>{assert.equal((await call('/configuration','PATCH',{...await settings(),commentsOpen:open},'admin')).status,200)}
 const latestPost=()=>publications(app.db).review().find(p=>p.id===post.id)!
 const withdraw=(comment:OwnComment,actor='alice')=>call('/student/comments/'+comment.id+'/withdraw','POST',{revision:comment.revision,confirmed:true},actor)
 let first:OwnComment,second:OwnComment
 const key=randomUUID()
 await t.test('rutas privadas y controles de administración no se pueden suplantar',async()=>{
  for(const actor of ['anonymous','admin']){assert.equal((await call(route,'GET',undefined,actor)).status,401);assert.equal((await create('Hola',randomUUID(),actor)).status,401)}
  for(const path of ['/comments','/comment-counts','/comments/CMT-0001'])assert.equal((await call(path)).status,401)
  assert.equal((await call('/comments/CMT-0001/approve','POST',{revision:1,confirmed:true})).status,401)
  assert.equal((await create('Hola',randomUUID(),'carol')).status,404);assert.equal((await call(route,'GET',undefined,'carol')).status,404)
  assert.equal((await create()).status,409);await enable(true)
 })
 await t.test('valida texto, identidad elegida en servidor, origen, cursor y estado',async()=>{
  for(const body of ['',null,' '.repeat(8),'x'.repeat(401),'hola\u0000texto'])assert.equal((await create(body,randomUUID(),'limited')).status,400)
  assert.equal((await call(route,'POST',{body:'Hola',authorId:ids.bob},'alice',randomUUID())).status,400)
  assert.equal((await call(route,'POST',{body:'Hola'})).status,400)
  assert.equal((await call(route,'POST',{body:'Hola'},'alice',randomUUID(),{Origin:'https://otro.example'})).status,403)
  assert.equal((await call(route+'?before=NaN')).status,400)
  assert.equal((await call('/comments?status=__proto__','GET',undefined,'admin')).status,400)
 })
 await t.test('envío idempotente privado hasta aprobación, sin datos de expediente',async()=>{
  let response=await create('Primera palabra de ánimo ficticia',key);assert.equal(response.status,201);first=(await response.json() as {comment:OwnComment}).comment
  response=await create('Primera palabra de ánimo ficticia',key);assert.equal(response.status,201);assert.equal((await response.json() as {comment:OwnComment}).comment.id,first.id)
  assert.equal((await create('Otro texto con la misma clave',key)).status,409)
  assert.equal((await own()).items[0]!.status,'pendiente');assert.equal((await own('bob')).items.length,0)
  assert.equal((await publicPage('bob')).items.length,0)
  assert.equal((await detail(first.id)).history.length,1)
  const feed=await (await call('/student/posts')).json() as {posts:PublishedPost[]};assert.equal(feed.posts[0]!.commentCount,0)
 })
 await t.test('aprobar exige confirmación; grupo recibe solo texto e identidad pública',async()=>{
  assert.equal((await call('/comments/'+first.id+'/approve','POST',{revision:1},'admin')).status,400)
  assert.equal((await decide(first.id,'approve')).status,200)
  const item=(await publicPage('bob')).items[0]!
  assert.deepEqual(Object.keys(item).sort(),['author','body','createdAt','id']);assert.deepEqual(Object.keys(item.author).sort(),['avatarColor','displayName','id']);assert.ok(!JSON.stringify(item).includes('@'))
  assert.equal((await own()).items[0]!.status,'publicado')
  assert.equal((await decide(first.id,'reject','Motivo anterior',1)).status,409)
 })
 await t.test('devolver/rechazar conserva motivo privado e historial; retiro es definitivo',async()=>{
  assert.equal((await decide(first.id,'undo')).status,200);assert.equal((await publicPage('bob')).items.length,0)
  assert.equal((await decide(first.id,'reject','No se debe publicar esta referencia ficticia')).status,200)
  assert.ok((await own()).items[0]!.reason!.includes('referencia ficticia'));assert.equal((await publicPage('bob')).items.length,0)
  assert.equal((await decide(first.id,'undo')).status,200);assert.equal((await decide(first.id,'approve')).status,200)
  const current=(await own()).items.find(c=>c.id===first.id)!
  const foreign=await withdraw(current,'bob'),unknown=await call('/student/comments/CMT-999999/withdraw','POST',{revision:1,confirmed:true},'bob')
  assert.equal(foreign.status,404);assert.equal(unknown.status,404);assert.deepEqual(await foreign.json(),await unknown.json())
  assert.equal((await withdraw(current)).status,200);assert.equal((await decide(first.id,'undo')).status,409)
  assert.ok((await detail(first.id)).history.some(h=>h.action==='comment.withdrawn'))
 })
 await t.test('pausa general conserva conversación y reintento; retirada propia sigue permitida',async()=>{
  const r=await create('Comentario de otro alumno',randomUUID(),'bob');second=(await r.json() as {comment:OwnComment}).comment;assert.equal((await decide(second.id,'approve')).status,200)
  await enable(false);assert.equal((await create()).status,409);assert.equal((await publicPage()).items.length,1)
  assert.equal((await create('Primera palabra de ánimo ficticia',key)).status,201)
  assert.equal((await withdraw((await own('bob')).items[0]!,'bob')).status,200);await enable(true)
 })
 await t.test('pausa por historia usa revisión, conserva lectura y no bloquea revisar pendientes',async()=>{
  const r=await create('Comentario pendiente al cerrar',randomUUID(),'bob');second=(await r.json() as {comment:OwnComment}).comment
  let current=latestPost()
  assert.equal((await call('/posts/'+post.id+'/comments','PATCH',{revision:current.revision,open:false},'admin')).status,200)
  assert.equal((await call('/posts/'+post.id+'/comments','PATCH',{revision:current.revision,open:true},'admin')).status,409)
  assert.equal((await publicPage()).commentsOpen,false);assert.equal((await create()).status,409)
  assert.equal((await decide(second.id,'approve')).status,200);assert.equal((await publicPage()).items.length,1)
  current=latestPost();assert.equal((await call('/posts/'+post.id+'/comments','PATCH',{revision:current.revision,open:true},'admin')).status,200)
 })
 await t.test('paginación estable de 20, sin duplicar cuando llega otro comentario',async()=>{
  const user=await studentAccounts(app.db).login('bob@example.test',password),service=commentsRepository(app.db)
  for(let i=0;i<23;i++){const item=service.create(user!,post.id,{body:'Comentario paginado ficticio '+i},randomUUID());service.decide(item.id,'approve',{revision:1,confirmed:true},admin)}
  const firstPage=await publicPage();assert.equal(firstPage.items.length,20);assert.ok(firstPage.nextCursor)
  const added=service.create(user!,post.id,{body:'Nuevo mientras se consultaba otra página'},randomUUID());service.decide(added.id,'approve',{revision:1,confirmed:true},admin)
  const next=await publicPage('alice',firstPage.nextCursor!);assert.ok(next.items.length>0);assert.equal(new Set([...firstPage.items,...next.items].map(c=>c.id)).size,firstPage.items.length+next.items.length)
  const privatePage=await own('bob');assert.equal(privatePage.items.length,20);assert.ok(privatePage.nextCursor)
  const queue=await (await call('/comments?status=publicado','GET',undefined,'admin')).json() as CommentPage<CommentReview>;assert.equal(queue.items.length,20);assert.ok(queue.nextCursor)
 })
 await t.test('cambio de grupo revoca sesión y retiene comentarios para revisión aunque vuelva',async()=>{
  const r=await create('Comentario de alumno menor ficticio',randomUUID(),'minor'),comment=(await r.json() as {comment:OwnComment}).comment;await decide(comment.id,'approve')
  const repo=accessRepository(app.db);let student=repo.students().find(s=>s.id===ids.minor)!
  repo.assignStudent(student.id,student.revision,'Business English','Viernes · 18:00',true,admin)
  assert.equal((await call(route,'GET',undefined,'minor')).status,401);assert.equal((await detail(comment.id)).comment.status,'pendiente')
  student=repo.students().find(s=>s.id===ids.minor)!;repo.assignStudent(student.id,student.revision,profile.program,profile.group,true,admin);await login('minor')
  assert.equal((await detail(comment.id)).comment.status,'pendiente');assert.ok((await detail(comment.id)).history.some(h=>h.action==='comment.held'))
 })
 await t.test('corrección adulto→menor vuelve a revisar comentarios y revoca sesión',async()=>{
  const r=await create('Comentario anterior a corregir edad',randomUUID(),'record'),comment=(await r.json() as {comment:OwnComment}).comment;await decide(comment.id,'approve')
  const record=(await (await call('/students/'+ids.record+'/record','GET',undefined,'admin')).json() as {record:StudentRecord}).record
  const body={revision:record.revision,firstName:record.firstName,lastName:record.lastName,birthDate:(new Date().getFullYear()-15)+'-01-01',studentCode:record.studentCode,guardian:{name:'Tutor Ficticio',relationship:'Tutor',contact:'tutor@example.test'},reason:'Corrección ficticia de edad',consentReference:'Referencia nueva ficticia de comentarios',currentPassword:password,confirmed:true}
  assert.equal((await call('/students/'+ids.record+'/record','PATCH',body,'admin',randomUUID())).status,200)
  assert.equal((await detail(comment.id)).comment.status,'pendiente');assert.equal((await call(route,'GET',undefined,'record')).status,401)
 })
 await t.test('revocación al recibir el cuerpo impide enviar o moderar',async()=>{
  const streamed=async(route:string,actor:string,first:string,last:string,revoke:()=>void)=>{
   const received=once(app.server,'request')
   return new Promise<number>((resolve,reject)=>{const request=httpRequest(base+'/api/local'+route,{method:'POST',headers:{Origin:base,Cookie:cookies[actor]!, 'Content-Type':'application/json','Idempotency-Key':randomUUID()}},response=>{response.resume();resolve(response.statusCode!)});request.on('error',reject);request.write(first);void received.then(()=>{revoke();request.end(last)})})
  }
  const count=Number(app.db.prepare('SELECT COUNT(*) AS n FROM post_comments').get()!.n)
  assert.equal(await streamed(route,'minor','{"body":','"Texto que no debe guardarse"}',()=>{const repo=accessRepository(app.db),student=repo.students().find(s=>s.id===ids.minor)!;repo.setStudentStatus(student.id,student.revision,'suspendido',admin)}),401)
  assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM post_comments').get()!.n,count)
  const r=await create('Pendiente para probar revocación administrativa'),comment=(await r.json() as {comment:OwnComment}).comment
  assert.equal(await streamed('/comments/'+comment.id+'/approve','admin','{"revision":1,','"confirmed":true}',()=>{app.db.prepare('DELETE FROM sessions').run()}),401);await login('admin')
  assert.equal((await detail(comment.id)).comment.status,'pendiente')
 })
 await t.test('suspensión excluye comentarios públicos y limita intentos por cuenta',async()=>{
  const repo=accessRepository(app.db),student=repo.students().find(s=>s.id===ids.bob)!;repo.setStudentStatus(student.id,student.revision,'suspendido',admin)
  assert.equal((await publicPage()).items.length,0)
  let limited=false;for(let i=0;i<21;i++){const response=await create('',randomUUID(),'limited');if(response.status===429){limited=true;break}assert.equal(response.status,400)}assert.equal(limited,true)
 })
 await t.test('copia separada/reinicio conservan comentarios privados, decisiones y reintentos',async()=>{
  const before=await own(),copy=await backupLocalDatabase(path,join(directory,'copies'));assert.equal((await verifyLocalBackup(copy)).schema,15)
  await close();app=createApplication(copy);await start();assert.deepEqual(await own(),before);assert.equal((await create('Primera palabra de ánimo ficticia',key)).status,201)
  assert.ok((await detail(first.id)).history.length>3)
 })
 await t.test('migración 13→14 conserva reacciones/sesiones e inicia comentarios cerrados',async()=>{
  const copy=await backupLocalDatabase(path,join(directory,'legacy')),legacy=openDatabase(copy)
  const sessions=legacy.prepare('SELECT * FROM student_sessions ORDER BY token_hash').all(),reactions=legacy.prepare('SELECT * FROM post_reactions').all()
  legacy.exec('DROP TABLE challenge_attempts; DROP TABLE daily_challenges; DROP TABLE challenge_bank; DROP TABLE challenge_controls; DELETE FROM migrations WHERE version=15; DROP TABLE comment_audit; DROP TABLE post_comments; ALTER TABLE community_controls DROP COLUMN comments_open; ALTER TABLE publications DROP COLUMN comments_open; DELETE FROM migrations WHERE version=14');legacy.close()
  assert.equal((await verifyLocalBackup(copy)).schema,13);const migrated=openDatabase(copy)
  try{assert.deepEqual(migrated.prepare('SELECT * FROM student_sessions ORDER BY token_hash').all(),sessions);assert.deepEqual(migrated.prepare('SELECT * FROM post_reactions').all(),reactions);assert.equal(migrated.prepare('SELECT COUNT(*) AS n FROM post_comments').get()!.n,0);assert.equal(migrated.prepare('SELECT comments_open FROM community_controls').get()!.comments_open,0)}finally{migrated.close()}
 })
 await t.test('ocultar la historia bloquea conversaciones y altas; autor aún puede retirar su envío',async()=>{
  const pending=(await own()).items.find(item=>item.status==='pendiente')!
  publications(app.db).withdraw(account!,post.id,latestPost().revision)
  assert.equal((await call(route)).status,404);assert.equal((await call(route+'/mine')).status,404);assert.equal((await create()).status,404)
  assert.equal((await withdraw(pending)).status,200)
 })
})

