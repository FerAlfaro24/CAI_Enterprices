import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { request as httpRequest } from 'node:http'
import { randomUUID } from 'node:crypto'
import { mkdir,mkdtemp } from 'node:fs/promises'
import { join,resolve } from 'node:path'
import sharp from 'sharp'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { validateSubmission } from '../validation.ts'
import { studentAccounts } from '../student-accounts.ts'
import { learningRepository } from '../learning.ts'
import { publications } from '../publications.ts'
import { institutionalPosts } from '../institutional-posts.ts'
import { galleryRepository } from '../gallery.ts'
import { backupLocalDatabase } from '../backup.ts'
import { verifyLocalBackup } from '../verify-backup.ts'
import { communityHighlights } from '../../shared/community-highlights.ts'
import type { ReviewPost } from '../contracts.ts'

test('Publicador, avisos exclusivos y eliminación administrativa con historial',async t=>{
 const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'publisher-')),path=join(directory,'fixture.sqlite')
 let app=createApplication(path),base=''
 const start=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');base='http://127.0.0.1:'+(app.server.address() as {port:number}).port}
 const close=()=>new Promise<void>(r=>app.server.close(()=>r()))
 await start();t.after(async()=>{if(app.server.listening)await close()})
 const password='Frase ficticia de publicación 2026',hash=await hashPassword(password),admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','CAI',?,'admin')").run(hash).lastInsertRowid)
 const peerAdmin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('peer@example.test','CAI dos',?,'admin')").run(hash).lastInsertRowid)
 const access=accessRepository(app.db),accounts=studentAccounts(app.db),cookies:Record<string,string>={}
 for(const name of ['alice','bob']){const receipt=access.submit(validateSubmission({className:'Inglés',firstName:name,lastName:'Prueba',birthDate:'2000-01-01',email:name+'@example.test',displayName:name+' P.',avatarColor:'#1f56d6',visibility:'privado',message:'',acceptRules:true,acceptPrivacy:true}),randomUUID());access.decide(receipt.id,1,'approve',admin);app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString())}
 const call=(route:string,method='GET',data?:unknown,who='admin',origin=base)=>fetch(base+'/api/local'+route,{method,headers:{Origin:origin,Cookie:cookies[who]??'','Content-Type':'application/json','Idempotency-Key':randomUUID()},body:data===undefined?undefined:JSON.stringify(data)})
 for(const who of ['admin','peer','alice','bob']){const r=await call(who==='admin'||who==='peer'?'/auth/login':'/student/login','POST',{email:who+'@example.test',password},'anonymous');assert.equal(r.status,200);cookies[who]=r.headers.getSetCookie().at(-1)!.split(';')[0]!}
 const alice=(await accounts.login('alice@example.test',password))!,bob=(await accounts.login('bob@example.test',password))!,posts=publications(app.db),learning=learningRepository(app.db)
 const png=await sharp({create:{width:40,height:30,channels:3,background:'#1f56d6'}}).png().toBuffer()
 const item=await learning.save(alice,null,{category:'reading',title:'Mi lectura para revisar',practice:'Comprendí cómo describir al personaje principal.',expression:'',example:'',state:'completed',images:[{data:'data:image/png;base64,'+png.toString('base64')}]},randomUUID(),()=>true)
 learning.submit(alice,item.id,{revision:item.revision,share:true,confirmed:true});const pending=learning.mine(alice).items.find(x=>x.id===item.id)!.publication!;posts.decide(pending.id,pending.revision,'approve',admin,undefined,true)
 let student=posts.review().find(x=>x.id===pending.id)!,official:ReviewPost
 const withdrawal={revision:student.revision,confirmed:true,reason:'Contenido ficticio eliminado por coordinación'}
 await t.test('ruta propia de administración; origen, confirmación, revisión y motivo obligatorios',async()=>{
  const route='/posts/'+student.id+'/withdraw'
  for(const who of ['anonymous','alice','bob'])assert.equal((await call(route,'POST',withdrawal,who)).status,401)
  assert.equal((await call(route,'POST',withdrawal,'admin','https://otro.example')).status,403)
  for(const data of [{...withdrawal,confirmed:false},{...withdrawal,reason:'x'},{...withdrawal,reason:'x'.repeat(241)},{...withdrawal,revision:99},{...withdrawal,adminId:99}])assert.ok([400,409].includes((await call(route,'POST',data)).status))
  assert.ok(posts.feed(bob).some(x=>x.id===student.id))
 })
 await t.test('eliminar publicación de alumno oculta contenido, foto y perfil; conserva validación y motivo privado',async()=>{
  const image=student.photos![0]!.imagePath.slice('/api/local'.length)
  assert.equal((await call(image,'GET',undefined,'bob')).status,200)
  assert.equal((await call('/posts/'+student.id+'/withdraw','POST',withdrawal)).status,200)
  assert.ok(!posts.feed(bob).some(x=>x.id===student.id));assert.equal((await call(image,'GET',undefined,'bob')).status,404)
  const current=posts.mine(alice).find(x=>x.id===student.id)!;assert.equal(current.status,'retirada');assert.equal(current.reason,withdrawal.reason)
  assert.ok(learning.mine(alice).items.find(x=>x.id===item.id)!.validatedAt)
  const profile=await call('/student/members/'+alice.publicId,'GET',undefined,'bob');assert.equal(profile.status,200);assert.ok(!JSON.stringify(await profile.json()).includes(student.title))
  const audit=app.db.prepare("SELECT * FROM publication_audit WHERE publication_id=? AND action='publication.withdraw'").all(Number(student.id.slice(4)));assert.equal(audit.length,1);assert.equal(audit[0]!.admin_id,admin)
  assert.equal((await call('/posts/'+student.id+'/withdraw','POST',withdrawal)).status,409);assert.equal((await call('/posts/'+student.id+'/undo','POST',{revision:current.revision})).status,409)
 })
 await t.test('aviso con foto y publicación normal conservan una sola imagen y conversación',async()=>{
  const gallery=galleryRepository(app.db),image=await gallery.create({title:'Foto de un aviso ficticio',description:'Una imagen sintética para las pruebas de publicación.',category:'activities',alt:'Rectángulo azul de prueba',audience:'community',program:'',group:'',authorizationReference:'Material sintético de QA',confirmed:true,draft:true,imageBase64:png.toString('base64')},randomUUID(),()=>admin)
  const id=institutionalPosts(app.db).create({title:'Aviso nuevo de CAI',body:'Esta es una comunicación importante de prueba.',kind:'notice',audience:'community',program:'',group:'',imageIds:[image.id],showInGallery:false,highlighted:false,expiresAt:null,confirmed:true},randomUUID(),admin)
  official=posts.institutional().find(x=>x.id==='PUB-'+String(id).padStart(4,'0'))!
  assert.equal(official.photos!.length,1);assert.equal(app.db.prepare('SELECT count(*) AS n FROM publication_images WHERE publication_id=?').get(id)!.n,1)
  assert.ok(posts.feed(bob).some(x=>x.id===official.id));assert.equal(official.highlighted,false)
  assert.equal(gallery.forStudent(bob).some(x=>x.id===image.id),false)
 })
 await t.test('carrusel solo con avisos vigentes del equipo, más reciente primero, sin requisito destacado',()=>{
  const notice={id:official.id,status:'approved',authorId:'cai-team',category:'announcement',title:official.title,body:official.body,createdAt:official.createdAt,photos:official.photos!.map(image=>({src:image.imagePath,alt:image.alt}))},old={...notice,id:'PUB-0099',createdAt:'2026-01-01T00:00:00.000Z'},latest={...notice,id:'PUB-0100',createdAt:'2026-01-02T00:00:00.000Z'}
  const values=[old,{...notice,id:'story',category:'experience' as const},{...notice,id:'album',category:'gallery' as const},{...notice,id:'private',authorId:'otro'},{...notice,id:'pending',status:'pending' as const},{...notice,id:'expired',expiresAt:'2025-01-01T00:00:00.000Z'},latest]
  assert.deepEqual(communityHighlights(values,Date.parse('2026-02-01')).map(x=>x.id),[latest.id,old.id]);assert.deepEqual(communityHighlights([]),[])
 })
 await t.test('eliminar aviso conserva actor/motivo y lo retira de carrusel, foto y feed',async()=>{
  const path='/institutional-posts/'+official.id,reason='Aviso ficticio eliminado después de revisión'
  assert.equal((await call(path,'PATCH',{revision:official.revision,confirmed:true,withdraw:true,highlighted:false,expiresAt:null,reason})).status,200)
  assert.ok(!posts.feed(bob).some(x=>x.id===official.id));assert.equal((await call(official.photos![0]!.imagePath.slice('/api/local'.length),'GET',undefined,'bob')).status,404)
  const row=posts.institutional().find(x=>x.id===official.id)!;assert.equal(row.reason,reason);assert.equal(row.status,'retirada')
  const audit=app.db.prepare("SELECT actor_id,details FROM administration_audit WHERE kind='institutional.withdrawn'").get()!;assert.equal(audit.actor_id,admin);assert.equal(JSON.parse(String(audit.details)).reason,reason)
 })
 await t.test('sesión revocada mientras llega el cuerpo no elimina la publicación',async()=>{
  const r=posts.create(alice,{title:'Publicación protegida',body:'Publicación ficticia para probar permisos concurrentes.',category:'experience'},randomUUID());posts.decide(r.id,r.revision,'approve',admin,undefined,true);student=posts.review().find(x=>x.id===r.id)!
  const data={revision:student.revision,confirmed:true,reason:'Intento ficticio con sesión revocada'}
  const status=await new Promise<number>((resolve,reject)=>{const request=httpRequest(base+'/api/local/posts/'+student.id+'/withdraw',{method:'POST',headers:{Origin:base,Cookie:cookies.peer!,'Content-Type':'application/json','Transfer-Encoding':'chunked'}},response=>{response.resume();response.on('end',()=>resolve(response.statusCode!))});request.on('error',reject);request.write('{');setTimeout(()=>{app.db.prepare('DELETE FROM sessions WHERE user_id=?').run(peerAdmin);request.end(JSON.stringify(data).slice(1))},30)})
  assert.equal(status,401);assert.ok(posts.feed(bob).some(x=>x.id===student.id))
 })
 await t.test('respaldo y reinicio conservan eliminaciones e historial sin migrar esquema',async()=>{
  const copy=await backupLocalDatabase(path,join(directory,'copies'));assert.equal((await verifyLocalBackup(copy)).schema,23)
  const before=app.db.prepare('SELECT id,status,reason,revision FROM publications ORDER BY id').all();await close();app=createApplication(path);await start();assert.deepEqual(app.db.prepare('SELECT id,status,reason,revision FROM publications ORDER BY id').all(),before)
 })
})
