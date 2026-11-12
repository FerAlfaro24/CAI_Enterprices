import { createHash } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { transaction,type Database } from './database.ts'
import { authRepository,verifyPassword } from './auth.ts'
import { abbreviatedNames,ageAt,HttpError,record,revisionOf,validateSubmission } from './validation.ts'
import { administrationAudit } from './administration.ts'
import { queueNotice } from './notices.ts'
import type { StudentRecord,StudentRecordSnapshot,StudentRecordValues,Submission } from './contracts.ts'

type Row={id:number;payload:string;revision:number;reference:string|null}
const fields=['firstName','lastName','birthDate','studentCode','guardian'] as const
function singleLine(value:unknown,label:string,min:number,max:number){
  if(typeof value!=='string'||value.trim().length<min||value.trim().length>max||/[\p{Cc}\p{Cf}]/u.test(value))throw new HttpError(400,`Revisa ${label}.`)
  return value.trim()
}
function snapshot(profile:Submission,reference:string|null):StudentRecordSnapshot{
  return {firstName:profile.firstName,lastName:profile.lastName,birthDate:profile.birthDate,studentCode:profile.studentCode??'',guardian:profile.guardian??null,displayName:profile.displayName,visibility:profile.visibility,consentReference:reference}
}

export function studentRecords(db:Database){
  const auth=authRepository(db)
  const select=(id:string):Row=>{
    if(!/^CAI-\d{4,}$/.test(id)||!Number.isSafeInteger(Number(id.slice(4))))throw new HttpError(404,'No se encontró el expediente.')
    const row=db.prepare(`SELECT r.id,r.payload,s.revision,c.reference FROM requests r JOIN students s ON s.request_id=r.id
      LEFT JOIN consent_confirmations c ON c.request_id=r.id WHERE r.id=? AND r.status='aprobada'`).get(Number(id.slice(4))) as Row|undefined
    if(!row)throw new HttpError(404,'No se encontró el expediente de un alumno aprobado.')
    return row
  }
  return {
    get(id:string):StudentRecord{
      const row=select(id),profile=JSON.parse(row.payload) as Submission
      const history=db.prepare(`SELECT c.id,c.created_at,c.reason,c.fields,c.before_json,c.after_json,u.name AS actor
        FROM student_record_changes c JOIN admin_users u ON u.id=c.actor_id WHERE c.request_id=? ORDER BY c.id DESC LIMIT 20`).all(row.id)
      return {...snapshot(profile,row.reference),id,revision:row.revision,email:profile.email,
        history:history.map(item=>({id:Number(item.id),actor:String(item.actor),createdAt:String(item.created_at),reason:String(item.reason),fields:JSON.parse(String(item.fields)) as string[],before:JSON.parse(String(item.before_json)) as StudentRecordSnapshot,after:JSON.parse(String(item.after_json)) as StudentRecordSnapshot}))}
    },
    async correct(request:IncomingMessage,id:string,value:unknown,key:string){
      const data=record(value)
      if(Object.keys(data).some(k=>![...fields,'revision','reason','consentReference','currentPassword','confirmed'].includes(k)))throw new HttpError(400,'La corrección contiene datos no admitidos. El correo y el acceso se gestionan por separado.')
      if(!/^[a-f0-9-]{36}$/i.test(key))throw new HttpError(400,'Falta el identificador de la corrección.')
      const revision=revisionOf(data.revision),reason=singleLine(data.reason,'el motivo (8 a 240 caracteres)',8,240)
      const values:StudentRecordValues={firstName:singleLine(data.firstName,'el nombre',2,60),lastName:singleLine(data.lastName,'los apellidos',2,80),birthDate:singleLine(data.birthDate,'la fecha de nacimiento',10,10),studentCode:singleLine(data.studentCode??'','la matrícula',0,12),guardian:null}
      const minor=ageAt(values.birthDate)<18
      if(data.guardian!==null&&data.guardian!==undefined){
        const g=record(data.guardian)
        if(Object.keys(g).some(k=>!['name','relationship','contact'].includes(k)))throw new HttpError(400,'Los datos del tutor contienen campos no admitidos.')
        values.guardian={name:singleLine(g.name,'el nombre del tutor',3,100),relationship:singleLine(g.relationship,'el parentesco',2,60),contact:singleLine(g.contact,'el contacto del tutor',5,120)}
      }
      if(!minor&&values.guardian)throw new HttpError(400,'Para un adulto no registres un tutor en esta corrección.')
      const reference=singleLine(data.consentReference??'','la referencia de autorización (hasta 240 caracteres)',0,240)
      if(data.confirmed!==true)throw new HttpError(400,'Confirma que verificaste la corrección y sus efectos antes de guardar.')
      const actor=auth.session(request)
      if(!actor)throw new HttpError(401,'Tu sesión terminó. Vuelve a entrar.')
      if(typeof data.currentPassword!=='string'||!data.currentPassword.length||data.currentPassword.length>128)throw new HttpError(400,'Escribe tu contraseña actual.')
      // La contraseña se compara exactamente, sin recortar espacios permitidos por la política existente.
      const original=db.prepare('SELECT password_hash FROM admin_users WHERE id=?').get(actor.id)!
      if(!await verifyPassword(String(data.currentPassword),String(original.password_hash)))throw new HttpError(400,'La contraseña actual no es correcta.')
      const fingerprint=createHash('sha256').update(JSON.stringify({revision,...values,reason,consentReference:reference})).digest('hex')
      transaction(db,()=>{
        if(auth.session(request)?.id!==actor.id)throw new HttpError(401,'Tu sesión terminó durante la corrección. Vuelve a entrar.')
        if(db.prepare('SELECT password_hash FROM admin_users WHERE id=?').get(actor.id)?.password_hash!==original.password_hash)throw new HttpError(409,'Tu contraseña cambió. Vuelve a entrar antes de corregir el expediente.')
        const row=select(id),previous=db.prepare('SELECT request_id,fingerprint FROM student_record_changes WHERE request_key=?').get(key)
        if(previous){if(previous.request_id!==row.id||previous.fingerprint!==fingerprint)throw new HttpError(409,'Este envío ya se recibió con otros datos. Actualiza el expediente.');return}
        if(row.revision!==revision)throw new HttpError(409,'La ficha cambió en otra ventana. Carga el expediente actual antes de corregirlo.')
        const profile=JSON.parse(row.payload) as Submission,before=snapshot(profile,row.reference)
        const safeNames=abbreviatedNames(values.firstName,values.lastName),oldNames=abbreviatedNames(profile.firstName,profile.lastName)
        const displayName=minor?(profile.displayName===oldNames[1]?safeNames[1]!:safeNames[0]!):profile.displayName
        // Se usa el mismo validador, preservando el grupo existente aunque esté archivado.
        // filledBy original es histórico: la adaptación solo sirve para validar el expediente corregido.
        const checked=validateSubmission({...profile,...values,guardian:values.guardian??undefined,studentCode:values.studentCode||undefined,
          filledBy:minor?'tutor':'alumno',guardianConsent:minor,displayName,visibility:minor?'privado':profile.visibility},new Date(),[{id:0,program:profile.program,name:profile.group}])
        const next:Submission={...profile,firstName:checked.firstName,lastName:checked.lastName,birthDate:checked.birthDate,studentCode:checked.studentCode,
          guardian:checked.guardian,guardianConsent:minor,displayName,visibility:checked.visibility}
        const identityChanged=['firstName','lastName','birthDate'].some(field=>profile[field as 'firstName'|'lastName'|'birthDate']!==next[field as 'firstName'|'lastName'|'birthDate'])
        const guardianChanged=JSON.stringify(profile.guardian??null)!==JSON.stringify(next.guardian??null)
        const needsConsent=minor&&(!row.reference||identityChanged||guardianChanged)
        if(needsConsent&&(reference.length<8||reference===row.reference))throw new HttpError(400,'Registra una nueva referencia de autorización del tutor (8 a 240 caracteres), distinta de la anterior.')
        const renewConsent=minor&&Boolean(reference)
        if(renewConsent&&reference.length<8)throw new HttpError(400,'La referencia de autorización debe tener de 8 a 240 caracteres.')
        const after=snapshot(next,minor?(renewConsent?reference:row.reference):null)
        const changed=(Object.keys(before) as (keyof StudentRecordSnapshot)[]).filter(field=>JSON.stringify(before[field])!==JSON.stringify(after[field]))
        if(!changed.length)throw new HttpError(400,'No hay cambios en el expediente para guardar.')
        if(minor&&renewConsent)db.prepare('INSERT INTO consent_confirmations VALUES (?,?,?,?) ON CONFLICT(request_id) DO UPDATE SET actor_id=excluded.actor_id,reference=excluded.reference,confirmed_at=excluded.confirmed_at').run(row.id,actor.id,reference,new Date().toISOString())
        if(!minor)db.prepare('DELETE FROM consent_confirmations WHERE request_id=?').run(row.id)
        db.prepare('UPDATE requests SET payload=?,revision=revision+1 WHERE id=?').run(JSON.stringify(next),row.id)
        db.prepare('UPDATE students SET revision=revision+1 WHERE request_id=?').run(row.id)
        const revoked=Number(db.prepare('DELETE FROM student_sessions WHERE request_id=?').run(row.id).changes)
        db.prepare('DELETE FROM google_sessions WHERE subject IN (SELECT subject FROM google_identities WHERE request_id=?)').run(row.id)
        db.prepare('DELETE FROM password_resets WHERE request_id=?').run(row.id)
        db.prepare('DELETE FROM student_invitations WHERE request_id=?').run(row.id)
        const reviewed=needsConsent?Number(db.prepare("UPDATE publications SET status='pendiente',published_at=NULL,revision=revision+1 WHERE author_id=? AND status='publicada'").run(row.id).changes):0
        const createdAt=new Date().toISOString()
        const correction=Number(db.prepare('INSERT INTO student_record_changes(request_id,actor_id,request_key,fingerprint,reason,fields,before_json,after_json,created_at) VALUES (?,?,?,?,?,?,?,?,?)').run(row.id,actor.id,key,fingerprint,reason,JSON.stringify(changed),JSON.stringify(before),JSON.stringify(after),createdAt).lastInsertRowid)
        administrationAudit(db,actor.id,'student.record_corrected',{id,correctionId:correction,fields:changed,sessionsRevoked:revoked,postsToReview:reviewed})
        db.prepare("INSERT INTO audit_log(actor_id,request_id,action,created_at) VALUES (?,?,'student.record_corrected',?)").run(actor.id,row.id,createdAt)
        queueNotice(db,row.id,'Corrección de inscripción','CAI corrigió datos de tu inscripción. Vuelve a entrar y consulta con coordinación si necesitas información. No se cambió el correo ni la cuenta de acceso.')
      })
    },
  }
}
