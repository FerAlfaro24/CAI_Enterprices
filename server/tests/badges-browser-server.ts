/** Solo datos y base nuevos de prueba. Nunca abre el entorno habitual. */
import { mkdir,mkdtemp,writeFile } from 'node:fs/promises'
import { join,resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { accessRepository } from '../access-repository.ts'
import { studentAccounts } from '../student-accounts.ts'
import { challengesRepository } from '../challenges.ts'
import { badgesRepository } from '../badges.ts'
import { validateSubmission } from '../validation.ts'
if(process.env.NODE_ENV==='production')throw new Error('Solo pruebas ficticias locales.')
const port=Number(process.env.CAI_API_PORT??3101)
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Puerto inválido.')
const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'badges-browser-'))
let time=new Date('2026-11-05T18:00:00Z')
const app=createApplication(join(directory,'fixture.sqlite'),{}, {challengeClock:()=>time}),password='Frase ficticia de insignias navegador 2026',hash=await hashPassword(password),admin={email:'admin-badges@example.test',name:'Coordinación'}
const actor=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,?,?,'admin')").run(admin.email,admin.name,hash).lastInsertRowid),fixtures:Record<string,unknown>={}
for(const browser of ['brave','opera']){
 const accounts:Record<string,{email:string;id:string}>={}
 for(const kind of ['author','peer','outside']){
  const email=`${browser}-${kind}-badges@example.test`,receipt=accessRepository(app.db).submit(validateSubmission({firstName:'Alumno',lastName:'Ficticio',birthDate:'2000-01-01',email,filledBy:'alumno',program:'Business English',group:kind==='outside'?'Viernes · 18:00':'Mar y jue · 19:30',displayName:'Prueba '+kind+' '+browser,avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}),randomUUID())
  accessRepository(app.db).decide(receipt.id,1,'approve',actor);app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString());accounts[kind]={email,id:receipt.id}
 }
 const user=(await studentAccounts(app.db).login(accounts.author!.email,password))!,challenges=challengesRepository(app.db,()=>time),badges=badgesRepository(app.db)
 for(let day=1;day<=4;day++){time=new Date(`2026-11-0${day}T18:00:00Z`);for(const q of challenges.snapshot(user).items)challenges.answer(user,q.id,{revision:q.revision,answerIndex:0},randomUUID())}
 time=new Date('2026-11-05T18:00:00Z');badges.snapshot(user)
 const peer=(await studentAccounts(app.db).login(accounts.peer!.email,password))!
 const pending=badges.apply(peer,{badgeId:'music-catcher',description:'Una aventura musical pendiente de revisión para probar el bloqueo.'},randomUUID())
 for(let i=0;i<23;i++){const item=badges.apply(peer,{badgeId:'book-buddy',description:'Una lectura de muestra para revisar el historial privado '+i},randomUUID());badges.decide(item.id,'reject',{revision:1,reason:'Amplía el ejemplo ficticio y explica lo que aprendiste.',confirmed:true},actor)}
 fixtures[browser]={accounts,day:'2026-11-05',buriedRequest:pending.id}
}
await writeFile(join(directory,'browser.json'),JSON.stringify({admin,fixtures,port},null,2),{flag:'wx'})
app.server.listen(port,'127.0.0.1',()=>console.log('API ficticia de insignias lista. Metadatos: '+join(directory,'browser.json')))
process.on('SIGINT',()=>app.server.close(()=>process.exit(0)))
