import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { mkdir,mkdtemp } from 'node:fs/promises'
import { resolve,join } from 'node:path'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { studentAccounts } from '../student-accounts.ts'
import { validateSubmission } from '../validation.ts'
import { hashPassword } from '../auth.ts'
import { learningRepository } from '../learning.ts'
import { publications } from '../publications.ts'
import { badgesRepository } from '../badges.ts'
import { learningLimits,learningPublicationBody,learningPublicationLimits } from '../../shared/learning.ts'
import type { LearningDraft } from '../contracts.ts'

test('Logros simples: mínimos, límites completos, privacidad y publicación sin truncar',async t=>{
 const root=resolve('.local/tests');await mkdir(root,{recursive:true})
 const directory=await mkdtemp(join(root,'learning-form-')),app=createApplication(join(directory,'fixture.sqlite'))
 t.after(()=>app.db.close())
 const hash=await hashPassword('abcdefgh'),admin=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('qa@example.test','Coordinación',?,'admin')").run(hash).lastInsertRowid)
 const accounts=studentAccounts(app.db),access=accessRepository(app.db),repo=learningRepository(app.db),posts=publications(app.db)
 const create=async(name:string)=>{
  const receipt=access.submit(validateSubmission({className:'Inglés',firstName:name,lastName:'Prueba',birthDate:'2000-01-01',email:name+'@example.test',displayName:name+' P.',avatarColor:'#1f56d6',visibility:'privado',message:'',acceptRules:true,acceptPrivacy:true}),randomUUID())
  access.decide(receipt.id,1,'approve',admin);app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)),hash,new Date().toISOString())
  return (await accounts.login(name+'@example.test','abcdefgh'))!
 }
 const student=await create('alice'),peer=await create('bob')
 const base:LearningDraft={category:'reading',title:'A',practice:'B',expression:'',example:'',state:'completed',images:[]}
 const save=(value:LearningDraft)=>repo.save(student,null,value,randomUUID(),()=>true)
 await t.test('un carácter en nombre y aprendizaje; opcionales vacíos y guardado privado',async()=>{
  const item=await save(base);assert.equal(item.title,'A');assert.equal(item.practice,'B');assert.equal(item.review,'none');assert.equal(item.publication,null);assert.equal(posts.feed(peer).length,0)
  repo.submit(student,item.id,{revision:item.revision,share:true,confirmed:true})
  let current=repo.mine(student).items.find(x=>x.id===item.id)!;assert.equal(current.publication!.status,'pendiente');assert.equal(posts.feed(peer).length,0)
  posts.decide(current.publication!.id,current.publication!.revision,'approve',admin,undefined,true)
  const post=posts.feed(peer)[0]!;assert.equal(post.title,'A');assert.equal(post.body,'B');assert.equal(learningPublicationBody(base),'B')
  current=repo.mine(student).items.find(x=>x.id===item.id)!;assert.equal(current.review,'approved')
 })
 await t.test('máximos compartidos llegan completos a revisión y a la comunidad',async()=>{
  const value={...base,title:'N'.repeat(learningLimits.titleMax),practice:'L'.repeat(learningLimits.practiceMax),expression:'P'.repeat(learningLimits.expressionMax),example:'E'.repeat(learningLimits.legacyExampleMax)}
  const item=await save(value);repo.submit(student,item.id,{revision:item.revision,share:true,confirmed:true})
  const review=repo.reviews().items.find(x=>x.id===item.id)!;assert.equal(review.practice,value.practice);assert.equal(review.expression,value.expression);assert.equal(review.example,value.example)
  const post=posts.review().find(x=>x.id===review.publication!.id)!;assert.equal(post.title,value.title);assert.equal(post.body,learningPublicationBody(value));assert.ok(post.body.length>1200&&post.body.length<=learningPublicationLimits.bodyMax)
  posts.decide(post.id,post.revision,'approve',admin,undefined,true);assert.equal(posts.feed(peer).find(x=>x.id===post.id)!.body,post.body)
 })
 await t.test('rechaza exceso y espacios obligatorios; no cambia límites de historias normales',async()=>{
  for(const extra of [{title:'x'.repeat(301)},{practice:'x'.repeat(5001)},{expression:'x'.repeat(1001)},{example:'x'.repeat(301)},{title:' '},{practice:'\n '}])await assert.rejects(save({...base,...extra}),{status:400})
  const before=posts.mine(student).length
  const {validatePublication}=await import('../publications.ts')
  assert.throws(()=>validatePublication({title:'A',body:'B',category:'achievement'}),{status:400});assert.equal(posts.mine(student).length,before)
 })
 await t.test('borrador sin aprendizaje se completa después, con ejemplo histórico intacto',async()=>{
  const item=await save({...base,state:'draft',practice:'',example:'Ejemplo guardado anteriormente'})
  assert.throws(()=>repo.submit(student,item.id,{revision:item.revision,share:true,confirmed:true}),{status:409})
  const next=await repo.save(student,item.id,{...base,state:'completed',example:item.example,revision:item.revision},randomUUID(),()=>true)
  assert.equal(next.example,item.example);assert.equal(next.state,'completed')
  assert.equal(learningPublicationBody({...base,example:item.example}),'B\n\nEjemplo:\n'+item.example)
 })
 await t.test('símbolos Unicode y palabras opcionales no exigen ejemplo nuevo',async()=>{
  const item=await save({...base,title:'🎬',practice:'✓',expression:'go'})
  assert.equal(item.example,'');assert.equal(item.expression,'go');assert.equal(learningPublicationBody(item),'✓\n\nPalabras o frases:\ngo')
 })
 await t.test('insignias siguen contando logros distintos validados aunque no tengan expresión',async()=>{
  const item=await save({...base,title:'C',practice:'D'});repo.submit(student,item.id,{revision:item.revision,share:false,confirmed:true})
  const pending=repo.reviews().items.find(x=>x.id===item.id)!
  repo.decide(item.id,{revision:pending.revision,decision:'approve',reason:'Revisión ficticia del aprendizaje',confirmed:true},admin)
  assert.ok(badgesRepository(app.db).snapshot(student).grants.some(x=>x.badge.id==='book-buddy'))
  assert.equal(app.db.prepare('SELECT max(version) AS n FROM migrations').get()!.n,23)
 })
})
