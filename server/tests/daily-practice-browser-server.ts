/** Fixture exclusiva de F5. El reloj se controla por archivo local, sin rutas de prueba en el producto. */
import {mkdir,mkdtemp,writeFile,readFile} from 'node:fs/promises'
import {readFileSync} from 'node:fs'
import {join,resolve} from 'node:path'
import {randomUUID} from 'node:crypto'
import {createApplication} from '../app.ts'
import {hashPassword} from '../auth.ts'
import {accessRepository} from '../access-repository.ts'
import {studentAccounts} from '../student-accounts.ts'
import {challengesRepository} from '../challenges.ts'
import {validateSubmission} from '../validation.ts'

if(process.env.NODE_ENV==='production')throw Error('Solo QA local ficticia.')
const port=Number(process.env.CAI_API_PORT??3284)
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Puerto inválido.')
const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'daily-practice-browser-')),clockPath=join(directory,'clock.json')
await writeFile(clockPath,JSON.stringify({now:'2026-11-24T18:00:00.000Z'}),{flag:'wx'})
let seeding:string|null=null
const clock=()=>new Date(seeding??(JSON.parse(readFileSync(clockPath,'utf8')) as {now:string}).now)
const app=createApplication(join(directory,'fixture.sqlite'),{}, {challengeClock:clock}),password='Frase ficticia de práctica diaria CAI 2026',hash=await hashPassword(password),email='daily-practice-admin@example.test'
const admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,'Coordinación QA',?,'admin')").run(email,hash).lastInsertRowid)
const fixtures:Record<string,{author:string;peer:string;correct:number[];previousPoints:number}>={}
for(const label of ['brave','opera']){
 const people:Record<string,string>={}
 for(const kind of ['author','peer']){
  const email=label+'-'+kind+'-practice@example.test',access=accessRepository(app.db)
  const receipt=access.submit(validateSubmission({className:kind==='author'?'Francés':'Inglés',firstName:'Práctica',lastName:'Ficticia',birthDate:'2000-01-01',email,displayName:'Práctica '+label+' '+kind,avatarColor:'#1f56d6',visibility:'privado',message:'',acceptRules:true,acceptPrivacy:true}),randomUUID())
  access.decide(receipt.id,1,'approve',admin);app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString());people[kind]=email
 }
 const user=(await studentAccounts(app.db).login(people.author!,password))!,repo=challengesRepository(app.db,clock)
 seeding='2026-11-23T18:00:00.000Z'
 for(const q of repo.snapshot(user).items){const definition=JSON.parse(String(app.db.prepare('SELECT content_json FROM daily_challenges WHERE id=?').get(Number(q.id.slice(2)))!.content_json));repo.answer(user,q.id,{revision:q.revision,answerIndex:definition.correctIndex},randomUUID())}
 seeding=null
 const correct=repo.snapshot(user).items.map(q=>Number((JSON.parse(String(app.db.prepare('SELECT content_json FROM daily_challenges WHERE id=?').get(Number(q.id.slice(2)))!.content_json)) as {correctIndex:number}).correctIndex))
 fixtures[label]={author:people.author!,peer:people.peer!,correct,previousPoints:45}
}
await writeFile(join(directory,'browser.json'),JSON.stringify({directory,port,email,password,clockPath,fixtures,clock:JSON.parse(await readFile(clockPath,'utf8'))},null,2),{flag:'wx'})
app.server.listen(port,'127.0.0.1',()=>console.log(join(directory,'browser.json')))
process.on('SIGINT',()=>app.server.close(()=>process.exit(0)))
