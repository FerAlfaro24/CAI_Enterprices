import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { randomUUID } from 'node:crypto'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { schoolClasses } from '../../shared/school-classes.ts'

test('Registro por clase: menores sin tutor, matrícula automática y catálogo independiente', async t => {
  const app=createApplication(':memory:')
  app.server.listen(0,'127.0.0.1');await once(app.server,'listening')
  t.after(async()=>{await new Promise<void>(r=>app.server.close(()=>r()))})
  const base=`http://127.0.0.1:${(app.server.address() as {port:number}).port}`
  const password='Frase de coordinación ficticia 2026'
  app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Coordinación',?,'admin')").run(await hashPassword(password))
  const call=(path:string,method='GET',data?:unknown,cookie='',key=randomUUID())=>fetch(base+'/api/local'+path,{method,headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json','Idempotency-Key':key},body:data===undefined?undefined:JSON.stringify(data)})
  const login=await call('/auth/login','POST',{email:'admin@example.test',password});assert.equal(login.status,200)
  const cookie=login.headers.getSetCookie().at(-1)!.split(';')[0]!
  app.db.prepare('UPDATE course_groups SET active=0').run()
  const input=(className:string,email:string)=>({className,firstName:'Alumno',lastName:'Prueba',birthDate:'2016-01-01',email,displayName:'Alumno P.',avatarColor:'#1f56d6',visibility:'privado',message:'',acceptRules:true,acceptPrivacy:true})
  const ids:string[]=[]
  for(const [index,className] of schoolClasses.entries())await t.test(`alta y aprobación de ${className} sin grupo ni autorización`,async()=>{
    const data=input(className,`class-${index}@example.test`),key=randomUUID()
    const response=await call('/requests','POST',data,'',key);assert.equal(response.status,201)
    const receipt=await response.json() as {id:string};ids.push(receipt.id);assert.match(receipt.id,/^CAI-\d{4,}$/)
    assert.deepEqual(await(await call('/requests','POST',data,'',key)).json(),receipt)
    const requests=await(await call('/requests','GET',undefined,cookie)).json() as {requests:{id:string;revision:number;guardianConsent?:string;program:string;applicant:{group:string;studentCode:string}}[]}
    const row=requests.requests.find(r=>r.id===receipt.id)!
    assert.equal(row.program,className);assert.equal(row.applicant.group,'');assert.equal(row.applicant.studentCode,receipt.id);assert.equal(row.guardianConsent,undefined)
    const saved=JSON.parse(String(app.db.prepare('SELECT payload FROM requests WHERE id=?').get(Number(receipt.id.slice(4)))!.payload))
    assert.equal(saved.guardianConsent,false);assert.equal(saved.guardian,undefined)
    assert.equal((await call('/requests/'+receipt.id+'/approve','POST',{revision:row.revision},cookie)).status,200)
    assert.equal(app.db.prepare('SELECT count(*) AS n FROM consent_confirmations').get()!.n,0)
    const record=await(await call('/students/'+receipt.id+'/record','GET',undefined,cookie)).json() as {record:{revision:number;guardianRequired:boolean}}
    assert.equal(record.record.guardianRequired,false)
    if(index===0){
      const update={firstName:'Nuevo',lastName:'Prueba',birthDate:'2016-01-01',studentCode:'',guardian:null,revision:record.record.revision,reason:'Corrección ficticia del nombre',consentReference:'',currentPassword:password,confirmed:true}
      const corrected=await call('/students/'+receipt.id+'/record','PATCH',update,cookie);assert.equal(corrected.status,200,await corrected.text())
    }
  })
  await t.test('folios distintos y persistencia de datos reales sin fabricar consentimientos',()=>{
    assert.equal(new Set(ids).size,3);assert.equal(app.db.prepare('SELECT count(*) AS n FROM consent_confirmations').get()!.n,0)
  })
  await t.test('rechaza clases ajenas, matrícula manual y perfil público de menor',async()=>{
    for(const extra of [{className:'Alemán'},{className:''},{studentCode:'MANUAL-1'},{group:'Otro grupo'},{guardianConsent:true},{visibility:'comunidad'},{displayName:'Alumno Prueba'},{birthDate:'2030-01-01'}]){
      assert.equal((await call('/requests','POST',{...input('Inglés',randomUUID()+'@example.test'),...extra})).status,400)
    }
  })
  await t.test('el estado de registro sigue controlando los envíos y un pendiente no recibe acceso',async()=>{
    app.db.prepare('UPDATE community_controls SET registration_open=0').run()
    assert.equal((await call('/requests','POST',input('Español','paused@example.test'))).status,409)
    assert.equal((await call('/student/me')).status,401)
  })
})
