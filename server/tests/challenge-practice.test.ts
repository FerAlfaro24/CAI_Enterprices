import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdir,mkdtemp } from 'node:fs/promises'
import { join,resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { challengesRepository,challengeDay,nextChallengeRefresh } from '../challenges.ts'
import { studentAccounts } from '../student-accounts.ts'
import { accessRepository } from '../access-repository.ts'
import { validateSubmission } from '../validation.ts'
import { hashPassword } from '../auth.ts'
import { dailyPractice,renewalLabel } from '../../shared/challenge-practice.ts'

test('Práctica diaria: renovación autorizada, resultados y continuidad',async t=>{
 const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'practice-refresh-')),path=join(directory,'fixture.sqlite')
 let time=new Date('2026-11-24T18:00:00.000Z'),app=createApplication(path),repo=challengesRepository(app.db,()=>time)
 t.after(()=>app.db.close())
 const hash=await hashPassword('abcdefgh'),admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('practice@example.test','Coordinación',?,'admin')").run(hash).lastInsertRowid)
 const receipt=accessRepository(app.db).submit(validateSubmission({className:'Francés',firstName:'Práctica',lastName:'Ficticia',birthDate:'2000-01-01',email:'practice-student@example.test',displayName:'Práctica F.',avatarColor:'#1f56d6',visibility:'privado',message:'',acceptRules:true,acceptPrivacy:true}),randomUUID())
 accessRepository(app.db).decide(receipt.id,1,'approve',admin);app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString())
 const user=(await studentAccounts(app.db).login('practice-student@example.test','abcdefgh'))!
 await t.test('siguiente renovación es la frontera exacta CDMX y no la medianoche UTC',()=>{
  for(const value of ['2026-11-24T05:59:59.999Z','2026-11-24T06:00:00.000Z','2026-12-31T23:59:00.000Z','2028-02-29T18:00:00.000Z']){
   const now=new Date(value),next=Date.parse(nextChallengeRefresh(now));assert.ok(next>now.getTime());assert.equal(challengeDay(new Date(next-1)),challengeDay(now));assert.notEqual(challengeDay(new Date(next)),challengeDay(now))
  }
  assert.equal(nextChallengeRefresh(new Date('2026-11-24T05:59:59.999Z')),'2026-11-24T06:00:00.000Z')
  assert.equal(nextChallengeRefresh(new Date('2026-11-24T06:00:00.000Z')),'2026-11-25T06:00:00.000Z')
 })
 await t.test('instantánea trae reloj y renovación sin respuestas futuras ni datos personales',()=>{
  const value=repo.snapshot(user);assert.equal(value.serverTime,time.toISOString());assert.equal(value.nextRefreshAt,'2026-11-25T06:00:00.000Z');assert.equal(value.items.length,3)
  assert.ok(!JSON.stringify(value).includes('correctIndex'));assert.ok(!JSON.stringify(value).includes('@example.test'));assert.equal(value.needsGroup,false)
  assert.deepEqual(dailyPractice(value.items),{answered:0,correct:0,review:0,points:0,nextId:value.items[0]!.id,reviewId:undefined})
 })
 await t.test('dos aciertos y un error suman35; un completado no equivale a acierto',()=>{
  const questions=repo.snapshot(user).items
  for(const [index,q] of questions.entries()){
   const correct=JSON.parse(String(app.db.prepare('SELECT content_json FROM daily_challenges WHERE id=?').get(Number(q.id.slice(2)))!.content_json)).correctIndex as number
   const key=randomUUID(),data={revision:q.revision,answerIndex:index===1?(correct+1)%q.options.length:correct}
   const answer=repo.answer(user,q.id,data,key);assert.deepEqual(repo.answer(user,q.id,data,key),answer)
  }
  const snapshot=repo.snapshot(user),today=dailyPractice(snapshot.items)
  assert.equal(today.points,35);assert.equal(today.answered,3);assert.equal(today.correct,2);assert.equal(today.review,1);assert.equal(today.reviewId,snapshot.items[1]!.id);assert.equal(today.nextId,undefined)
  assert.equal(snapshot.progress.points,35);assert.equal(snapshot.progress.completedDays,1)
  const before=JSON.stringify(snapshot.items);dailyPractice(snapshot.items);assert.equal(JSON.stringify(snapshot.items),before)
 })
 await t.test('renovar conserva acumulado e historial y empieza hoy en cero',()=>{
  const before=repo.snapshot(user);time=new Date(before.nextRefreshAt);const after=repo.snapshot(user),today=dailyPractice(after.items)
  assert.equal(after.day,'2026-11-25');assert.equal(after.serverTime,time.toISOString());assert.equal(after.nextRefreshAt,'2026-11-26T06:00:00.000Z');assert.equal(today.points,0);assert.equal(after.progress.points,35);assert.equal(after.progress.todayAnswered,0)
  assert.equal(after.progress.currentStreak,1);assert.equal(repo.history(user).items.length,3);assert.ok(after.items.every(q=>!before.items.some(old=>old.id===q.id)))
  assert.ok(!JSON.stringify(after.items).includes('correctIndex'))
 })
 await t.test('pausa conserva resultados y sigue informando la fecha de renovación',()=>{
  repo.configure({revision:repo.controls().revision,enabled:false},admin);const snapshot=repo.snapshot(user)
  assert.equal(snapshot.enabled,false);assert.equal(snapshot.progress.points,35);assert.equal(snapshot.nextRefreshAt,'2026-11-26T06:00:00.000Z');assert.equal(repo.history(user).items.length,3)
 })
 await t.test('reiniciar conserva reloj de prueba, progreso y resultados sin otra migración',()=>{
  const before=repo.snapshot(user);app.db.close();app=createApplication(path);repo=challengesRepository(app.db,()=>time)
  assert.deepEqual(repo.snapshot(user),before);assert.equal(app.db.prepare('SELECT max(version) AS n FROM migrations').get()!.n,23)
 })
 await t.test('lectura de renovación redondea minutos y no fabrica un plazo',()=>{
  assert.equal(renewalLabel(1),'En 1 min');assert.equal(renewalLabel(60*60000),'En 1 h');assert.equal(renewalLabel(61*60000),'En 1 h 1 min');assert.equal(renewalLabel(0),'Ya es un nuevo día de práctica');assert.ok(renewalLabel(NaN).includes('Ciudad de México'))
 })
})
