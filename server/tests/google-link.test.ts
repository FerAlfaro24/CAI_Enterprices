import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { createApplication } from '../app.ts'
import { accessRepository } from '../access-repository.ts'
import { studentAccounts } from '../student-accounts.ts'
import { hashPassword } from '../auth.ts'
import { validateSubmission } from '../validation.ts'
import type { GoogleIdentity } from '../google-auth.ts'

test('Google vinculado: sesión propia, mismo correo y revalidación tras red',async t=>{
  let release:(()=>void)|undefined
  const app=createApplication(':memory:',{clientId:'123456-linkfixture.apps.googleusercontent.com',verify:async credential=>{
    const data=JSON.parse(credential.slice(8)) as GoogleIdentity & {pause?:boolean}
    if(data.pause)await new Promise<void>(resolve=>{release=resolve})
    return data
  }})
  app.server.listen(0,'127.0.0.1');await once(app.server,'listening');t.after(()=>new Promise<void>(resolve=>app.server.close(()=>resolve())))
  const address=app.server.address();assert.ok(address&&typeof address==='object');const base=`http://127.0.0.1:${address.port}`,jar=new Map<string,string>(),anonymous=new Map<string,string>()
  const call=async(path:string,data?:unknown,cookies=jar)=>{
    const r=await fetch(base+'/api/local'+path,{method:data?'POST':'GET',headers:{Origin:base,Cookie:[...cookies].map(([key,value])=>key+'='+value).join('; '),...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})})
    for(const item of r.headers.getSetCookie()){const [name,value]=item.split(';')[0]!.split('=');if(value)cookies.set(name!,value);else cookies.delete(name!)}return r
  }
  const encoded=await hashPassword('abcdefgh'),actor=Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(encoded).lastInsertRowid)
  const repo=accessRepository(app.db),accounts=studentAccounts(app.db)
  const student=repo.submit(validateSubmission({className:'Inglés',firstName:'Cuenta',lastName:'Anterior',birthDate:'2000-01-01',email:'anterior@example.test',displayName:'Cuenta A.',avatarColor:'#1f56d6',visibility:'privado',message:'',acceptRules:true,acceptPrivacy:true}),randomUUID())
  repo.decide(student.id,1,'approve',actor);app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(student.id.slice(4)),encoded,new Date().toISOString())
  const credential=async(email:string,pause=false)=>{const r=await call('/google/challenge',{}),{nonce}=await r.json() as {nonce:string};return 'fixture:'+JSON.stringify({subject:'subject-'+email,email,nonce,pause})}
  await t.test('visitante y correo coincidente no pueden vincular sin contraseña previa',async()=>{
    assert.equal((await call('/student/google',undefined,anonymous)).status,401)
    assert.equal((await call('/student/google/link',{credential:'x'.repeat(25)},anonymous)).status,401)
    const value=await credential('anterior@example.test');assert.equal((await call('/google/signin',{credential:value})).status,409)
    assert.equal(app.db.prepare('SELECT count(*) AS n FROM google_identities').get()!.n,0)
  })
  await t.test('una sesión válida no permite asociar un Google de otro correo',async()=>{
    assert.equal((await call('/student/login',{email:'anterior@example.test',password:'abcdefgh'})).status,200)
    assert.equal((await call('/student/google/link',{credential:await credential('otra@example.test')})).status,409)
    assert.equal(app.db.prepare('SELECT count(*) AS n FROM google_identities').get()!.n,0)
  })
  await t.test('revocar durante la verificación cancela aunque la cuenta se reactive',async()=>{
    const value=await credential('anterior@example.test',true),pending=call('/student/google/link',{credential:value})
    for(let i=0;i<100&&!release;i++)await new Promise(resolve=>setTimeout(resolve,5))
    assert.ok(release);repo.setStudentStatus(student.id,1,'suspendido',actor);repo.setStudentStatus(student.id,2,'activo',actor);release()
    assert.equal((await pending).status,401);assert.equal(app.db.prepare('SELECT count(*) AS n FROM google_identities').get()!.n,0)
  })
  await t.test('vincular conserva contraseña, perfil e inscripción y permite Google',async()=>{
    assert.equal((await call('/student/login',{email:'anterior@example.test',password:'abcdefgh'})).status,200)
    const value=await credential('anterior@example.test');assert.equal((await call('/student/google/link',{credential:value})).status,200)
    assert.deepEqual(await(await call('/student/google')).json(),{enabled:true,linked:true})
    assert.equal(accounts.forGoogle('subject-anterior@example.test')?.id,student.id);assert.ok(await accounts.login('anterior@example.test','abcdefgh'))
    assert.equal(repo.requests().length,1);assert.equal(repo.requests()[0]!.signInMethod,'google')
    assert.equal((await call('/student/google/link',{credential:value})).status,401)
  })
  await t.test('cerrar sesión y entrar por Google vuelve a la misma comunidad',async()=>{
    await call('/student/logout',{})
    const response=await call('/google/signin',{credential:await credential('anterior@example.test')})
    assert.equal(response.status,200);assert.deepEqual(await response.json(),{destination:'/community'})
    assert.equal((await(await call('/student/session')).json() as {user:{id:string}}).user.id,student.id)
  })
})
