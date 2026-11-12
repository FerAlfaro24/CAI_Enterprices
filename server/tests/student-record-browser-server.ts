/** Fixture aislada de expediente. Nunca abre la base habitual ni usa personas reales. */
import { mkdir,mkdtemp,writeFile } from 'node:fs/promises'
import { join,resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { studentAccounts } from '../student-accounts.ts'
import { publications } from '../publications.ts'
import { validateSubmission } from '../validation.ts'
if(process.env.NODE_ENV==='production')throw new Error('Solo pruebas locales ficticias.')
const port=Number(process.env.CAI_API_PORT??3101)
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Puerto inválido.')
const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'student-record-browser-')),tag=randomUUID().slice(0,8)
const app=createApplication(join(directory,'fixture.sqlite')),hash=await hashPassword('Frase ficticia de expediente para navegador 2026'),accounts:Record<string,Record<string,unknown>>={}
const repo=accessRepository(app.db),auth=studentAccounts(app.db),posts=publications(app.db)
for(const browser of ['brave','opera']){
  const admin={name:`Prueba expediente ${browser} ${tag}`,email:`admin-${browser}-record@example.test`},actor=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,?,?,'admin')").run(admin.email,admin.name,hash).lastInsertRowid)
  accounts[browser]={admin}
  for(const kind of ['adult','minor','peer']){
    const firstName=kind==='minor'?'Menor Ficticio':'Alumno Ficticio',lastName=`${browser==='brave'?'Brave':'Opera'} Prueba`,displayName=kind==='minor'?`Menor ${lastName[0]}.`:`Prueba ${browser} ${kind} ${tag}`,email=`${kind}-${browser}-record@example.test`,birthDate=kind==='minor'?`${new Date().getFullYear()-15}-01-01`:'2000-01-01'
    const receipt=repo.submit(validateSubmission({firstName,lastName,birthDate,email,filledBy:'alumno',displayName,avatarColor:'#1f56d6',visibility:kind==='minor'?'privado':'comunidad',program:'Business English',group:'Mar y jue · 19:30',message:'',guardianConsent:kind==='minor',...(kind==='minor'?{guardian:{name:'Tutor Ficticio',relationship:'Tutor',contact:'tutor@example.test'}}:{}),acceptRules:true,acceptPrivacy:true}),randomUUID())
    if(kind==='minor')repo.decide(receipt.id,1,'consent',actor,'Referencia inicial ficticia de navegador')
    repo.decide(receipt.id,kind==='minor'?2:1,'approve',actor);app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString())
    let postId=''
    if(kind!=='peer'){const user=await auth.login(email,'Frase ficticia de expediente para navegador 2026'),post=posts.create(user!,{title:`Historia ficticia ${browser} ${kind}`,body:'Contenido ficticio para comprobar la revisión del expediente.',category:'experience'},randomUUID());posts.decide(post.id,post.revision,'approve',actor,undefined,true);postId=post.id}
    accounts[browser]![kind]={id:receipt.id,firstName,lastName,displayName,email,birthDate,postId}
  }
}
await writeFile(join(directory,'browser.json'),JSON.stringify({accounts,port},null,2),{flag:'wx'})
app.server.listen(port,'127.0.0.1',()=>console.log(`API ficticia de expediente lista. Metadatos: ${join(directory,'browser.json')}`))
process.on('SIGINT',()=>app.server.close(()=>process.exit(0)))
