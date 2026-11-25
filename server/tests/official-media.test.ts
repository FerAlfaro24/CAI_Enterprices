import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import sharp from 'sharp'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { hashPassword } from '../auth.ts'
import { validateSubmission } from '../validation.ts'
import { galleryRepository } from '../gallery.ts'
import { importOfficialMedia, officialMediaFiles } from '../official-media.ts'
import { migrateDatabase, openDatabase } from '../database.ts'
import { backupLocalDatabase } from '../backup.ts'
import { verifyLocalBackup } from '../verify-backup.ts'
import type { GalleryItem, GalleryReview } from '../contracts.ts'

test('Material oficial: importación recuperable, audiencia y privacidad', async t => {
  const root = resolve('.local/tests'); await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'official-media-')), path = join(directory, 'fixture.sqlite')
  const catalogDirectory=join(directory,'catalog'); await mkdir(catalogDirectory)
  const source=await sharp({create:{width:100,height:80,channels:3,background:'#345678'}}).jpeg().toBuffer()
  for (const name of officialMediaFiles) await writeFile(join(catalogDirectory,name),source)
  const app = createApplication(path, {}, {officialMediaDirectory:catalogDirectory})
  app.server.listen(0, '127.0.0.1'); await once(app.server, 'listening')
  t.after(() => new Promise<void>((resolve, reject) => app.server.close(error => error ? reject(error) : resolve())))
  const address = app.server.address(); assert.ok(address && typeof address === 'object')
  const base = `http://127.0.0.1:${address.port}`
  const password = 'Frase ficticia para fotos oficiales 2026', encoded = await hashPassword(password)
  const admin = Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Prueba',?,'admin')").run(encoded).lastInsertRowid)
  const profile = { firstName:'Alumno',lastName:'Prueba',birthDate:'2000-01-01',filledBy:'alumno',program:'Business English',group:'Mar y jue · 19:30',displayName:'Alumno P.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true }
  const owners: Record<string, string> = {}
  for (const [name, group] of [['alice',profile.group], ['bob','Viernes · 18:00'], ['unassigned',profile.group], ['pending',profile.group]]) {
    const repo = accessRepository(app.db), receipt = repo.submit(validateSubmission({ ...profile, email:`${name}@example.test`, group }), randomUUID())
    if (name !== 'pending') repo.decide(receipt.id,1,'approve',admin)
    owners[name!] = receipt.id
    app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)), encoded, new Date().toISOString())
  }
  app.db.prepare("UPDATE requests SET payload=json_set(payload,'$.group','Por asignar') WHERE id=?").run(Number(owners.unassigned!.slice(4)))
  const cookies: Record<string,string> = {}
  const call = (route:string,method='GET',data?:unknown,actor='admin',headers:Record<string,string>={}) => fetch(base+'/api/local'+route,{method,headers:{Origin:base,Cookie:cookies[actor]??'',...(data===undefined?{}:{'Content-Type':'application/json'}),...headers},body:data===undefined?undefined:JSON.stringify(data)})
  for (const name of ['admin','alice','bob','unassigned']) {
    const result = await call(name==='admin'?'/auth/login':'/student/login','POST',{email:`${name}@example.test`,password},'anonymous')
    assert.equal(result.status,200); cookies[name] = result.headers.getSetCookie().at(-1)!.split(';')[0]!
  }
  const list = async (actor='admin') => (await (await call(actor==='admin'?'/gallery':'/student/gallery','GET',undefined,actor)).json() as {images:GalleryReview[]}).images
  const repository = galleryRepository(app.db)
  const synthetic = await sharp({create:{width:80,height:80,channels:3,background:'#123456'}}).jpeg().toBuffer()
  const draft = {title:'Solo un grupo',description:'Imagen sintética de una prueba privada.',category:'activities',alt:'Cuadrado azul sintético',program:profile.program,group:profile.group,authorizationReference:'Prueba con imagen sintética',confirmed:true,imageBase64:synthetic.toString('base64')}
  let groupImage: GalleryReview

  await t.test('migración 16 a 17 mantiene permisos y reintentos de imágenes existentes', async () => {
    groupImage = await repository.create(draft,'legacy-test',()=>admin)
    app.db.exec('DROP INDEX student_notice_inbox; ALTER TABLE local_notices DROP COLUMN important; ALTER TABLE local_notices DROP COLUMN student_dismissed_at; DROP TABLE IF EXISTS account_emails; DELETE FROM migrations WHERE version=23; DROP TABLE community_moderation_actions; DROP TABLE student_restrictions; DELETE FROM migrations WHERE version=22; DELETE FROM migrations WHERE version=21; DELETE FROM migrations WHERE version=20; DROP TABLE learning_audit; DROP TABLE learning_images; DROP TABLE learning_achievements; DELETE FROM migrations WHERE version=19; DROP TABLE publication_images; ALTER TABLE gallery_images DROP COLUMN draft; DELETE FROM migrations WHERE version=18; DROP INDEX gallery_community_audience; ALTER TABLE gallery_images DROP COLUMN audience; DELETE FROM migrations WHERE version=17;')
    migrateDatabase(app.db)
    assert.equal((await repository.create(draft,'legacy-test',()=>admin)).id,groupImage.id)
    assert.equal(repository.list()[0]!.audience,'group')
    assert.equal((await list('alice')).length,1); assert.equal((await list('bob')).length,0)
    assert.equal((await call(groupImage.imagePath.replace('/api/local',''),'GET',undefined,'bob')).status,404)
  })
  await t.test('carga solo administrativa, confirmada y protegida contra origen ajeno', async () => {
    for (const actor of ['anonymous','alice']) assert.equal((await call('/gallery/official/import','POST',{confirmed:true},actor)).status,401)
    assert.equal((await call('/gallery/official/import','POST',{confirmed:false})).status,400)
    assert.equal((await call('/gallery/official/import','POST',{confirmed:true,path:'../fake'})).status,400)
    assert.equal((await call('/gallery/official/import','POST',{confirmed:true},'admin',{Origin:'https://foreign.example.test'})).status,403)
    const response=await call('/gallery/official/import','POST',{confirmed:true}); assert.equal(response.status,200)
    assert.deepEqual(await response.json(),{added:6,retained:0})
  })
  await t.test('todos los aprobados, incluso sin grupo, ven solo imágenes comunitarias y de su grupo', async () => {
    assert.equal((await list('alice')).length,7)
    for (const actor of ['bob','unassigned']) assert.equal((await list(actor)).length,6)
    const items=repository.list().filter(item=>item.audience==='community')
    for (const item of items) {
      assert.equal((await call(item.imagePath.replace('/api/local',''),'GET',undefined,'anonymous')).status,401)
      const response=await call(item.imagePath.replace('/api/local',''),'GET',undefined,'bob'); assert.equal(response.status,200)
      assert.match(response.headers.get('cache-control')!,/no-store/)
      const image=await sharp(Buffer.from(await response.arrayBuffer())).metadata()
      assert.equal(image.format,'webp'); assert.equal(image.exif,undefined); assert.equal(image.xmp,undefined)
    }
    const feed=await list('bob') as GalleryItem[]
    assert.ok(!JSON.stringify(feed).includes('authorizationReference'))
    assert.equal((await call('/student/login','POST',{email:'pending@example.test',password},'anonymous')).status,401)
    const repo=accessRepository(app.db), bob=repo.students().find(student=>student.id===owners.bob)!
    repo.setStudentStatus(bob.id,bob.revision,'suspendido',admin)
    assert.equal((await call('/student/gallery','GET',undefined,'bob')).status,401)
    assert.equal((await call(items[0]!.imagePath.replace('/api/local',''),'GET',undefined,'bob')).status,401)
  })
  await t.test('reintentos y retirada no duplican ni vuelven a publicar; pérdida de sesión impide continuar', async () => {
    const official=repository.list().find(item=>item.audience==='community')!
    repository.withdraw(official.id,{revision:1,confirmed:true},admin)
    assert.deepEqual(await (await call('/gallery/official/import','POST',{confirmed:true})).json(),{added:0,retained:6})
    assert.equal(repository.list().length,7)
    assert.equal(repository.list().find(item=>item.id===official.id)!.status,'retirada')
    assert.equal((await call(official.imagePath.replace('/api/local',''),'GET',undefined,'alice')).status,404)
    let checks=0
    await assert.rejects(importOfficialMedia(repository,{confirmed:true},()=>++checks===1?admin:null,catalogDirectory),/administración/)
  })
  await t.test('audiencia inválida o ambigua se rechaza; copia conserva datos y esquema 17', async () => {
    for (const invalid of [{audience:'public'},{audience:'community'},{audience:'community',program:'',group:profile.group}]) {
      await assert.rejects(repository.create({...draft,...invalid},randomUUID(),()=>admin))
    }
    const copy=await backupLocalDatabase(path,join(directory,'backups')), before=await readFile(copy)
    assert.equal((await verifyLocalBackup(copy)).schema,23)
    assert.equal((await verifyLocalBackup(copy)).images,7)
    assert.deepEqual(await readFile(copy),before)
  })
  await t.test('carga interrumpida conserva lo guardado y reanuda solo las fotos que faltan', async () => {
    const partial=openDatabase(join(directory,'partial.sqlite'))
    try {
      const actor=Number(partial.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('partial@example.test','Prueba',?,'admin')").run(encoded).lastInsertRowid)
      const gallery=galleryRepository(partial)
      let checks=0
      await assert.rejects(importOfficialMedia(gallery,{confirmed:true},()=>++checks<=5?actor:null,catalogDirectory))
      assert.equal(gallery.list().length,2)
      assert.deepEqual(await importOfficialMedia(gallery,{confirmed:true},()=>actor,catalogDirectory),{added:4,retained:2})
      assert.equal(gallery.list().length,6)
    } finally { partial.close() }
  })
  await t.test('sin paquete privado responde con error útil y no carga archivos públicos alternativos', async () => {
    await assert.rejects(importOfficialMedia(repository,{confirmed:true},()=>admin,undefined),/todavía no está instalado/)
    await assert.rejects(importOfficialMedia(repository,{confirmed:true},()=>admin,join(directory,'missing')),/material oficial privado/)
  })
})
