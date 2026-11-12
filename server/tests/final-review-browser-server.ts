/** Entorno desechable para repetir recorridos oficiales sin abrir la base habitual. */
import { mkdir,mkdtemp,writeFile } from 'node:fs/promises'
import { join,resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { administration } from '../administration.ts'

if(process.env.NODE_ENV==='production')throw new Error('Solo revisión local con datos ficticios.')
const port=Number(process.env.CAI_API_PORT??3101)
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Puerto de pruebas inválido.')
const root=resolve('.local/tests');await mkdir(root,{recursive:true})
const directory=await mkdtemp(join(root,'final-review-')),tag=randomUUID().slice(0,8)
const app=createApplication(join(directory,'fixture.sqlite')),email=`revision-${tag}@example.test`
const password='Frase ficticia de revisión final CAI 2026'
const actor=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,'Coordinación',?,'admin')").run(email,await hashPassword(password)).lastInsertRowid)
const catalog=administration(app.db)
if(catalog.groups().filter(g=>g.active&&g.program==='Business English'&&g.name!=='Por asignar').length<2)catalog.createGroup({program:'Business English',name:'Sábado ficticio · 10:00'},actor)
const fixturePath=join(directory,'imagen-ficticia.jpg')
await sharp({create:{width:96,height:64,channels:3,background:'#1f56d6'}}).jpeg().toFile(fixturePath)
await writeFile(join(directory,'browser.json'),JSON.stringify({email,name:'Coordinación',port,tag,fixturePath},null,2),{flag:'wx'})
app.server.listen(port,'127.0.0.1',()=>console.log(`Revisión aislada lista. Metadatos ficticios: ${join(directory,'browser.json')}`))
process.on('SIGINT',()=>app.server.close(()=>process.exit(0)))
