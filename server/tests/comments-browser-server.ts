/** Solo cuentas/base ficticias; nunca abre el entorno habitual. */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { studentAccounts } from '../student-accounts.ts'
import { publications } from '../publications.ts'
import { commentsRepository } from '../comments.ts'
import { validateSubmission } from '../validation.ts'

if (process.env.NODE_ENV === 'production') throw new Error('Solo pruebas ficticias locales.')
const port = Number(process.env.CAI_API_PORT ?? 3101)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('Puerto inválido.')
const root = resolve('.local/tests'); await mkdir(root, { recursive: true })
const directory = await mkdtemp(join(root, 'comments-browser-')), tag = randomUUID().slice(0,8)
const app = createApplication(join(directory, 'fixture.sqlite')), password = 'Frase ficticia de comentarios navegador 2026', hash = await hashPassword(password)
const admin = { email: 'admin-comments@example.test', name: 'Coordinación' }
const actor = Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?, ?, ?, 'admin')").run(admin.email, admin.name, hash).lastInsertRowid)
const fixtures: Record<string, { accounts: Record<string, {email:string;displayName:string}>;postId:string;title:string;paginationPostId:string;paginationTitle:string }> = {}
for (const browser of ['brave','opera']) {
  const accounts: Record<string, {email:string;displayName:string}> = {}
  for (const kind of ['author','peer','outside','minor']) {
    const email = `${browser}-${kind}-comments@example.test`, displayName = kind==='minor'?'Alumno F.':`Prueba ${kind} ${tag}`
    const receipt = accessRepository(app.db).submit(validateSubmission({ firstName:'Alumno',lastName:'Ficticio',birthDate:kind==='minor'? (new Date().getFullYear()-15)+'-01-01':'2000-01-01',email,filledBy:'alumno',program:'Business English',group:kind==='outside'?'Viernes · 18:00':'Mar y jue · 19:30',displayName,avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:kind==='minor',...(kind==='minor'?{guardian:{name:'Tutor Ficticio',relationship:'Tutor',contact:'tutor@example.test'}}:{}),acceptRules:true,acceptPrivacy:true }),randomUUID())
    if(kind==='minor')accessRepository(app.db).decide(receipt.id,1,'consent',actor,'Referencia ficticia de comentarios')
    accessRepository(app.db).decide(receipt.id,kind==='minor'?2:1,'approve',actor)
    app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString()); accounts[kind] = {email,displayName}
  }
  const user = await studentAccounts(app.db).login(accounts.author!.email,password), title = `Historia ficticia ${browser}`
  const post = publications(app.db).create(user!,{title,body:'Un avance ficticio de inglés que merece celebrarse con el grupo.',category:'achievement'},randomUUID())
  publications(app.db).decide(post.id,post.revision,'approve',actor,undefined,true)
  const paginationTitle='Conversación con historial '+browser
  const pagination=publications(app.db).create(user!,{title:paginationTitle,body:'Historia ficticia para probar páginas de comentarios anteriores.',category:'experience'},randomUUID())
  publications(app.db).decide(pagination.id,1,'approve',actor,undefined,true)
  // Preparación privada de datos, sin añadir endpoints de prueba al producto.
  app.db.prepare('UPDATE community_controls SET comments_open=1 WHERE id=1').run()
  const peer=await studentAccounts(app.db).login(accounts.peer!.email,password),repository=commentsRepository(app.db)
  for(let i=0;i<23;i++){const comment=repository.create(peer!,pagination.id,{body:'Comentario de historial ficticio '+i},randomUUID());repository.decide(comment.id,'approve',{revision:1,confirmed:true},actor)}
  app.db.prepare('UPDATE community_controls SET comments_open=0 WHERE id=1').run()
  fixtures[browser] = {accounts,postId:post.id,title,paginationPostId:pagination.id,paginationTitle}
}
await writeFile(join(directory,'browser.json'),JSON.stringify({admin,fixtures,port},null,2),{flag:'wx'})
app.server.listen(port,'127.0.0.1',()=>console.log(`API ficticia de comentarios lista. Metadatos: ${join(directory,'browser.json')}`))
process.on('SIGINT',()=>app.server.close(()=>process.exit(0)))


