import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, stat } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import sharp from 'sharp'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { validateSubmission } from '../validation.ts'
import { galleryRepository } from '../gallery.ts'
import { publications } from '../publications.ts'
import { institutionalPosts } from '../institutional-posts.ts'
import { commentsRepository } from '../comments.ts'
import type { GalleryReview, InstitutionalDraft, PublishedPost, StudentUser } from '../contracts.ts'

test('Inicio conectado: contenido institucional, medios únicos y conversación compartida',async t=>{
  const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'community-content-'))
  const app=createApplication(join(directory,'fixture.sqlite'))
  app.server.listen(0,'127.0.0.1');await once(app.server,'listening')
  t.after(()=>new Promise<void>((resolve,reject)=>app.server.close(error=>error?reject(error):resolve())))
  const address=app.server.address();assert.ok(address&&typeof address==='object');const base=`http://127.0.0.1:${address.port}`
  const password='Frase ficticia de comunidad visual 2026',encoded=await hashPassword(password)
  const admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(encoded).lastInsertRowid)
  const profile={firstName:'Alumno',lastName:'Prueba',birthDate:'2000-01-01',filledBy:'alumno',program:'Business English',group:'Mar y jue · 19:30',displayName:'Alumno P.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}
  for(const [name,group]of [['alice',profile.group],['bob','Viernes · 18:00']]){
    const repo=accessRepository(app.db),receipt=repo.submit(validateSubmission({...profile,email:`${name}@example.test`,group}),randomUUID());repo.decide(receipt.id,1,'approve',admin)
    app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),encoded,new Date().toISOString())
  }
  app.db.exec('UPDATE community_controls SET reactions_open=1,comments_open=1')
  const cookies:Record<string,string>={}
  const call=(path:string,method='GET',data?:unknown,actor='admin',headers:Record<string,string>={})=>fetch(base+'/api/local'+path,{method,headers:{Origin:base,Cookie:cookies[actor]??'',...(data===undefined?{}:{'Content-Type':'application/json'}),...headers},body:data===undefined?undefined:JSON.stringify(data)})
  const users:Record<string,StudentUser>={}
  for(const actor of ['admin','alice','bob']){const r=await call(actor==='admin'?'/auth/login':'/student/login','POST',{email:`${actor}@example.test`,password},'none');assert.equal(r.status,200);cookies[actor]=r.headers.getSetCookie().at(-1)!.split(';')[0]!;if(actor!=='admin')users[actor]=(await(await call('/student/me','GET',undefined,actor)).json() as {user:StudentUser}).user}
  const image=await sharp({create:{width:120,height:80,channels:3,background:'#123456'}}).jpeg().toBuffer()
  const gallery=galleryRepository(app.db),posts=publications(app.db),official=institutionalPosts(app.db)
  const upload=(audience:'community'|'group'='community')=>gallery.create({title:'Imagen de prueba',description:'Fotografía sintética para comprobar permisos.',category:'activities',alt:'Rectángulo azul sintético',program:audience==='group'?profile.program:'',group:audience==='group'?profile.group:'',audience,draft:true,authorizationReference:'Material generado para pruebas',confirmed:true,imageBase64:image.toString('base64')},randomUUID(),()=>admin)
  let photo:GalleryReview,postId:string
  const draft=(imageIds:string[]=[]):InstitutionalDraft=>({title:'Una actividad de CAI',body:'Contenido de prueba de una actividad de la comunidad.',kind:'story',audience:'community',program:'',group:'',imageIds,showInGallery:imageIds.length>0,highlighted:true,expiresAt:null,confirmed:true})
  const feed=async(actor='alice')=>(await(await call('/student/posts','GET',undefined,actor)).json() as {posts:PublishedPost[]}).posts

  await t.test('borradores privados; solo coordinación publica, sin ampliar permisos de imágenes',async()=>{
    photo=await upload();assert.equal(photo.status,'borrador');assert.equal(gallery.forStudent(users.alice!).length,0)
    assert.equal((await call(photo.imagePath.replace('/api/local',''),'GET',undefined,'alice')).status,404)
    for(const actor of ['none','alice'])assert.equal((await call('/institutional-posts','POST',draft(),'alice'===actor?'alice':'none',{'Idempotency-Key':randomUUID()})).status,401)
    const restricted=await upload('group')
    assert.equal((await call('/institutional-posts','POST',draft([restricted.id]),'admin',{'Idempotency-Key':randomUUID()})).status,400)
    assert.equal((await call('/institutional-posts','POST',{...draft(),author_id:1},'admin',{'Idempotency-Key':randomUUID()})).status,400)
    assert.equal((await call('/institutional-posts','POST',{...draft(),confirmed:false},'admin',{'Idempotency-Key':randomUUID()})).status,400)
    assert.equal((await call('/institutional-posts','POST',draft(),'admin',{Origin:'https://foreign.example.test','Idempotency-Key':randomUUID()})).status,403)
  })
  await t.test('publicación, álbum y bytes comparten identidad y audiencia para grupos distintos',async()=>{
    const key=randomUUID(),data={...draft([photo.id]),kind:'album' as const}
    const result=await call('/institutional-posts','POST',data,'admin',{'Idempotency-Key':key});assert.equal(result.status,201)
    const id=(await result.json() as {id:number}).id;postId=`PUB-${String(id).padStart(4,'0')}`
    assert.equal((await call('/institutional-posts','POST',data,'admin',{'Idempotency-Key':key})).status,201)
    assert.equal((await call('/institutional-posts','POST',{...data,title:'Otro título'},'admin',{'Idempotency-Key':key})).status,409)
    assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM publication_images').get()!.n,1)
    for(const actor of ['alice','bob']){
      const post=(await feed(actor))[0]!;assert.equal(post.id,postId);assert.equal(post.author.displayName,'Equipo CAI');assert.equal(post.institutional,true);assert.equal(post.photos![0]!.id,photo.id)
      const images=gallery.forStudent(users[actor]!);assert.equal(images[0]!.publication!.id,postId)
      assert.equal((await call(photo.imagePath.replace('/api/local',''),'GET',undefined,actor)).status,200)
    }
    assert.equal((await call(photo.imagePath.replace('/api/local',''),'GET',undefined,'none')).status,401)
  })
  await t.test('reacciones y comentarios reales se comparten en comunidad; historias de alumnos comparten audiencia',async()=>{
    for(const actor of ['alice','bob'])assert.equal((await call(`/student/posts/${postId}/reaction`,'PATCH',{reaction:'love',revision:0},actor,{'Idempotency-Key':randomUUID()})).status,200)
    assert.equal((await feed())[0]!.engagement!.counts.love,2)
    const comments=commentsRepository(app.db)
    for(const actor of ['alice','bob']){const item=comments.create(users[actor]!,postId,{body:'Comentario ficticio para la presentación.'},randomUUID());if(item.status==='pendiente')comments.decide(item.id,'approve',{revision:item.revision,confirmed:true},admin)}
    assert.equal(comments.count(postId),2);assert.equal(comments.list(users.bob!,postId).items.length,2)
    const own=posts.create(users.alice!,{title:'Mi experiencia de prueba',body:'Texto ficticio que solo debe ver el grupo de Alice.',category:'experience'},randomUUID());posts.decide(own.id,1,'approve',admin,undefined,true)
    assert.equal((await feed('bob')).some(p=>p.id===own.id),true)
    assert.deepEqual(app.db.prepare('PRAGMA foreign_key_check').all(),[])
  })
  await t.test('destacados con revisión; no se sobrescriben cambios de otra sesión',async()=>{
    const row=posts.institutional()[0]!
    assert.equal((await call(`/institutional-posts/${postId}`,'PATCH',{revision:row.revision,confirmed:true,withdraw:false,highlighted:false,expiresAt:null})).status,200)
    assert.equal((await feed()).find(post=>post.id===postId)!.highlighted,false)
    assert.equal((await call(`/institutional-posts/${postId}`,'PATCH',{revision:row.revision,confirmed:true,withdraw:false,highlighted:true,expiresAt:null})).status,409)
  })
  await t.test('retirada elimina la historia, su álbum y sus bytes de todas las vistas; conserva conversación',async()=>{
    const row=posts.institutional()[0]!
    official.update(Number(postId.slice(4)),{revision:row.revision,confirmed:true,withdraw:true,highlighted:false,expiresAt:null},admin)
    assert.equal((await feed('bob')).some(item=>item.id===postId),false);assert.equal(gallery.forStudent(users.alice!).length,0)
    assert.equal((await call(photo.imagePath.replace('/api/local',''),'GET',undefined,'alice')).status,404)
    assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM post_comments').get()!.n,2)
    assert.throws(()=>commentsRepository(app.db).list(users.alice!,postId),/no está disponible/)
  })
  await t.test('avisos vencidos dejan de aparecer y no se pueden reactivar por un reintento',async()=>{
    const id=official.create({...draft(),kind:'notice',expiresAt:new Date(Date.now()+60_000).toISOString()},randomUUID(),admin)
    const expired=`PUB-${String(id).padStart(4,'0')}`
    assert.ok((await feed('bob')).some(p=>p.id===expired))
    app.db.prepare('UPDATE publications SET expires_at=? WHERE id=?').run('2020-01-01T00:00:00.000Z',id)
    assert.equal((await feed('bob')).some(p=>p.id===expired),false)
    assert.throws(()=>posts.visible(users.alice!,expired),/no está disponible/)
    assert.throws(()=>official.create({...draft(),expiresAt:'not-a-date'},randomUUID(),admin),/fecha/)
  })
  await t.test('la demostración se rechaza en producción antes de abrir datos',async()=>{
    const path=join(directory,'not-created.sqlite')
    assert.throws(()=>createApplication(path,{},{runtime:{mode:'production',publicOrigin:'https://cai.example.test',trustedProxy:'loopback'},demonstration:true}),/solo puede ejecutarse en local/)
    await assert.rejects(stat(path),{code:'ENOENT'})
  })

})
