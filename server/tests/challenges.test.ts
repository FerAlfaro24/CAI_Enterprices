import assert from 'node:assert/strict'
import test from 'node:test'
import { once } from 'node:events'
import { request as httpRequest } from 'node:http'
import { randomUUID } from 'node:crypto'
import { mkdir,mkdtemp,rm } from 'node:fs/promises'
import { dirname,join,resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { studentAccounts } from '../student-accounts.ts'
import { hashPassword } from '../auth.ts'
import { validateSubmission } from '../validation.ts'
import { challengeBank } from '../challenge-bank.ts'
import { challengeDay,challengesRepository,validateChallenge } from '../challenges.ts'
import { backupLocalDatabase } from '../backup.ts'
import { verifyLocalBackup } from '../verify-backup.ts'
import { openDatabase } from '../database.ts'
import type { ChallengeSnapshot,DailyQuestion,ChallengeBankItem,ChallengeSchedule,ChallengeDefinition,ChallengeHistory } from '../contracts.ts'

test('Banco pedagógico: 180 preguntas originales, 45 temas y respuestas equilibradas',()=>{
 assert.equal(challengeBank.length,180);assert.equal(new Set(challengeBank.map(q=>q.id)).size,180)
 assert.equal(new Set(challengeBank.map(q=>q.topic)).size,45)
 for(const q of challengeBank){const {id,...definition}=q;assert.deepEqual(validateChallenge(definition,id),q)}
 for(const lane of ['grammar','words','everyday']){
  const pool=challengeBank.filter(q=>q.lane===lane);assert.equal(pool.length,60)
  assert.equal(new Set(pool.slice(0,15).map(q=>q.topic)).size,15)
  for(let index=0;index<3;index++)assert.equal(pool.filter(q=>q.correctIndex===index).length,20)
 }
 assert.equal(challengeDay(new Date('2026-11-13T05:59:59Z')),'2026-11-12')
 assert.equal(challengeDay(new Date('2026-11-13T06:00:00Z')),'2026-11-13')
})

test('Retos: calendario real, aprendizaje privado, administración y persistencia',async t=>{
 const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'challenges-')),path=join(directory,'fixture.sqlite')
 let time=new Date('2026-11-12T18:00:00Z'),app=createApplication(path,{}, {challengeClock:()=>time}),base=''
 const start=async()=>{app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const address=app.server.address();assert.ok(address&&typeof address==='object');base='http://127.0.0.1:'+address.port}
 const close=()=>new Promise<void>((resolve,reject)=>app.server.close(error=>error?reject(error):resolve()))
 await start();t.after(async()=>{if(app.server.listening)await close();assert.equal(dirname(directory),root);assert.ok(directory.startsWith(join(root,'challenges-')));await rm(directory,{recursive:true})})
 const password='Pruebas ficticias de retos CAI 2026',hash=await hashPassword(password)
 const admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(hash).lastInsertRowid),ids:Record<string,string>={}
 for(const name of ['alice','bob','carol','limited']){
  const receipt=accessRepository(app.db).submit(validateSubmission({firstName:'Alumno',lastName:'Ficticio',email:name+'@example.test',birthDate:'2000-01-01',filledBy:'alumno',program:'Business English',group:name==='carol'?'Viernes · 18:00':'Mar y jue · 19:30',displayName:'Alumno F.',avatarColor:'#1f56d6',visibility:'privado',message:'',guardianConsent:false,acceptRules:true,acceptPrivacy:true}),randomUUID())
  accessRepository(app.db).decide(receipt.id,1,'approve',admin);ids[name]=receipt.id;app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString())
 }
 const cookies:Record<string,string>={}
 const call=(route:string,method='GET',data?:unknown,actor='alice',key?:string,origin=base)=>fetch(base+'/api/local'+route,{method,headers:{Origin:origin,Cookie:cookies[actor]??'',...(data===undefined?{}:{'Content-Type':'application/json'}),...(key?{'Idempotency-Key':key}:{})},body:data===undefined?undefined:JSON.stringify(data)})
 const login=async(actor:string)=>{const r=await call(actor==='admin'?'/auth/login':'/student/login','POST',{email:actor+'@example.test',password},'anonymous');assert.equal(r.status,200);cookies[actor]=r.headers.getSetCookie().at(-1)!.split(';')[0]!}
 for(const actor of ['admin','alice','bob','carol','limited'])await login(actor)
 const snapshot=async(actor='alice')=>(await (await call('/student/challenges','GET',undefined,actor)).json()) as ChallengeSnapshot
 const answer=(q:DailyQuestion,index:number,key=randomUUID(),actor='alice')=>call('/student/challenges/'+q.id+'/answer','POST',{revision:q.revision,answerIndex:index},actor,key)
 const correct=(q:DailyQuestion)=>JSON.parse(String(app.db.prepare('SELECT content_json FROM daily_challenges WHERE id=?').get(Number(q.id.slice(2)))!.content_json)).correctIndex as number
 const groupId=Number(app.db.prepare("SELECT id FROM course_groups WHERE program='Business English' AND name='Mar y jue · 19:30'").get()!.id)
 const calendar=async(day='2026-11-12')=>(await (await call('/challenges/calendar?day='+day+'&groupId='+groupId,'GET',undefined,'admin')).json()) as {items:ChallengeSchedule[];controls:{enabled:boolean;revision:number}}
 const configure=async(enabled:boolean)=>{const c=(await calendar()).controls;assert.equal((await call('/challenges/controls','PATCH',{...c,enabled},'admin')).status,200)}
 const bank=async()=>(await (await call('/challenges/bank','GET',undefined,'admin')).json() as {items:ChallengeBankItem[]}).items
 const schedule=(item:ChallengeSchedule,bankId=item.question.id,state=item.state,day=item.day)=>call('/challenges/calendar','POST',{day,groupId,slot:item.slot,bankId,state,revision:item.revision},'admin')
 let first:DailyQuestion
 const key=randomUUID()
 await t.test('rutas privadas y respuestas no reveladas antes de participar',async()=>{
  for(const actor of ['anonymous','admin'])assert.equal((await call('/student/challenges','GET',undefined,actor)).status,401)
  for(const route of ['/challenges/bank','/challenges/controls','/challenges/calendar?day=2026-11-12&groupId='+groupId])assert.equal((await call(route)).status,401)
  const data=await snapshot();assert.equal(data.items.length,3);assert.equal(data.day,'2026-11-12');first=data.items[0]!
  assert.deepEqual(Object.keys(first).sort(),['attempt','day','id','instruction','kind','options','previousGroup','question','revision','slot','topic']);assert.equal(first.attempt,null)
  assert.equal(JSON.stringify(data).includes('correctIndex'),false);assert.equal(JSON.stringify(data).includes('@'),false)
  const peer=await snapshot('bob'),foreign=await snapshot('carol');assert.equal(peer.items[0]!.id,first.id);assert.notEqual(foreign.items[0]!.id,first.id);assert.equal(foreign.items[0]!.question,first.question)
  assert.equal((await answer(foreign.items[0]!,0)).status,404)
 })
 await t.test('valida origen, opciones, revisiones e identidad antes de puntuar',async()=>{
  const route='/student/challenges/'+first.id+'/answer'
  for(const answerIndex of [-1,3,1.5,'0',null])assert.equal((await call(route,'POST',{revision:first.revision,answerIndex},'alice',randomUUID())).status,400)
  assert.equal((await call(route,'POST',{revision:1,answerIndex:0,studentId:ids.bob},'alice',randomUUID())).status,400)
  assert.equal((await call(route,'POST',{revision:1,answerIndex:0})).status,400)
  assert.equal((await call(route,'POST',{revision:1,answerIndex:0},'alice',randomUUID(),'https://otro.example')).status,403)
  assert.equal((await answer({...first,revision:99},0)).status,409);assert.equal((await snapshot()).progress.answered,0)
 })
 await t.test('respuesta errónea enseña y da cinco puntos; replay no duplica',async()=>{
  const index=(correct(first)+1)%3,r=await answer(first,index,key);assert.equal(r.status,200)
  const original=await r.json() as {result:{points:number;correct:boolean;explanation:string;example:string}}
  assert.equal(original.result.points,5);assert.equal(original.result.correct,false);assert.ok(original.result.explanation.length>10);assert.ok(original.result.example.length>5)
  assert.deepEqual(await (await answer(first,index,key)).json(),original)
  assert.equal((await answer(first,correct(first),key)).status,409);assert.equal((await answer(first,index)).status,409)
  assert.equal((await snapshot()).progress.points,5);assert.equal((await snapshot('bob')).progress.answered,0);assert.equal((await snapshot('bob')).items[0]!.attempt,null)
 })
 await t.test('aciertos suman quince; completar las tres forma un día de constancia',async()=>{
  for(const q of (await snapshot()).items.filter(q=>!q.attempt))assert.equal((await answer(q,correct(q))).status,200)
  const p=(await snapshot()).progress;assert.equal(p.points,35);assert.equal(p.answered,3);assert.equal(p.correct,2);assert.equal(p.completedDays,1);assert.equal(p.currentStreak,1)
  const h=await (await call('/student/challenges/history')).json() as ChallengeHistory;assert.equal(h.items.length,3);assert.ok(h.items.every(q=>q.attempt?.explanation));assert.equal((await call('/student/challenges/history?before=x')).status,400)
 })
 await t.test('calendario a 90 días, banco privado editable y borradores excluidos',async()=>{
  const original=(await bank()).find(q=>q.lane==='grammar')!,{id:_,revision:__,status:___,source:____,...definition}=original;void _;void __;void ___;void ____
  const draft:Omit<ChallengeDefinition,'id'>={...definition,question:'A draft question for a future day.'},createKey=randomUUID()
  let response=await call('/challenges/bank','POST',{status:'draft',question:draft},'admin',createKey);assert.equal(response.status,200)
  const item=(await response.json() as {item:ChallengeBankItem}).item
  assert.equal((await call('/challenges/bank','POST',{status:'draft',question:draft},'admin',createKey)).status,200);assert.equal((await bank()).length,181)
  const future=(await calendar('2026-11-13')).items[0]!
  assert.equal((await schedule(future,item.id)).status,409)
  response=await call('/challenges/bank/'+item.id,'PATCH',{revision:1,status:'ready',question:draft},'admin');assert.equal(response.status,200)
  assert.equal((await call('/challenges/bank/'+item.id,'PATCH',{revision:1,status:'ready',question:draft},'admin')).status,409)
  assert.equal((await schedule(future,item.id)).status,200)
  assert.equal((await calendar('2026-11-13')).items[0]!.question.question,draft.question)
  assert.equal((await schedule(future,item.id)).status,409)
  for(const day of ['2026-02-30','2026-11-11','2027-12-01'])assert.ok((await schedule(future,item.id,'published',day)).status>=400)
  assert.equal((await schedule((await calendar('2026-11-14')).items[0]!,challengeBank.find(q=>q.lane==='words')!.id)).status,400)
  assert.equal((await call('/challenges/bank','POST',{status:'ready',question:{...draft,options:['same','same','other']}},'admin',randomUUID())).status,400)
 })
 await t.test('editar banco no cambia la pregunta servida; intentos congelan sustitución',async()=>{
  const item=(await calendar()).items[0]!,entry=(await bank()).find(q=>q.id===item.question.id)!,{id:_,revision:__,status:___,source:____,...definition}=entry;void _;void __;void ___;void ____
  assert.equal((await call('/challenges/bank/'+entry.id,'PATCH',{revision:entry.revision,status:'ready',question:{...definition,question:'A newly edited bank question for future days.'}},'admin')).status,200)
  assert.equal((await calendar()).items[0]!.question.question,item.question.question)
  assert.equal((await schedule(item,challengeBank.find(q=>q.lane==='grammar'&&q.id!==entry.id)!.id)).status,409)
  assert.equal((await schedule(item,item.question.id,'archived')).status,200)
  assert.equal((await snapshot('bob')).items.length,2);assert.equal((await snapshot()).items.length,3)
  assert.equal((await schedule((await calendar()).items[0]!,item.question.id,'published')).status,200)
 })
 await t.test('pausa conserva historial y replay, bloquea nuevas respuestas',async()=>{
  await configure(false);const bob=(await snapshot('bob')).items[0]!
  assert.equal((await snapshot()).enabled,false);assert.equal((await answer(bob,0,randomUUID(),'bob')).status,409)
  assert.equal((await answer(first,(correct(first)+1)%3,key)).status,200);assert.equal((await call('/student/challenges/history')).status,200);await configure(true)
 })
 await t.test('medianoche renueva preguntas sin reloj cliente, conserva historial y racha',async()=>{
  time=new Date('2026-11-13T05:59:59Z');assert.equal((await snapshot()).day,'2026-11-12')
  time=new Date('2026-11-13T06:00:00Z');let next=await snapshot();assert.equal(next.day,'2026-11-13');assert.equal(next.progress.currentStreak,1);assert.equal(next.progress.todayAnswered,0);assert.notEqual(next.items[1]!.question,first.question)
  assert.equal((await answer(first,0)).status,409);assert.equal((await answer(first,(correct(first)+1)%3,key)).status,200)
  for(const q of next.items)assert.equal((await answer(q,correct(q))).status,200)
  next=await snapshot();assert.equal(next.progress.currentStreak,2);assert.equal(next.progress.longestStreak,2)
  time=new Date('2026-11-15T18:00:00Z');assert.equal((await snapshot()).progress.currentStreak,0);assert.equal((await snapshot()).progress.longestStreak,2)
 })
 await t.test('rotación de 60 días sin repetir preguntas por área',async()=>{
  const repo=challengesRepository(app.db,()=>time),user=(await studentAccounts(app.db).login('bob@example.test',password))!,seen=new Set<string>()
  // El banco nuevo/manual afecta gramática; las otras dos áreas conservan su ciclo de 60.
  for(let day=0;day<60;day++){time=new Date(Date.UTC(2026,11,1+day,18));const data=repo.snapshot(user);for(const q of data.items.filter(q=>q.slot>0)){assert.ok(!seen.has(q.question));seen.add(q.question)}}
  assert.equal(seen.size,120);time=new Date('2026-11-15T18:00:00Z')
 })
 await t.test('cambio de grupo no permite repetir puntos del día ni expone progreso ajeno',async()=>{
  const q=(await snapshot()).items[0]!;assert.equal((await answer(q,correct(q))).status,200)
  const row=app.db.prepare('SELECT payload FROM requests WHERE id=?').get(Number(ids.alice!.slice(4)))!,payload=JSON.parse(String(row.payload));payload.group='Viernes · 18:00';app.db.prepare('UPDATE requests SET payload=? WHERE id=?').run(JSON.stringify(payload),Number(ids.alice!.slice(4)))
  const after=await snapshot();assert.equal(after.items[0]!.previousGroup,true);assert.equal(after.items[0]!.id,q.id)
  const foreign=(await snapshot('carol')).items[0]!;assert.equal((await answer(foreign,0)).status,409)
  payload.group='Por asignar';app.db.prepare('UPDATE requests SET payload=? WHERE id=?').run(JSON.stringify(payload),Number(ids.alice!.slice(4)))
  assert.equal((await snapshot()).needsGroup,true);assert.equal((await snapshot()).items.length,1);assert.equal((await call('/student/challenges/history')).status,200)
 })
 await t.test('revoca una sesión mientras llega el cuerpo y conserva cero nuevas respuestas',async()=>{
  const q=(await snapshot('bob')).items[0]!,count=app.db.prepare('SELECT COUNT(*) AS n FROM challenge_attempts').get()!.n
  const status=await new Promise<number>((resolve,reject)=>{
   const req=httpRequest(base+'/api/local/student/challenges/'+q.id+'/answer',{method:'POST',headers:{Origin:base,Cookie:cookies.bob!,'Content-Type':'application/json','Idempotency-Key':randomUUID(),'Transfer-Encoding':'chunked'}},response=>{response.resume();response.on('end',()=>resolve(response.statusCode!))});req.on('error',reject);req.write('{"revision":');setTimeout(()=>{app.db.prepare('DELETE FROM student_sessions WHERE request_id=?').run(Number(ids.bob!.slice(4)));req.end(q.revision+',"answerIndex":0}')},30)
  });assert.equal(status,401);assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM challenge_attempts').get()!.n,count)
 })
 await t.test('limita intentos por cuenta sin impedir consultar o usar otras cuentas',async()=>{
  const q=(await snapshot('limited')).items[0]!
  for(let i=0;i<60;i++)assert.equal((await answer(q,-1,randomUUID(),'limited')).status,400)
  assert.equal((await answer(q,-1,randomUUID(),'limited')).status,429)
  assert.equal((await call('/student/challenges','GET',undefined,'limited')).status,200)
  assert.equal((await call('/student/challenges','GET',undefined,'carol')).status,200)
 })
 await t.test('copia independiente y reinicio conservan preguntas, respuestas y auditoría',async()=>{
  const before=await snapshot(),history=await (await call('/student/challenges/history')).json(),copy=await backupLocalDatabase(path,join(directory,'copies'));assert.equal((await verifyLocalBackup(copy)).schema,15)
  await close();app=createApplication(copy,{}, {challengeClock:()=>time});await start();assert.deepEqual(await snapshot(),before);assert.deepEqual(await (await call('/student/challenges/history')).json(),history)
  assert.ok(app.db.prepare("SELECT COUNT(*) AS n FROM administration_audit WHERE kind LIKE 'challenge%'").get()!.n as number>0)
 })
 await t.test('migración 14→15 aditiva, banco sembrado una sola vez',async()=>{
  const copy=await backupLocalDatabase(path,join(directory,'legacy')),legacy=openDatabase(copy),before=legacy.prepare('SELECT * FROM requests ORDER BY id').all()
  legacy.exec('DROP TABLE challenge_attempts; DROP TABLE daily_challenges; DROP TABLE challenge_bank; DROP TABLE challenge_controls; DELETE FROM migrations WHERE version=15');legacy.close();assert.equal((await verifyLocalBackup(copy)).schema,14)
  const upgraded=openDatabase(copy);assert.deepEqual(upgraded.prepare('SELECT * FROM requests ORDER BY id').all(),before);assert.equal(upgraded.prepare('SELECT COUNT(*) AS n FROM challenge_bank').get()!.n,180);upgraded.prepare("UPDATE challenge_bank SET status='archived' WHERE id='grammar-001'").run();upgraded.close()
  const reopened=openDatabase(copy);try{assert.equal(reopened.prepare("SELECT status FROM challenge_bank WHERE id='grammar-001'").get()!.status,'archived');assert.equal(reopened.prepare('SELECT COUNT(*) AS n FROM challenge_bank').get()!.n,180)}finally{reopened.close()}
 })
})
