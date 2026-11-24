import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { request as httpRequest,type IncomingMessage } from 'node:http'
import { createHash,randomUUID } from 'node:crypto'
import { mkdir,mkdtemp } from 'node:fs/promises'
import { resolve,join } from 'node:path'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { studentAccounts } from '../student-accounts.ts'
import { validateSubmission } from '../validation.ts'
import { hashPassword } from '../auth.ts'
import { googleAccounts } from '../google-auth.ts'
import { communityModeration } from '../community-moderation.ts'
import { migrateDatabase } from '../database.ts'
import { backupLocalDatabase } from '../backup.ts'
import { verifyLocalBackup } from '../verify-backup.ts'
import type { CommunityModerationPost,CommunityModerationComment,StudentRestriction,OwnPost,OwnComment } from '../contracts.ts'

test('Moderación de comunidad: permisos, retiro y suspensiones temporales/permanentes',async t=>{
 const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'moderation-')),path=join(directory,'fixture.sqlite')
 let app=createApplication(path),base=''
 const start=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');base='http://127.0.0.1:'+(app.server.address() as {port:number}).port}
 const close=()=>new Promise<void>(r=>app.server.close(()=>r()))
 await start();t.after(async()=>{if(app.server.listening)await close()})
 const password='abcdefgh',adminPassword='Frase administrativa de moderación 2026',hash=await hashPassword(password),adminHash=await hashPassword(adminPassword)
 const admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(adminHash).lastInsertRowid)
 const peer=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('peer@example.test','Coordinación dos',?,'admin')").run(adminHash).lastInsertRowid)
 const ids:Record<string,string>={},cookies:Record<string,string>={}
 for(const name of ['alice','bob','carol']){
  const repo=accessRepository(app.db),receipt=repo.submit(validateSubmission({className:'Inglés',firstName:name,lastName:'Prueba',birthDate:'2000-01-01',email:name+'@example.test',displayName:name+' P.',avatarColor:'#1f56d6',visibility:'privado',message:'',acceptRules:true,acceptPrivacy:true}),randomUUID());ids[name]=receipt.id;repo.decide(receipt.id,1,'approve',admin)
  if(name!=='carol')app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString())
 }
 app.db.exec('UPDATE community_controls SET comments_open=1')
 const call=(route:string,method='GET',data?:unknown,actor='admin',key=randomUUID(),origin=base)=>fetch(base+'/api/local'+route,{method,headers:{Origin:origin,Cookie:cookies[actor]??'','Content-Type':'application/json','Idempotency-Key':key},body:data===undefined?undefined:JSON.stringify(data)})
 const json=async<T>(route:string,actor='admin'):Promise<T>=>{const r=await call(route,'GET',undefined,actor);assert.equal(r.status,200,route);return await r.json() as T}
 const login=async(name:string)=>{const r=await call(name==='admin'||name==='peer'?'/auth/login':'/student/login','POST',{email:name+'@example.test',password:name==='admin'||name==='peer'?adminPassword:password},'anonymous');if(r.ok)cookies[name]=r.headers.getSetCookie().at(-1)!.split(';')[0]!;return r}
 for(const name of ['admin','peer','alice','bob'])assert.equal((await login(name)).status,200)
 const r=await call('/student/posts','POST',{title:'Conversación para moderar',body:'Un espacio de prueba para comentarios y convivencia.',category:'experience'},'bob');assert.equal(r.status,201)
 const post=(await r.json() as {post:OwnPost}).post
 assert.equal((await call('/posts/'+post.id+'/approve','POST',{revision:post.revision,confirmed:true})).status,200)
 const makeComment=async(author='alice')=>{const r=await call('/student/posts/'+post.id+'/comments','POST',{body:'Comentario ficticio de '+author},author);assert.equal(r.status,201);const comment=(await r.json() as {comment:OwnComment}).comment;assert.equal((await call('/comments/'+comment.id+'/approve','POST',{revision:comment.revision,confirmed:true})).status,200);return comment.id}
 const first=await makeComment(),second=await makeComment(),bobComment=await makeComment('bob')
 const list=()=>json<{items:CommunityModerationComment[]}>('/community/posts/'+post.id+'/comments')
 const entry=async(id:string)=>(await list()).items.find(c=>c.id===id)!
 const action=(comment:CommunityModerationComment,overrides:Record<string,unknown>={})=>({studentRevision:comment.moderation.studentRevision,commentRevision:comment.revision,removeComment:true,suspend:false,durationDays:7,reason:'Contenido inadecuado para la convivencia',confirmed:true,...overrides})
 const route=(commentId:string,student=ids.alice)=>'/community/students/'+student+'/comments/'+commentId+'/moderate'
 const restrictions=(view='active')=>json<{items:StudentRestriction[]}>('/community/restrictions?view='+view)
 let temporary:StudentRestriction
 await t.test('migración21→22 conserva cuentas, publicaciones y comentarios',()=>{
  const before={requests:app.db.prepare('SELECT * FROM requests').all(),accounts:app.db.prepare('SELECT * FROM student_accounts').all(),posts:app.db.prepare('SELECT * FROM publications').all(),comments:app.db.prepare('SELECT * FROM post_comments').all()}
  app.db.exec('DROP TABLE community_moderation_actions; DROP TABLE student_restrictions; DELETE FROM migrations WHERE version=22;')
  migrateDatabase(app.db);migrateDatabase(app.db)
  for(const [name,rows] of Object.entries(before)){const table=name==='accounts'?'student_accounts':name==='posts'?'publications':name==='comments'?'post_comments':name;assert.deepEqual(app.db.prepare('SELECT * FROM '+table).all(),rows)}
  assert.deepEqual(app.db.prepare('PRAGMA foreign_key_check').all(),[])
 })
 await t.test('vista propia de administración sin suplantar alumnos ni exponer herramientas a visitantes',async()=>{
  for(const actor of ['anonymous','alice','bob'])for(const path of ['/community/posts','/community/restrictions','/community/posts/'+post.id+'/comments'])assert.equal((await call(path,'GET',undefined,actor)).status,401)
  const feed=await json<{items:CommunityModerationPost[]}>('/community/posts');assert.equal(feed.items[0]!.id,post.id);assert.equal(feed.items[0]!.moderation!.studentId,ids.bob)
  assert.equal((await list()).items.length,3)
  const regular=await json<{posts:unknown[]}>('/student/posts','bob');assert.ok(!JSON.stringify(regular).includes('studentRevision'))
 })
 await t.test('valida origen, autor, revisiones, motivo, confirmación y duración sin escribir',async()=>{
  const comment=await entry(first),data=action(comment)
  assert.equal((await call(route(first),'POST',data,'alice')).status,401)
  assert.equal((await call(route(first),'POST',data,'admin',randomUUID(),'https://otro.example')).status,403)
  for(const extra of [{confirmed:false},{reason:'x'},{adminId:99},{studentRevision:99,suspend:true},{commentRevision:99},{suspend:true,durationDays:0},{suspend:true,durationDays:1.5},{suspend:true,durationDays:366}])assert.ok([400,409].includes((await call(route(first),'POST',{...data,...extra})).status))
  assert.equal((await call(route(first,ids.bob),'POST',data)).status,404)
  assert.equal((await list()).items.length,3);assert.equal((await restrictions()).items.length,0)
 })
 await t.test('retirar comentario es independiente, definitivo e idempotente',async()=>{
  const comment=await entry(first),key=randomUUID(),data=action(comment)
  assert.equal((await call(route(first),'POST',data,'admin',key)).status,200);assert.equal((await call(route(first),'POST',data,'admin',key)).status,200)
  assert.equal((await call(route(first),'POST',{...data,reason:'Otro motivo distinto'},'admin',key)).status,409)
  assert.equal((await list()).items.length,2);assert.equal((await restrictions()).items.length,0)
  assert.equal((await call('/student/me','GET',undefined,'alice')).status,200)
  assert.equal(app.db.prepare("SELECT count(*) AS n FROM comment_audit WHERE comment_id=? AND action='comment.withdraw'").get(Number(first.slice(4)))!.n,1)
 })
 await t.test('retirar y suspender siete días es una sola medida; revoca sesiones, Google y recuperación',async()=>{
  assert.equal((await call('/recovery/request','POST',{email:'alice@example.test'},'alice')).status,202)
  const notice=app.db.prepare("SELECT id FROM local_notices WHERE kind='recovery'").get()!
  const reset=await call('/notices/'+notice.id+'/preview','POST',{});assert.equal(reset.status,200)
  app.db.prepare('INSERT INTO google_identities(subject,email,request_id,created_at) VALUES (?,?,?,?)').run('google-alice','alice@example.test',Number(ids.alice!.slice(4)),new Date().toISOString())
  app.db.prepare('INSERT INTO google_sessions VALUES (?,?,?)').run(createHash('sha256').update('fixture-google-token').digest('hex'),'google-alice',Date.now()+60000)
  const comment=await entry(second),key=randomUUID(),data=action(comment,{suspend:true,durationDays:7})
  const reply=await call(route(second),'POST',data,'admin',key);assert.equal(reply.status,200);temporary=(await reply.json() as {restriction:StudentRestriction}).restriction
  assert.equal(temporary.status,'active');assert.ok(Math.abs(Date.parse(temporary.expiresAt!)-Date.now()-7*86400000)<3000)
  assert.equal((await list()).items.length,1);assert.equal((await call('/student/me','GET',undefined,'alice')).status,401);assert.equal((await login('alice')).status,403)
  assert.equal(app.db.prepare('SELECT count(*) AS n FROM google_sessions').get()!.n,0);assert.equal(studentAccounts(app.db).forGoogle('google-alice'),null);
  app.db.prepare('INSERT INTO google_sessions VALUES (?,?,?)').run(createHash('sha256').update('a'.repeat(64)).digest('hex'),'google-alice',Date.now()+60000)
  const google=googleAccounts(app.db,{clientId:'123-test.apps.googleusercontent.com'}),request={headers:{cookie:'cai_google_session='+'a'.repeat(64)}} as IncomingMessage
  assert.equal(google.state(request).status,'suspended');assert.equal(app.db.prepare('SELECT count(*) AS n FROM password_resets').get()!.n,0)
  assert.equal((await call('/auth/session')).status,200)
 })
 await t.test('vencer no restaura sesiones ni comentarios; sí permite nuevo acceso si inscripción activa',async()=>{
  app.db.prepare('UPDATE student_restrictions SET expires_at=? WHERE id=?').run(Date.now()-1,temporary.id)
  assert.equal((await restrictions()).items.length,0);assert.equal((await restrictions('history')).items[0]!.status,'expired')
  assert.equal((await call('/student/me','GET',undefined,'alice')).status,401);assert.equal((await login('alice')).status,200)
  assert.equal((await list()).items.length,1);assert.equal(app.db.prepare('SELECT status FROM post_comments WHERE id=?').get(Number(second.slice(4)))!.status,'retirado')
 })
 await t.test('permanente y revocación explícita; la suspensión manual no se levanta por accidente',async()=>{
  const student=accessRepository(app.db).students().find(s=>s.id===ids.alice)!
  const data={studentRevision:student.revision,removeComment:false,suspend:true,durationDays:null,reason:'Reincidencia ficticia en la convivencia',confirmed:true}
  const key=randomUUID(),endpoint='/community/students/'+student.id+'/moderate',r=await call(endpoint,'POST',data,'admin',key);assert.equal(r.status,200)
  const restriction=(await r.json() as {restriction:StudentRestriction}).restriction;assert.equal(restriction.expiresAt,null);assert.equal((await login('alice')).status,403)
  const now=accessRepository(app.db).students().find(s=>s.id===ids.alice)!;accessRepository(app.db).setStudentStatus(now.id,now.revision,'suspendido',admin)
  assert.equal((await call('/community/restrictions/'+restriction.id+'/revoke','POST',{revision:restriction.revision,reason:'Medida revisada por coordinación',confirmed:true})).status,200)
  assert.equal((await login('alice')).status,401);assert.equal(accessRepository(app.db).students().find(s=>s.id===ids.alice)!.status,'suspendido')
  assert.equal((await call(endpoint,'POST',data,'admin',key)).status,200);assert.equal((await restrictions()).items.length,0)
 })
 await t.test('un conflicto al suspender no retira parcialmente otro comentario',async()=>{
  const comment=await entry(bobComment),data=action(comment,{suspend:true,durationDays:3}),endpoint='/community/students/'+ids.bob+'/moderate'
  assert.equal((await call(endpoint,'POST',{...data,commentRevision:undefined,removeComment:false})).status,200)
  const current=await entry(bobComment),r=await call(route(bobComment,ids.bob),'POST',action(current,{suspend:true}));assert.equal(r.status,409)
  assert.ok((await list()).items.some(c=>c.id===bobComment))
 })
 await t.test('una sesión administrativa revocada durante el cuerpo no aplica medidas',async()=>{
  const comment=await entry(bobComment),data=action(comment),url=route(bobComment,ids.bob)
  const status=await new Promise<number>((resolve,reject)=>{
   const req=httpRequest(base+'/api/local'+url,{method:'POST',headers:{Origin:base,Cookie:cookies.peer!,'Content-Type':'application/json','Idempotency-Key':randomUUID(),'Transfer-Encoding':'chunked'}},res=>{res.resume();res.on('end',()=>resolve(res.statusCode!))});req.on('error',reject)
   req.write('{');setTimeout(()=>{app.db.prepare('DELETE FROM sessions WHERE user_id=?').run(peer);req.end(JSON.stringify(data).slice(1))},30)
  });assert.equal(status,401);assert.ok((await list()).items.some(c=>c.id===bobComment))
 })
 await t.test('suspender antes de activar cancela invitación; levantar permite otra nueva',async()=>{
  const accounts=studentAccounts(app.db),get=()=>accessRepository(app.db).students().find(s=>s.id===ids.carol)!
  const invitation=accounts.invite(ids.carol!,get().revision,admin),token=new URLSearchParams(invitation.path.split('#')[1]).get('token')!
  const response=await call('/community/students/'+ids.carol+'/moderate','POST',{studentRevision:get().revision,removeComment:false,suspend:true,durationDays:1,reason:'Medida ficticia anterior a activar',confirmed:true})
  assert.equal(response.status,200);const item=(await response.json() as {restriction:StudentRestriction}).restriction
  assert.throws(()=>accounts.invite(ids.carol!,get().revision,admin));assert.equal((await call('/activation','POST',{token,password,confirm:password},'anonymous')).status,400)
  assert.equal((await call('/community/restrictions/'+item.id+'/revoke','POST',{revision:item.revision,reason:'Revisión ficticia de la medida',confirmed:true})).status,200)
  assert.ok(accounts.invite(ids.carol!,get().revision,admin).path);assert.equal((await call('/activation','POST',{token,password,confirm:password},'anonymous')).status,400)
 })
 await t.test('paginación ignora autores inactivos antes del límite y no pierde comentarios',()=>{
  const fixture=createApplication(join(directory,'pagination.sqlite'))
  try{
   const now=new Date().toISOString(),actor=Number(fixture.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('page@example.test','QA',?,'admin')").run(adminHash).lastInsertRowid),repo=accessRepository(fixture.db)
   const student=repo.submit(validateSubmission({className:'Inglés',firstName:'Pagination',lastName:'Prueba',birthDate:'2000-01-01',email:'page-student@example.test',displayName:'Prueba P.',avatarColor:'#1f56d6',visibility:'privado',message:'',acceptRules:true,acceptPrivacy:true}),randomUUID());repo.decide(student.id,1,'approve',actor)
   const owner=Number(student.id.slice(4)),post=fixture.db.prepare("INSERT INTO publications(admin_author_id,author_id,idempotency_key,title,body,category,program,group_name,status,audience,created_at,published_at) VALUES (?,NULL,?,'Historia institucional','Historia ficticia para paginación.','experience','','','publicada','community',?,?)")
   for(let n=0;n<24;n++)post.run(actor,randomUUID(),now,now)
   for(let n=0;n<25;n++)fixture.db.prepare("INSERT INTO publications(author_id,idempotency_key,title,body,category,program,group_name,status,audience,created_at,published_at) VALUES (?,?,'Contenido oculto','Publicación ficticia de cuenta manualmente suspendida.','experience','','','publicada','community',?,?)").run(owner,randomUUID(),now,now)
   fixture.db.prepare("UPDATE students SET status='suspendido' WHERE request_id=?").run(owner)
   const moderation=communityModeration(fixture.db),first=moderation.feed(),second=moderation.feed(first.nextCursor!)
   assert.equal(first.items.length,20);assert.equal(second.items.length,4);assert.equal(second.nextCursor,null);assert.equal(new Set([...first.items,...second.items].map(p=>p.id)).size,24)
   fixture.db.prepare("UPDATE students SET status='activo' WHERE request_id=?").run(owner)
   for(let n=0;n<25;n++)fixture.db.prepare("INSERT INTO post_comments(publication_id,author_id,request_key,body,created_at,status) VALUES (1,?,?,? ,?,'publicado')").run(owner,randomUUID(),'Comentario de prueba '+n,now)
   const comments=moderation.comments('PUB-0001'),rest=moderation.comments('PUB-0001',comments.nextCursor!)
   assert.equal(comments.items.length,20);assert.equal(rest.items.length,5);assert.equal(rest.nextCursor,null);assert.equal(new Set([...comments.items,...rest.items].map(c=>c.id)).size,25)
  }finally{fixture.db.close()}
 })
 await t.test('respaldo/reinicio conservan suspensiones, historial y rechazo del acceso',async()=>{
  const copy=await backupLocalDatabase(path,join(directory,'copies'));assert.equal((await verifyLocalBackup(copy)).schema,22)
  const before=await restrictions('history');await close();app=createApplication(path);await start()
  assert.deepEqual(await restrictions('history'),before);assert.equal((await login('bob')).status,403);assert.equal((await list()).items.length,1)
 })
})
