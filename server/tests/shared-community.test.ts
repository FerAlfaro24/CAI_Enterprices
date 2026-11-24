import type { GroupMember,PublishedPost,OwnPost,LearningAchievement,LearningPage,StudentUser,ChallengeSnapshot } from '../contracts.ts'
import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mkdtemp,mkdir } from 'node:fs/promises'
import { resolve,join } from 'node:path'
import sharp from 'sharp'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { validateSubmission } from '../validation.ts'
import { hashPassword } from '../auth.ts'
import { migrateDatabase } from '../database.ts'
import { backupLocalDatabase } from '../backup.ts'
import { verifyLocalBackup } from '../verify-backup.ts'

test('Comunidad compartida: clases, privacidad, migración y retos comunes',async t=>{
 const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'shared-community-')),path=join(directory,'fixture.sqlite')
 let clock=new Date('2026-11-24T18:00:00Z')
 const options={challengeClock:()=>clock}
 let app=createApplication(path,{},options),base=''
 const start=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');base='http://127.0.0.1:'+(app.server.address() as {port:number}).port}
 const close=()=>new Promise<void>(r=>app.server.close(()=>r()))
 await start();t.after(async()=>{if(app.server.listening)await close()})
 const password='abcdefgh',hash=await hashPassword(password)
 const admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(await hashPassword('Contraseña ficticia administrativa 2026')).lastInsertRowid)
 const ids:Record<string,string>={},cookies:Record<string,string>={}
 for(const [name,className,birthDate,approved,activated] of [['alice','Inglés','2000-01-01',true,true],['bob','Francés','2000-01-01',true,true],['newcomer','Español','2016-01-01',true,false],['pending','Español','2000-01-01',false,false]] as const){
  const repo=accessRepository(app.db),receipt=repo.submit(validateSubmission({className,firstName:name,lastName:'Prueba',birthDate,email:name+'@example.test',displayName:name+' P.',avatarColor:'#1f56d6',visibility:'privado',message:'',acceptRules:true,acceptPrivacy:true}),randomUUID());ids[name]=receipt.id
  if(approved)repo.decide(receipt.id,1,'approve',admin)
  if(activated)app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString())
 }
 const call=(route:string,method='GET',data?:unknown,actor='alice',key=randomUUID())=>fetch(base+'/api/local'+route,{method,headers:{Origin:base,Cookie:cookies[actor]??'','Content-Type':'application/json','Idempotency-Key':key},body:data===undefined?undefined:JSON.stringify(data)})
 const json=async<T>(route:string,actor='alice'):Promise<T>=>{const r=await call(route,'GET',undefined,actor);assert.equal(r.status,200,route);return await r.json() as T}
 for(const name of ['alice','bob','admin']){const r=await call(name==='admin'?'/auth/login':'/student/login','POST',{email:name+'@example.test',password:name==='admin'?'Contraseña ficticia administrativa 2026':password},'anonymous');assert.equal(r.status,200);cookies[name]=r.headers.getSetCookie().at(-1)!.split(';')[0]!}
 let postId='',privateImage='',achievementId=0
 await t.test('compañeros de tres clases, fecha real y recién aprobado sin cuenta; sin datos privados',async()=>{
  const a=(await json<{members:GroupMember[]}>('/student/group')).members,b=(await json<{members:GroupMember[]}>('/student/group','bob')).members
  assert.deepEqual(a,b);assert.equal(a.length,3);assert.ok(a.some((m:{displayName:string})=>m.displayName==='newcomer P.'))
  for(const item of a){assert.deepEqual(Object.keys(item).sort(),['avatarColor','displayName','id','joinedAt']);assert.ok(Date.parse(item.joinedAt!));assert.ok(!item.id.startsWith('CAI-'))}
  assert.ok(!JSON.stringify(a).includes('@example.test'));assert.equal((await call('/student/group','GET',undefined,'anonymous')).status,401)
 })
 await t.test('publicación de una clase visible y comentable por otra solo después de aprobar',async()=>{
  const r=await call('/student/posts','POST',{title:'Mi experiencia en inglés',body:'Aprendí una forma distinta de saludar a mis compañeros.',category:'experience'});assert.equal(r.status,201)
  const post=(await r.json() as {post:OwnPost}).post;postId=post.id;assert.equal((await json<{posts:PublishedPost[]}>('/student/posts','bob')).posts.length,0)
  assert.equal((await call('/posts/'+postId+'/approve','POST',{revision:post.revision,confirmed:true},'admin')).status,200)
  assert.ok((await json<{posts:PublishedPost[]}>('/student/posts','bob')).posts.some((p:{id:string})=>p.id===postId))
  app.db.prepare('UPDATE community_controls SET comments_open=1').run()
  assert.equal((await call('/student/posts/'+postId+'/comments','POST',{body:'¡También lo practicaré!'},'bob')).status,201)
  assert.equal((await json<{items:unknown[]}>('/student/posts/'+postId+'/comments')).items.length,0,'Los comentarios conservan revisión hasta F3')
  const profileId=(await json<{user:StudentUser}>('/student/me')).user.publicId
  assert.equal((await call('/student/members/'+profileId,'GET',undefined,'bob')).status,200)
 })
 await t.test('borradores e imágenes personales permanecen privados entre clases',async()=>{
  const bytes=await sharp({create:{width:24,height:16,channels:3,background:'#1f56d6'}}).png().toBuffer()
  const r=await call('/student/achievements','POST',{category:'reading',title:'Lectura privada',practice:'Esta práctica personal no debe aparecer en otra cuenta.',expression:'hello',example:'Hello to my friends.',state:'completed',images:[{data:'data:image/png;base64,'+bytes.toString('base64')}]});assert.equal(r.status,201)
  const item=(await r.json() as {item:LearningAchievement}).item;achievementId=item.id;privateImage=item.images[0]!.imagePath
  assert.equal((await fetch(base+privateImage,{headers:{Cookie:cookies.alice}})).status,200)
  assert.equal((await fetch(base+privateImage,{headers:{Cookie:cookies.bob}})).status,404)
  assert.equal((await json<LearningPage>('/student/achievements','bob')).items.length,0)
 })
 await t.test('mismas preguntas globales, sin grupo, con respuesta y puntos individuales',async()=>{
  const a=await json<ChallengeSnapshot>('/student/challenges'),b=await json<ChallengeSnapshot>('/student/challenges','bob');assert.deepEqual(a.items,b.items);assert.equal(a.needsGroup,false);assert.equal(a.items.length,3)
  const q=a.items[0]!,index=JSON.parse(String(app.db.prepare('SELECT content_json FROM daily_challenges WHERE id=?').get(Number(q.id.slice(2)))!.content_json)).correctIndex
  assert.equal((await call('/student/challenges/'+q.id+'/answer','POST',{revision:q.revision,answerIndex:index})).status,200)
  assert.equal((await json<ChallengeSnapshot>('/student/challenges','bob')).progress.answered,0)
  assert.equal((await call('/student/challenges/'+q.id+'/answer','POST',{revision:q.revision,answerIndex:index},'bob')).status,200)
  assert.equal((await call('/student/challenges/'+q.id+'/answer','POST',{revision:q.revision,answerIndex:index})).status,409)
  assert.equal((await json<ChallengeSnapshot>('/student/challenges')).progress.correct,1)
 })
 await t.test('migración20→21 preserva IDs, credenciales, imágenes privadas, comentarios, secuencia y respuestas anteriores',async()=>{
  // Reconstruir el contrato de versión20 en una fixture para ejercitar la migración real.
  const oldDefinition=String(app.db.prepare("SELECT sql FROM sqlite_schema WHERE name='publications'").get()!.sql)
  assert.ok(oldDefinition.includes("AND kind='story'"))
  const assigned=app.db.prepare('SELECT assignment_id FROM challenge_attempts WHERE student_id=? AND slot=0').get(Number(ids.alice!.slice(4)))!
  const legacyAssignment=app.db.prepare("INSERT INTO daily_challenges(day,program,group_name,slot,bank_id,content_json,state,source) SELECT day,'Programa anterior','Grupo anterior',slot,bank_id,content_json,state,source FROM daily_challenges WHERE id=?").run(Number(assigned.assignment_id))
  app.db.prepare('UPDATE challenge_attempts SET assignment_id=? WHERE student_id=? AND slot=0').run(Number(legacyAssignment.lastInsertRowid),Number(ids.alice!.slice(4)))
  const before={requests:app.db.prepare('SELECT * FROM requests').all(),accounts:app.db.prepare('SELECT * FROM student_accounts').all(),comments:app.db.prepare('SELECT * FROM post_comments').all(),attempts:app.db.prepare('SELECT * FROM challenge_attempts').all(),images:app.db.prepare('SELECT * FROM learning_images').all()}
  app.db.exec("UPDATE publications SET audience='group' WHERE admin_author_id IS NULL; DROP TABLE community_moderation_actions; DROP TABLE student_restrictions; DELETE FROM migrations WHERE version=22; DELETE FROM migrations WHERE version=21;")
  const objects=app.db.prepare("SELECT sql FROM sqlite_schema WHERE tbl_name='publications' AND type IN ('index','trigger') AND sql IS NOT NULL").all()
  const legacy=oldDefinition.replace(/^CREATE TABLE (?:"publications"|publications)/,'CREATE TABLE publications_legacy').replace("AND kind='story'","AND audience='group' AND kind='story'")
  app.db.exec('PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE;');app.db.exec(legacy)
  app.db.exec('INSERT INTO publications_legacy SELECT * FROM publications; DROP TABLE publications; ALTER TABLE publications_legacy RENAME TO publications;')
  for(const object of objects)app.db.exec(String(object.sql))
  app.db.exec('COMMIT; PRAGMA foreign_keys=ON;')
  assert.throws(()=>app.db.exec("UPDATE publications SET audience='community' WHERE admin_author_id IS NULL"),/CHECK/)

  app.db.exec("INSERT INTO publications(author_id,idempotency_key,title,body,category,program,group_name,created_at) SELECT author_id,'deleted-sequence-marker',title,body,category,program,group_name,created_at FROM publications LIMIT 1; DELETE FROM publications WHERE idempotency_key='deleted-sequence-marker';")
  const sequence=app.db.prepare("SELECT seq FROM sqlite_sequence WHERE name='publications'").get()!.seq
  migrateDatabase(app.db);migrateDatabase(app.db)
  assert.deepEqual(app.db.prepare('PRAGMA foreign_key_check').all(),[])
  assert.deepEqual(app.db.prepare('SELECT * FROM requests').all(),before.requests);assert.deepEqual(app.db.prepare('SELECT * FROM student_accounts').all(),before.accounts);assert.deepEqual(app.db.prepare('SELECT * FROM post_comments').all(),before.comments);assert.deepEqual(app.db.prepare('SELECT * FROM challenge_attempts').all(),before.attempts);assert.deepEqual(app.db.prepare('SELECT * FROM learning_images').all(),before.images)
  assert.equal(app.db.prepare("SELECT seq FROM sqlite_sequence WHERE name='publications'").get()!.seq,sequence)
  assert.equal(app.db.prepare('SELECT audience FROM publications WHERE id=?').get(Number(postId.slice(4)))!.audience,'community')
  assert.equal(app.db.prepare("SELECT count(*) AS n FROM publication_audit WHERE action='publication.community_scope'").get()!.n,1)
  assert.equal((await fetch(base+privateImage,{headers:{Cookie:cookies.bob}})).status,404)
  assert.equal((await json<LearningPage>('/student/achievements')).items[0]!.id,achievementId)
  const historical=await json<ChallengeSnapshot>('/student/challenges');assert.equal(historical.items[0]!.previousGroup,true);assert.equal(historical.progress.correct,1)
  const global=(await json<ChallengeSnapshot>('/student/challenges','bob')).items[0]!;assert.equal((await call('/student/challenges/'+global.id+'/answer','POST',{revision:global.revision,answerIndex:0})).status,409)
 })
 await t.test('respaldo y reinicio conservan comunidad, permisos, puntos y sesiones',async()=>{
  const copy=await backupLocalDatabase(path,join(directory,'copies'));assert.equal((await verifyLocalBackup(copy)).schema,22)
  await close();app=createApplication(path,{},options);await start()
  assert.ok((await json<{posts:PublishedPost[]}>('/student/posts','bob')).posts.some((p:{id:string})=>p.id===postId));assert.equal((await json<ChallengeSnapshot>('/student/challenges')).progress.correct,1)
  assert.equal((await fetch(base+privateImage,{headers:{Cookie:cookies.bob}})).status,404)
  assert.equal((await call('/requests','GET',undefined,'bob')).status,401)
 })
 await t.test('el día siguiente comparte preguntas sin borrar el intento histórico de otro grupo',async()=>{
  clock=new Date('2026-11-25T18:00:00Z')
  const a=await json<ChallengeSnapshot>('/student/challenges'),b=await json<ChallengeSnapshot>('/student/challenges','bob')
  assert.deepEqual(a.items,b.items);assert.equal(a.progress.todayAnswered,0);assert.equal(a.progress.correct,1)
  const history=await json<{items:{attempt:unknown}[]}>('/student/challenges/history');assert.equal(history.items.length,1);assert.ok(history.items[0]!.attempt)
 })

})
