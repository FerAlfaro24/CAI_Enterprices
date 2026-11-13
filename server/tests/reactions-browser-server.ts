/** Solo cuentas/base ficticias; nunca abre el entorno habitual. */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { studentAccounts } from '../student-accounts.ts'
import { publications } from '../publications.ts'
import { validateSubmission } from '../validation.ts'

if (process.env.NODE_ENV === 'production') throw new Error('Solo pruebas ficticias locales.')
const port = Number(process.env.CAI_API_PORT ?? 3101)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Puerto inválido.')
const root = resolve('.local/tests'); await mkdir(root, { recursive: true })
const directory = await mkdtemp(join(root, 'reactions-browser-')), tag = randomUUID().slice(0,8)
const app = createApplication(join(directory, 'fixture.sqlite')), password = 'Frase ficticia de reacciones navegador 2026', hash = await hashPassword(password)
const admin = { email: 'admin-reactions@example.test', name: 'Coordinación' }
const actor = Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?, ?, ?, 'admin')").run(admin.email, admin.name, hash).lastInsertRowid)
const fixtures: Record<string, { accounts: Record<string, {email:string;displayName:string}>;postId:string;title:string }> = {}
for (const browser of ['brave','opera']) {
  const accounts: Record<string, {email:string;displayName:string}> = {}
  for (const kind of ['author','peer','outside']) {
    const email = `${browser}-${kind}-reactions@example.test`, displayName = `Prueba ${kind} ${tag}`
    const receipt = accessRepository(app.db).submit(validateSubmission({ firstName:'Alumno',lastName:'Ficticio',birthDate:'2000-01-01',email,filledBy:'alumno',program:'Business English',group:kind==='outside'?'Viernes · 18:00':'Mar y jue · 19:30',displayName,avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true }),randomUUID())
    accessRepository(app.db).decide(receipt.id,1,'approve',actor)
    app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString()); accounts[kind] = {email,displayName}
  }
  const user = await studentAccounts(app.db).login(accounts.author!.email,password), title = `Historia ficticia ${browser}`
  const post = publications(app.db).create(user!,{title,body:'Un avance ficticio de inglés que merece celebrarse con el grupo.',category:'achievement'},randomUUID())
  publications(app.db).decide(post.id,post.revision,'approve',actor,undefined,true)
  fixtures[browser] = {accounts,postId:post.id,title}
}
await writeFile(join(directory,'browser.json'),JSON.stringify({admin,fixtures,port},null,2),{flag:'wx'})
app.server.listen(port,'127.0.0.1',()=>console.log(`API ficticia de reacciones lista. Metadatos: ${join(directory,'browser.json')}`))
process.on('SIGINT',()=>app.server.close(()=>process.exit(0)))
