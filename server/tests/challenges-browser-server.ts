/** Entorno nuevo y ficticio: nunca abre bases o accesos habituales. */
import { mkdir,mkdtemp,writeFile } from 'node:fs/promises'
import { join,resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { studentAccounts } from '../student-accounts.ts'
import { challengesRepository } from '../challenges.ts'
import { validateSubmission } from '../validation.ts'

if(process.env.NODE_ENV==='production')throw new Error('Solo pruebas ficticias locales.')
const port=Number(process.env.CAI_API_PORT??3101)
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Puerto inválido.')
const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'challenges-browser-'))
let time=new Date('2026-11-12T18:00:00Z')
const app=createApplication(join(directory,'fixture.sqlite'),{}, {challengeClock:()=>time}),password='Frase ficticia de retos navegador 2026',hash=await hashPassword(password)
const admin={email:'admin-challenges@example.test',name:'Coordinación'},actor=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,?,?,'admin')").run(admin.email,admin.name,hash).lastInsertRowid)
const fixtures:Record<string,{accounts:Record<string,{email:string}>;day:string;correct:number[];groupId:number;historyCount:number}>={}
for(const browser of ['brave','opera']){
 const accounts:Record<string,{email:string}>={}
 for(const kind of ['author','peer','outside']){
  const email=browser+'-'+kind+'-challenges@example.test',receipt=accessRepository(app.db).submit(validateSubmission({firstName:'Alumno',lastName:'Ficticio',birthDate:'2000-01-01',email,filledBy:'alumno',program:'Business English',group:kind==='outside'?'Viernes · 18:00':'Mar y jue · 19:30',displayName:'Prueba '+kind,avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}),randomUUID())
  accessRepository(app.db).decide(receipt.id,1,'approve',actor);app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString());accounts[kind]={email}
 }
 const user=(await studentAccounts(app.db).login(accounts.author!.email,password))!,repo=challengesRepository(app.db,()=>time)
 for(let day=3;day<12;day++){
  time=new Date(`2026-11-${String(day).padStart(2,'0')}T18:00:00Z`)
  for(const q of repo.snapshot(user).items){const definition=JSON.parse(String(app.db.prepare('SELECT content_json FROM daily_challenges WHERE id=?').get(Number(q.id.slice(2)))!.content_json));repo.answer(user,q.id,{revision:q.revision,answerIndex:definition.correctIndex},randomUUID())}
 }
 time=new Date('2026-11-12T18:00:00Z')
 const daily=repo.snapshot(user),correct=daily.items.map(q=>JSON.parse(String(app.db.prepare('SELECT content_json FROM daily_challenges WHERE id=?').get(Number(q.id.slice(2)))!.content_json)).correctIndex as number)
 fixtures[browser]={accounts,day:daily.day,correct,groupId:Number(app.db.prepare("SELECT id FROM course_groups WHERE program='Business English' AND name='Mar y jue · 19:30'").get()!.id),historyCount:27}
}
await writeFile(join(directory,'browser.json'),JSON.stringify({admin,fixtures,port},null,2),{flag:'wx'})
app.server.listen(port,'127.0.0.1',()=>console.log('API ficticia de retos lista. Metadatos: '+join(directory,'browser.json')))
process.on('SIGINT',()=>app.server.close(()=>process.exit(0)))
