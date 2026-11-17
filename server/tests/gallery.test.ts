import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import sharp from 'sharp'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { hashPassword } from '../auth.ts'
import { validateSubmission } from '../validation.ts'
import { backupLocalDatabase } from '../backup.ts'
import { openDatabase } from '../database.ts'
import { galleryLimits, type GalleryItem, type GalleryReview, type GalleryUpload } from '../contracts.ts'
import { galleryRepository } from '../gallery.ts'
import { verifyLocalBackup } from '../verify-backup.ts'
import { readFile } from 'node:fs/promises'

test('Galería privada: decodificación, permisos por recurso y respaldo completo', async t => {
  const root=resolve('.local/tests');await mkdir(root,{recursive:true})
  const directory=await mkdtemp(join(root,'gallery-')),path=join(directory,'test.sqlite')
  let app=createApplication(path)
  const listen=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const address=app.server.address();assert.ok(address&&typeof address==='object');return `http://127.0.0.1:${address.port}`}
  const close=()=>new Promise<void>((resolve,reject)=>app.server.close(error=>error?reject(error):resolve()))
  let base=await listen()
  t.after(async()=>{if(app.server.listening)await close();assert.equal(dirname(directory),root);assert.ok(directory.startsWith(join(root,'gallery-')));await rm(directory,{recursive:true})})
  const password='Contraseña ficticia de galería 2026',encoded=await hashPassword(password)
  const admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(encoded).lastInsertRowid)
  const profile={firstName:'Alumno',lastName:'Prueba',birthDate:'2000-01-01',filledBy:'alumno',program:'Business English',group:'Mar y jue · 19:30',displayName:'Alumno P.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}
  const owners:Record<string,string>={}
  for(const [name,group]of[['alice',profile.group],['bob',profile.group],['carol','Viernes · 18:00']]){
    const repo=accessRepository(app.db),receipt=repo.submit(validateSubmission({...profile,email:`${name}@example.test`,group}),randomUUID());repo.decide(receipt.id,1,'approve',admin);owners[name!]=receipt.id
    app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),encoded,new Date().toISOString())
  }
  const cookies:Record<string,string>={anonymous:''}
  const call=(route:string,method='GET',data?:unknown,actor='admin',extra:Record<string,string>={})=>fetch(base+'/api/local'+route,{method,headers:{Origin:base,Cookie:cookies[actor]??'',...(data===undefined?{}:{'Content-Type':'application/json'}),...extra},body:data===undefined?undefined:JSON.stringify(data)})
  const login=async(name:string)=>{const r=await call(name==='admin'?'/auth/login':'/student/login','POST',{email:`${name}@example.test`,password},'anonymous');assert.equal(r.status,200);cookies[name]=r.headers.getSetCookie().at(-1)!.split(';')[0]!}
  for(const name of ['admin','alice','bob','carol'])await login(name)
  const jpeg=await sharp({create:{width:2000,height:1000,channels:3,background:'#1f56d6'}}).jpeg().withExif({IFD0:{Artist:'Persona ficticia',ImageDescription:'Dato privado de prueba'}}).toBuffer()
  const draft:GalleryUpload={title:'Imagen de prueba privada',description:'Imagen ficticia sin alumnos para verificar acceso de grupo.',category:'activities',alt:'Rectángulo azul de prueba',program:profile.program,group:profile.group,authorizationReference:'Material generado para pruebas ficticias',confirmed:true,imageBase64:jpeg.toString('base64')}
  const upload=(data:unknown=draft,key=randomUUID(),actor='admin')=>call('/gallery','POST',data,actor,{'Idempotency-Key':key})
  const images=async()=>(await(await call('/gallery')).json() as {images:GalleryReview[]}).images
  const list=async(actor='alice')=>(await(await call('/student/gallery','GET',undefined,actor)).json() as {images:GalleryItem[]}).images
  let item:GalleryReview,firstBytes:Uint8Array

  await t.test('solo administración sube/retira; sesión obligatoria para listar y leer bytes',async()=>{
    for(const actor of ['anonymous','alice']){assert.equal((await call('/gallery','GET',undefined,actor)).status,401);assert.equal((await upload(draft,randomUUID(),actor)).status,401)}
    assert.equal((await call('/student/gallery','GET',undefined,'anonymous')).status,401)
    assert.equal((await call('/gallery/00000000-0000-4000-8000-000000000000/image','GET',undefined,'anonymous')).status,401)
  })
  await t.test('rechaza formato simulado, SVG/GIF, daño, metadatos inválidos, tamaño y audiencia no válida',async()=>{
    const oversized=await sharp({create:{width:4000,height:4000,channels:3,background:'#fff'}}).png().toBuffer()
    for(const invalid of [{confirmed:false},{authorizationReference:'abc'},{alt:'a'},{category:'toString'},{group:'Inventado'},{group:'Por asignar'},{imageBase64:'no-base64'},{imageBase64:Buffer.from('texto, no imagen').toString('base64')},{imageBase64:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>').toString('base64')},{imageBase64:'R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='},{imageBase64:jpeg.subarray(0,Math.floor(jpeg.length/2)).toString('base64')},{imageBase64:oversized.toString('base64')},{created_by:admin}])assert.equal((await upload({...draft,...invalid})).status,400)
    assert.equal((await upload({...draft,imageBase64:Buffer.alloc(galleryLimits.uploadBytes+1).toString('base64')})).status,400)
    assert.equal((await call('/gallery','POST',draft)).status,400)
  })
  await t.test('decodifica/reduce y recodifica sin EXIF, con revisión e idempotencia',async()=>{
    const key=randomUUID(),response=await upload(draft,key);assert.equal(response.status,201);item=(await response.json() as {image:GalleryReview}).image
    assert.equal(item.width,1600);assert.equal(item.height,800);assert.match(item.id,/^[a-f0-9-]{36}$/)
    assert.equal((await(await upload(draft,key)).json() as {image:GalleryReview}).image.id,item.id)
    assert.equal((await upload({...draft,title:'Otro título'},key)).status,409)
    const r=await call(`/gallery/${item.id}/image`);assert.equal(r.status,200);firstBytes=new Uint8Array(await r.arrayBuffer())
    const info=await sharp(firstBytes).metadata();assert.equal(info.format,'webp');assert.equal(info.exif,undefined);assert.equal(info.xmp,undefined);assert.equal(info.icc,undefined)
    assert.match(r.headers.get('cache-control')!,/no-store/);assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.equal(r.headers.get('cross-origin-resource-policy'),'same-origin')
  })
  await t.test('cada recurso verifica programa/grupo y omite autorización, actor y bytes del listado público',async()=>{
    const feed=await list('bob');assert.equal(feed.length,1);assert.equal(feed[0]!.id,item.id)
    assert.deepEqual(Object.keys(feed[0]!).sort(),['alt','byteSize','category','createdAt','description','height','id','imagePath','title','width'])
    assert.ok(!JSON.stringify(feed).includes('authorizationReference'));assert.ok(!JSON.stringify(feed).includes('Persona ficticia'))
    assert.equal((await call(`/gallery/${item.id}/image`,'GET',undefined,'bob')).status,200)
    assert.deepEqual(await list('carol'),[]);assert.equal((await call(`/gallery/${item.id}/image`,'GET',undefined,'carol')).status,404)
    assert.equal((await call(`/gallery/${item.id}/withdraw`,'POST',{revision:1,confirmed:true},'bob')).status,401)
  })
  await t.test('caducar sesión durante el procesado impide guardar',async()=>{
    let checks=0
    const repository=galleryRepository(app.db)
    await assert.rejects(repository.create({...draft,title:'No guardar sin sesión'},randomUUID(),()=>++checks===1?admin:null),/sesión terminó/)
    assert.equal((await images()).length,1)
  })
  await t.test('reasignar o suspender impide leer el recurso; archivar no expulsa miembros actuales',async()=>{
    const repo=accessRepository(app.db),alice=repo.students().find(student=>student.id===owners.alice)!
    repo.assignStudent(alice.id,alice.revision,profile.program,'Viernes · 18:00',true,admin)
    assert.equal((await call(`/gallery/${item.id}/image`,'GET',undefined,'alice')).status,401)
    await login('alice');assert.equal((await call(`/gallery/${item.id}/image`,'GET',undefined,'alice')).status,404)
    const bob=repo.students().find(student=>student.id===owners.bob)!
    repo.setStudentStatus(bob.id,bob.revision,'suspendido',admin);assert.equal((await call(`/gallery/${item.id}/image`,'GET',undefined,'bob')).status,401)
    repo.setStudentStatus(bob.id,bob.revision+1,'activo',admin);await login('bob');assert.equal((await call(`/gallery/${item.id}/image`,'GET',undefined,'bob')).status,200)
    app.db.prepare('UPDATE course_groups SET active=0 WHERE program=? AND name=?').run(profile.program,profile.group)
    assert.equal((await call(`/gallery/${item.id}/image`,'GET',undefined,'bob')).status,200)
    assert.equal((await upload({...draft,title:'Grupo archivado'})).status,400)
    app.db.prepare('UPDATE course_groups SET active=1 WHERE program=? AND name=?').run(profile.program,profile.group)
  })
  await t.test('respaldo y reinicio conservan imagen, controles y permisos; retirada revoca sin borrar historial',async()=>{
    const copy=await backupLocalDatabase(path,join(directory,'backups')),restored=openDatabase(copy)
    try{assert.deepEqual(galleryRepository(restored).image(item.id,null,true),firstBytes);assert.ok(Number(restored.prepare('SELECT count(*) AS n FROM student_accounts').get()!.n)>0)}finally{restored.close()}
    await close();app=createApplication(path);base=await listen()
    assert.deepEqual(new Uint8Array(await(await call(`/gallery/${item.id}/image`)).arrayBuffer()),firstBytes)
    assert.equal((await call(`/gallery/${item.id}/withdraw`,'POST',{revision:1,confirmed:false})).status,400)
    assert.equal((await call(`/gallery/${item.id}/withdraw`,'POST',{revision:2,confirmed:true})).status,409)
    assert.equal((await call(`/gallery/${item.id}/withdraw`,'POST',{revision:1,confirmed:true})).status,200)
    assert.equal((await call(`/gallery/${item.id}/image`)).status,404);assert.equal((await call(`/gallery/${item.id}/image`,'GET',undefined,'bob')).status,404)
    assert.deepEqual(await list('bob'),[]);assert.equal((await images())[0]!.status,'retirada')
    assert.equal(app.db.prepare('SELECT count(*) AS n FROM gallery_images').get()!.n,1)
    assert.equal(app.db.prepare('SELECT count(*) AS n FROM migrations WHERE version=9').get()!.n,1)
  })
  await t.test('verificar copia sin escribir, ensayar acceso aislado y detectar imagen corrupta',async()=>{
    const copy=await backupLocalDatabase(path,join(directory,'verification')),before=await readFile(copy)
    assert.deepEqual(await verifyLocalBackup(copy),{schema:16,requests:3,students:3,accounts:3,posts:0,images:1})
    assert.deepEqual(await readFile(copy),before)
    const rehearsal=createApplication(copy)
    rehearsal.server.listen(0,'127.0.0.1');await once(rehearsal.server,'listening')
    const address=rehearsal.server.address();assert.ok(address&&typeof address==='object')
    const restoredBase=`http://127.0.0.1:${address.port}`
    try{
      const login=await fetch(restoredBase+'/api/local/student/login',{method:'POST',headers:{Origin:restoredBase,'Content-Type':'application/json'},body:JSON.stringify({email:'bob@example.test',password})})
      assert.equal(login.status,200)
      const cookie=login.headers.getSetCookie().at(-1)!.split(';')[0]!
      const own=await fetch(restoredBase+'/api/local/student/me',{headers:{Cookie:cookie}})
      assert.equal(own.status,200);assert.equal((await own.json() as {user:{program:string}}).user.program,profile.program)
      assert.equal((await fetch(restoredBase+'/api/local/requests',{headers:{Cookie:cookie}})).status,401)
      assert.equal((await fetch(restoredBase+item.imagePath,{headers:{Cookie:cookie}})).status,404)
    }finally{await new Promise<void>((resolve,reject)=>rehearsal.server.close(error=>error?reject(error):resolve()))}
    const damaged=openDatabase(copy)
    try{damaged.prepare('UPDATE gallery_images SET bytes=?,byte_size=4').run(Buffer.from('fake'))}finally{damaged.close()}
    await assert.rejects(verifyLocalBackup(copy))
    assert.deepEqual(galleryRepository(app.db).list().map(image=>image.status),['retirada'])
    assert.deepEqual(app.db.prepare('SELECT bytes FROM gallery_images WHERE id=?').get(item.id)!.bytes,firstBytes)
    const absent=join(directory,'missing.sqlite')
    await assert.rejects(verifyLocalBackup(absent))
    await assert.rejects(readFile(absent))
  })
})
