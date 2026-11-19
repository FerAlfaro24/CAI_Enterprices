/** Revisión manual en navegador aislado: nunca abre la base ni los accesos habituales. */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { createServer } from 'vite'
import sharp from 'sharp'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { galleryRepository } from '../gallery.ts'
import { validateSubmission } from '../validation.ts'

if (process.env.NODE_ENV === 'production') throw Error('Solo pruebas locales ficticias.')
const root = resolve('.local/tests'); await mkdir(root,{recursive:true})
const directory = await mkdtemp(join(root,'official-media-browser-'))
const app = createApplication(join(directory,'fixture.sqlite'))
const password = 'Frase ficticia para fotos oficiales 2026', encoded = await hashPassword(password)
const admin = Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación de prueba',?,'admin')").run(encoded).lastInsertRowid)
const profile={firstName:'Alumno',lastName:'Prueba',birthDate:'2000-01-01',filledBy:'alumno',program:'Business English',group:'Mar y jue · 19:30',displayName:'Alumno P.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}
for (const [name,group] of [['alice',profile.group],['bob','Viernes · 18:00']]) {
  const repo=accessRepository(app.db), receipt=repo.submit(validateSubmission({...profile,email:`${name}@example.test`,group}),randomUUID())
  repo.decide(receipt.id,1,'approve',admin)
  app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),encoded,new Date().toISOString())
}
const image=await sharp({create:{width:120,height:80,channels:3,background:'#123456'}}).jpeg().toBuffer()
await galleryRepository(app.db).create({title:'Solo el grupo de Alice',description:'Imagen sintética que Bob no debe poder ver.',alt:'Rectángulo azul sintético',category:'activities',program:profile.program,group:profile.group,authorizationReference:'Prueba de separación de grupos',confirmed:true,imageBase64:image.toString('base64')},randomUUID(),()=>admin)
app.server.listen(3197,'127.0.0.1'); await once(app.server,'listening')
const vite=await createServer({cacheDir:'node_modules/.vite-cai-web-3197',server:{port:4187,strictPort:true,host:'127.0.0.1',proxy:{'/api/local':{target:'http://127.0.0.1:3197'}}}})
await vite.listen()
await writeFile(join(directory,'browser.json'),JSON.stringify({url:'http://127.0.0.1:4187',admin:'admin@example.test',students:['alice@example.test','bob@example.test'],password},null,2),{flag:'wx'})
console.log(`Fotos oficiales: fixture lista en http://127.0.0.1:4187 — ${directory}`)
process.on('SIGINT',()=>{void vite.close().then(()=>app.server.close(()=>process.exit(0)))})
