/** Servidor exclusivo de pruebas de contraseña. Nunca abre la base habitual. */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { validateSubmission } from '../validation.ts'

if (process.env.NODE_ENV === 'production') throw new Error('Esta herramienta solo admite pruebas locales ficticias.')
const port = Number(process.env.CAI_API_PORT ?? 3101)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Puerto de pruebas no válido.')
const root = resolve('.local/tests'); await mkdir(root, {recursive:true})
const directory = await mkdtemp(join(root, 'admin-browser-')),tag=randomUUID().slice(0,8)
const app = createApplication(join(directory, 'fixture.sqlite'))
const encoded = await hashPassword('Frase ficticia inicial de seguridad 2026')
const accounts = Object.fromEntries(['brave','opera','peer'].map(key => {
  const email=`${key}-security@example.test`,name=`Prueba ${key} ${tag}`
  app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,?,?,'admin')").run(email,name,encoded)
  return [key,{email,name}]
}))
const repo=accessRepository(app.db),admin=Number(app.db.prepare('SELECT id FROM admin_users LIMIT 1').get()!.id)
const receipt=repo.submit(validateSubmission({firstName:'Alumno',lastName:'Ficticio',birthDate:'2000-01-01',email:'student-security@example.test',filledBy:'alumno',program:'Business English',group:'Mar y jue · 19:30',displayName:'Alumno de seguridad',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}),randomUUID())
repo.decide(receipt.id,1,'approve',admin)
app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),encoded,new Date().toISOString())
await writeFile(join(directory,'browser.json'),JSON.stringify({accounts,port},null,2),{flag:'wx'})
app.server.listen(port,'127.0.0.1',()=>console.log(`API aislada de seguridad lista en ${port}. Metadatos de prueba: ${join(directory,'browser.json')}`))
process.on('SIGINT',()=>app.server.close(()=>process.exit(0)))
