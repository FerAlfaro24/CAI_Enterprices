import { createHash } from 'node:crypto'
import { transaction,type Database } from './database.ts'
import { HttpError,record,revisionOf } from './validation.ts'
import { publications } from './publications.ts'
import { publicProfileId } from './public-profiles.ts'
import { administrationAudit } from './administration.ts'
import { queueNotice } from './notices.ts'
import { currentRestriction } from './student-restrictions.ts'
import type { CommunityModerationComment,CommunityModerationPost,ModerationAuthor,StudentRestriction,Submission } from './contracts.ts'

const studentId=(id:number)=>'CAI-'+String(id).padStart(4,'0')
const parseId=(value:string,prefix:string)=>{if(!new RegExp('^'+prefix+'-[0-9]{4,}$').test(value)||!Number.isSafeInteger(Number(value.slice(prefix.length+1))))throw new HttpError(404,'No se encontró el registro.');return Number(value.slice(prefix.length+1))}
const reasonOf=(value:unknown)=>{if(typeof value!=='string'||value.trim().length<5||value.trim().length>240||/[\p{Cc}\p{Cf}]/u.test(value))throw new HttpError(400,'Escribe un motivo de 5 a 240 caracteres, en una sola línea.');return value.trim()}
type RestrictionRow={id:number;student_id:number;reason:string;created_at:string;expires_at:number|null;ended_at:string|null;end_reason:string|null;ended_by:number|null;revision:number}
export function communityModeration(db:Database) {
 const posts=publications(db)
 const view=(row:RestrictionRow):StudentRestriction=>{
  const profile=JSON.parse(String(db.prepare('SELECT payload FROM requests WHERE id=?').get(row.student_id)!.payload)) as Submission
  return {id:row.id,studentId:studentId(row.student_id),studentName:profile.displayName,reason:row.reason,createdAt:row.created_at,expiresAt:row.expires_at===null?null:new Date(row.expires_at).toISOString(),endedAt:row.ended_at,status:row.ended_at?(row.ended_by===null?'expired':'revoked'):row.expires_at!==null&&row.expires_at<=Date.now()?'expired':'active',revision:row.revision}
 }
 const author=(id:number):ModerationAuthor=>{
  const row=db.prepare('SELECT r.payload,s.revision FROM requests r JOIN students s ON s.request_id=r.id WHERE r.id=?').get(id)
  if(!row)throw new HttpError(404,'El alumno ya no está aprobado.')
  const profile=JSON.parse(String(row.payload)) as Submission,restriction=currentRestriction(db,id) as RestrictionRow|undefined
  return {studentId:studentId(id),displayName:profile.displayName,studentRevision:Number(row.revision),restriction:restriction?view(restriction):null}
 }
 const result=(value:{removed:boolean;restrictionId:number|null})=>({removed:value.removed,restriction:value.restrictionId?view(db.prepare('SELECT * FROM student_restrictions WHERE id=?').get(value.restrictionId) as RestrictionRow):null})
 return {
  feed(before=0) {
   const rows=posts.communityForAdmin(before)
   const items:CommunityModerationPost[]=rows.slice(0,20).map(post=>{
    const id=post.institutional?null:Number(db.prepare('SELECT request_id FROM public_profiles WHERE public_id=?').get(post.author.id)!.request_id)
    const count=Number(db.prepare("SELECT COUNT(*) AS n FROM post_comments c JOIN requests r ON r.id=c.author_id JOIN students s ON s.request_id=r.id WHERE c.publication_id=? AND c.status='publicado' AND r.status='aprobada' AND s.status='activo'").get(parseId(post.id,'PUB'))!.n)
    return {...post,commentCount:count,moderation:id===null?null:author(id)}
   })
   return {items,nextCursor:rows.length>20?parseId(rows[19]!.id,'PUB'):null}
  },
  comments(postId:string,before=0) {
   const id=parseId(postId,'PUB'),post=db.prepare("SELECT id FROM publications WHERE id=? AND audience='community' AND status='publicada' AND (expires_at IS NULL OR expires_at>?)").get(id,new Date().toISOString())
   if(!post)throw new HttpError(404,'Esta publicación no está disponible en la comunidad.')
   const rows=db.prepare("SELECT c.*,r.payload FROM post_comments c JOIN requests r ON r.id=c.author_id JOIN students s ON s.request_id=r.id WHERE c.publication_id=? AND c.status='publicado' AND r.status='aprobada' AND s.status='activo' AND (?=0 OR c.id<?) ORDER BY c.id DESC LIMIT 21").all(id,before,before)
   const items:CommunityModerationComment[]=rows.slice(0,20).map(row=>{const profile=JSON.parse(String(row.payload)) as Submission;return {id:'CMT-'+String(row.id).padStart(4,'0'),body:String(row.body),createdAt:String(row.created_at),revision:Number(row.revision),author:{id:publicProfileId(db,Number(row.author_id)),displayName:profile.displayName,avatarColor:profile.avatarColor},moderation:author(Number(row.author_id))}})
   return {items,nextCursor:rows.length>20?Number(rows[19]!.id):null}
  },
  restrictions(history=false,before=0) {
   const rows=db.prepare(`SELECT * FROM student_restrictions WHERE (?=0 OR id<?) ${history?'':"AND ended_at IS NULL AND (expires_at IS NULL OR expires_at>?)"} ORDER BY id DESC LIMIT 21`).all(...(history?[before,before]:[before,before,Date.now()])) as RestrictionRow[]
   return {items:rows.slice(0,20).map(view),nextCursor:rows.length>20?rows[19]!.id:null}
  },
  apply(id:string,commentId:string|null,value:unknown,key:string,admin:number) {
   const student=parseId(id,'CAI'),comment=commentId?parseId(commentId,'CMT'):null,data=record(value)
   if(Object.keys(data).some(k=>!['studentRevision','commentRevision','removeComment','suspend','durationDays','reason','confirmed'].includes(k))||data.confirmed!==true||typeof data.removeComment!=='boolean'||typeof data.suspend!=='boolean'||(!data.removeComment&&!data.suspend)||(!comment&&data.removeComment))throw new HttpError(400,'Confirma las medidas que quieres aplicar.')
   if(!/^[a-f0-9-]{36}$/i.test(key))throw new HttpError(400,'Falta el identificador de la medida.')
   const reason=reasonOf(data.reason),studentRevision=revisionOf(data.studentRevision)
   if(data.suspend&&(data.durationDays!==null&&(!Number.isInteger(data.durationDays)||Number(data.durationDays)<1||Number(data.durationDays)>365)))throw new HttpError(400,'Elige de 1 a 365 días o una suspensión permanente.')
   const normalized={studentRevision,commentRevision:comment?revisionOf(data.commentRevision):null,removeComment:data.removeComment,suspend:data.suspend,durationDays:data.suspend?data.durationDays:null,reason},fingerprint=createHash('sha256').update(JSON.stringify([student,comment,admin,normalized])).digest('hex')
   return transaction(db,()=>{
    const previous=db.prepare('SELECT * FROM community_moderation_actions WHERE request_key=?').get(key)
    if(previous){if(previous.admin_id!==admin||previous.fingerprint!==fingerprint)throw new HttpError(409,'La medida ya se recibió con otros datos. Actualiza la comunidad.');return result(JSON.parse(String(previous.result_json)))}
    const target=author(student),now=Date.now(),at=new Date(now).toISOString()
    if(data.suspend&&target.studentRevision!==studentRevision)throw new HttpError(409,'La cuenta cambió. Actualiza antes de suspenderla.')
    if(comment){
     const row=db.prepare("SELECT c.*,p.audience,p.status AS post_status,p.expires_at FROM post_comments c JOIN publications p ON p.id=c.publication_id WHERE c.id=?").get(comment)
     if(!row||row.author_id!==student)throw new HttpError(404,'No se encontró el comentario de este alumno.')
     if(row.status!=='publicado'||row.revision!==revisionOf(data.commentRevision)||row.audience!=='community'||row.post_status!=='publicada'||(row.expires_at&&String(row.expires_at)<=at))throw new HttpError(409,'El comentario o la publicación cambiaron. Actualiza antes de moderar.')
    }
    let restrictionId:number|null=null
    if(data.suspend){
     if(target.restriction)throw new HttpError(409,'Esta cuenta ya tiene una suspensión activa.')
     db.prepare("UPDATE student_restrictions SET ended_at=?,end_reason='expired',revision=revision+1 WHERE student_id=? AND ended_at IS NULL AND expires_at<=?").run(at,student,now)
     restrictionId=Number(db.prepare('INSERT INTO student_restrictions(student_id,admin_id,reason,created_at,expires_at) VALUES (?,?,?,?,?)').run(student,admin,reason,at,data.durationDays===null?null:now+Number(data.durationDays)*86400000).lastInsertRowid)
     for(const table of ['student_sessions','student_invitations','password_resets'])db.prepare(`DELETE FROM ${table} WHERE request_id=?`).run(student)
     db.prepare('DELETE FROM google_sessions WHERE subject IN (SELECT subject FROM google_identities WHERE request_id=?)').run(student)
     db.prepare('UPDATE students SET revision=revision+1 WHERE request_id=?').run(student)
     administrationAudit(db,admin,'community.student_suspended',{id,restrictionId,durationDays:data.durationDays,reason})
     queueNotice(db,student,'Suspensión de acceso',data.durationDays===null?'CAI suspendió tu acceso. Consulta con coordinación.':`CAI suspendió tu acceso durante ${data.durationDays} días. Consulta con coordinación.`,'account')
    }
    if(data.removeComment){
     db.prepare("UPDATE post_comments SET status='retirado',reason=?,revision=revision+1 WHERE id=?").run(reason,comment!)
     db.prepare("INSERT INTO comment_audit(comment_id,admin_id,action,reason,created_at) VALUES (?,?,'comment.withdraw',?,?)").run(comment!,admin,reason,at)
     queueNotice(db,student,'Revisión de tu comentario','CAI retiró un comentario de la comunidad. Puedes consultar su estado y el motivo en Mis comentarios.')
    }
    const outcome={removed:data.removeComment as boolean,restrictionId}
    db.prepare('INSERT INTO community_moderation_actions VALUES (?,?,?,?,?,?,?)').run(key,admin,student,comment,fingerprint,JSON.stringify(outcome),at)
    return result(outcome)
   })
  },
  revoke(id:number,value:unknown,admin:number) {
   const data=record(value),revision=revisionOf(data.revision),reason=reasonOf(data.reason)
   if(Object.keys(data).some(k=>!['revision','reason','confirmed'].includes(k))||data.confirmed!==true)throw new HttpError(400,'Confirma que quieres levantar la suspensión.')
   return transaction(db,()=>{
    const row=db.prepare('SELECT * FROM student_restrictions WHERE id=?').get(id) as RestrictionRow|undefined
    if(!row)throw new HttpError(404,'No se encontró la suspensión.')
    if(row.revision!==revision||view(row).status!=='active')throw new HttpError(409,'Esta suspensión cambió o ya terminó. Actualiza la lista.')
    db.prepare('UPDATE student_restrictions SET ended_at=?,ended_by=?,end_reason=?,revision=revision+1 WHERE id=?').run(new Date().toISOString(),admin,reason,id)
    db.prepare('UPDATE students SET revision=revision+1 WHERE request_id=?').run(row.student_id)
    administrationAudit(db,admin,'community.suspension_revoked',{id,studentId:studentId(row.student_id),reason})
    queueNotice(db,row.student_id,'Suspensión levantada','CAI levantó la suspensión de comunidad. Puedes volver a iniciar sesión si tu inscripción continúa activa.','account')
    return {ok:true}
   })
  },
 }
}
