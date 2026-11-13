import { badgeDefinitions } from '../shared/badges.ts'
import { transaction,type Database } from './database.ts'
import { queueNotice } from './notices.ts'
import { HttpError,record,revisionOf } from './validation.ts'
import type { BadgeApplication,BadgeApplicationPage,BadgeAudit,BadgeGrantReview,BadgeReview,BadgeSnapshot,BadgeSpec,EarnedBadge,StudentUser,Submission } from './contracts.ts'

type RequestRow={id:number;student_id:number;badge_id:string;description:string;status:BadgeApplication['status'];revision:number;reason:string|null;created_at:string;request_key:string}
type GrantRow={id:number;student_id:number;badge_id:string;badge_json:string;source:'automatic'|'cai';condition:string;awarded_at:string;status:'active'|'revoked';revision:number;reason:string|null;source_request:number|null;create_key:string|null;fingerprint:string|null}
const folio=(prefix:string,id:number)=>prefix+'-'+String(id).padStart(4,'0')
function numberId(id:string,prefix:string){if(!new RegExp('^'+prefix+'-\\d{4,}$').test(id)||!Number.isSafeInteger(Number(id.slice(4))))throw new HttpError(404,'No se encontró la insignia o solicitud.');return Number(id.slice(4))}
function text(value:unknown,min:number,max:number,label:string){if(typeof value!=='string'||value.trim().length<min||value.trim().length>max||[...value].some(c=>(c.charCodeAt(0)<32&&![9,10,13].includes(c.charCodeAt(0)))||c.charCodeAt(0)===127))throw new HttpError(400,`Revisa ${label}: usa de ${min} a ${max} caracteres.`);return value.trim()}
function definition(id:unknown){const badge=badgeDefinitions.find(b=>b.id===id);if(!badge)throw new HttpError(400,'Elige una insignia del catálogo.');return badge}
const ownRequest=(row:RequestRow):BadgeApplication=>({id:folio('BSR',row.id),badgeId:row.badge_id,description:row.description,status:row.status,revision:row.revision,reason:row.reason,createdAt:row.created_at})
const ownGrant=(row:GrantRow):EarnedBadge=>({id:folio('BDG',row.id),badge:JSON.parse(row.badge_json) as BadgeSpec,source:row.source,condition:row.condition,awardedAt:row.awarded_at,status:row.status,revision:row.revision,reason:row.reason})
export function badgesRepository(db:Database){
 const student=(id:number)=>{
  const row=db.prepare('SELECT r.payload,r.status,s.status AS student_status FROM requests r JOIN students s ON s.request_id=r.id WHERE r.id=?').get(id)
  if(!row)throw new HttpError(404,'No se encontró el alumno.')
  const profile=JSON.parse(String(row.payload)) as Submission
  return {studentId:folio('CAI',id),studentName:profile.firstName+' '+profile.lastName,program:profile.program,group:profile.group,active:row.status==='aprobada'&&row.student_status==='activo'}
 }
 const active=(user:StudentUser)=>{const id=numberId(user.id,'CAI');if(!student(id).active)throw new HttpError(401,'Tu acceso no está disponible. Consulta con CAI.');return id}
 const audit=(request:number|null,grant:number|null,action:string,reason:string|null,admin:number|null,student:number|null)=>db.prepare('INSERT INTO badge_audit(request_id,grant_id,action,reason,admin_id,student_id,created_at) VALUES (?,?,?,?,?,?,?)').run(request,grant,action,reason,admin,student,new Date().toISOString())
 const history=(column:'request_id'|'grant_id',id:number):BadgeAudit[]=>db.prepare(`SELECT a.action,a.reason,a.created_at,u.name FROM badge_audit a LEFT JOIN admin_users u ON u.id=a.admin_id WHERE a.${column}=? ORDER BY a.id DESC LIMIT 30`).all(id).map(row=>({action:String(row.action),reason:row.reason as string|null,actor:row.name?String(row.name):row.action==='automatic'?'Progreso en Retos':'Alumno',createdAt:String(row.created_at)}))
 const request=(id:string)=>{const row=db.prepare('SELECT * FROM badge_requests WHERE id=?').get(numberId(id,'BSR')) as RequestRow|undefined;if(!row)throw new HttpError(404,'No se encontró la insignia o solicitud.');return row}
 const grant=(id:string)=>{const row=db.prepare('SELECT * FROM badge_grants WHERE id=?').get(numberId(id,'BDG')) as GrantRow|undefined;if(!row)throw new HttpError(404,'No se encontró la insignia o solicitud.');return row}
 const addGrant=(student:number,badge:BadgeSpec,source:'automatic'|'cai',condition:string,at:string,request:number|null=null,key:string|null=null,fingerprint:string|null=null)=>{
  const id=Number(db.prepare('INSERT INTO badge_grants(student_id,badge_id,badge_json,source,condition,awarded_at,source_request,create_key,fingerprint) VALUES (?,?,?,?,?,?,?,?,?)').run(student,badge.id,JSON.stringify(badge),source,condition,at,request,key,fingerprint).lastInsertRowid)
  queueNotice(db,student,'Una insignia que ya es tuya','Conseguiste '+badge.title+'. Consulta Mis logros para verla. Compartirla con el grupo es voluntario.');return id
 }
 const automatic=(student:number)=>{
  const rows=db.prepare('SELECT day,COUNT(*) AS n,MAX(created_at) AS at FROM challenge_attempts WHERE student_id=? GROUP BY day ORDER BY day').all(student)
  const completed=rows.filter(row=>row.n===3)
  let run=0,longest=0,previous=-Infinity,third:string|undefined
  for(const row of completed){const day=Date.parse(String(row.day)+'T00:00:00Z')/86400000;run=day===previous+1?run+1:1;previous=day;longest=Math.max(longest,run);if(run===3&&!third)third=String(row.at)}
  const first=db.prepare('SELECT created_at FROM challenge_attempts WHERE student_id=? ORDER BY id LIMIT 1').get(student)
  const values=[{id:'first-answer',progress:first?1:0,target:1,at:first?String(first.created_at):undefined},{id:'three-consecutive',progress:Math.min(longest,3),target:3,at:third},{id:'five-days',progress:Math.min(completed.length,5),target:5,at:completed[4]?String(completed[4].at):undefined}]
  for(const item of values){
   if(!item.at||db.prepare('SELECT id FROM badge_grants WHERE student_id=? AND badge_id=?').get(student,item.id))continue
   const badge=definition(item.id),id=addGrant(student,badge,'automatic',badge.description,item.at);audit(null,id,'automatic',null,null,null)
  }
  return values
 }
 const mine=(id:number,before=0):BadgeApplicationPage=>{const rows=db.prepare('SELECT * FROM badge_requests WHERE student_id=? AND (?=0 OR id<?) ORDER BY id DESC LIMIT 21').all(id,before,before) as RequestRow[];return {items:rows.slice(0,20).map(ownRequest),nextCursor:rows.length>20?rows[19]!.id:null}}
 const counts=()=>{const result={pending:0,approved:0,rejected:0,withdrawn:0};for(const row of db.prepare('SELECT status,COUNT(*) AS n FROM badge_requests GROUP BY status').all())result[row.status as keyof typeof result]=Number(row.n);return result}
 return {
  counts,
  snapshot(user:StudentUser):BadgeSnapshot{return transaction(db,()=>{const id=active(user),progress=automatic(id);return {pendingBadgeIds:db.prepare("SELECT badge_id FROM badge_requests WHERE student_id=? AND status='pending'").all(id).map(row=>String(row.badge_id)),catalog:badgeDefinitions.map(badge=>({...badge,progress:progress.find(p=>p.id===badge.id)?.progress??0,target:progress.find(p=>p.id===badge.id)?.target??1})),grants:(db.prepare('SELECT * FROM badge_grants WHERE student_id=? ORDER BY id DESC').all(id) as GrantRow[]).map(ownGrant),requests:mine(id)}})},
  mine(user:StudentUser,before=0){return mine(active(user),before)},
  requestDetail(user:StudentUser,id:string){const row=request(id);if(row.student_id!==active(user))throw new HttpError(404,'No se encontró la insignia o solicitud.');return {request:ownRequest(row),history:history('request_id',row.id)}},
  grantDetail(user:StudentUser,id:string){const row=grant(id);if(row.student_id!==active(user))throw new HttpError(404,'No se encontró la insignia o solicitud.');return {grant:ownGrant(row),history:history('grant_id',row.id)}},
  apply(user:StudentUser,value:unknown,key:string){
   const data=record(value),badge=definition(data.badgeId),description=text(data.description,20,600,'tu aventura')
   if(Object.keys(data).some(k=>!['badgeId','description'].includes(k))||!/^[a-f0-9-]{36}$/i.test(key))throw new HttpError(400,'Revisa los datos y el identificador de tu solicitud.')
   return transaction(db,()=>{
    const id=active(user),previous=db.prepare('SELECT * FROM badge_requests WHERE student_id=? AND request_key=?').get(id,key) as RequestRow|undefined
    if(previous){if(previous.badge_id!==badge.id||previous.description!==description)throw new HttpError(409,'Este envío ya se recibió con otros datos.');return ownRequest(previous)}
    if(badge.mode!=='review'||badge.availability!=='active')throw new HttpError(400,'Esta insignia se obtiene en Retos o la otorga coordinación directamente.')
    if(db.prepare('SELECT id FROM badge_grants WHERE student_id=? AND badge_id=?').get(id,badge.id))throw new HttpError(409,'Ya tienes una concesión de esta insignia. Si fue retirada, consulta con coordinación.')
    if(db.prepare("SELECT id FROM badge_requests WHERE student_id=? AND badge_id=? AND status='pending'").get(id,badge.id))throw new HttpError(409,'Ya tienes una solicitud pendiente para esta insignia.')
    const inserted=Number(db.prepare('INSERT INTO badge_requests(student_id,badge_id,description,created_at,request_key) VALUES (?,?,?,?,?)').run(id,badge.id,description,new Date().toISOString(),key).lastInsertRowid);audit(inserted,null,'requested',null,null,id);return ownRequest(request(folio('BSR',inserted)))
   })
  },
  withdraw(user:StudentUser,id:string,value:unknown){const data=record(value),revision=revisionOf(data.revision);if(Object.keys(data).some(k=>!['revision','confirmed'].includes(k))||data.confirmed!==true)throw new HttpError(400,'Confirma la retirada de la solicitud.');transaction(db,()=>{const row=request(id);if(row.student_id!==active(user))throw new HttpError(404,'No se encontró la insignia o solicitud.');if(row.revision!==revision||row.status!=='pending')throw new HttpError(409,'La solicitud cambió. Actualiza su estado.');db.prepare("UPDATE badge_requests SET status='withdrawn',revision=revision+1 WHERE id=?").run(row.id);audit(row.id,null,'withdrawn',null,null,row.student_id)})},
  reviews(status:string,before=0){
   if(!['pending','approved','rejected','withdrawn'].includes(status))throw new HttpError(400,'Elige un estado de solicitudes válido.')
   const rows=db.prepare('SELECT * FROM badge_requests WHERE status=? AND (?=0 OR id<?) ORDER BY id DESC LIMIT 21').all(status,before,before) as RequestRow[]
   return {items:rows.slice(0,20).map(row=>({...ownRequest(row),...student(row.student_id),badgeTitle:definition(row.badge_id).title})),nextCursor:rows.length>20?rows[19]!.id:null,counts:counts()}
  },
  reviewDetail(id:string):{request:BadgeReview;history:BadgeAudit[]}{const row=request(id);return {request:{...ownRequest(row),...student(row.student_id),badgeTitle:definition(row.badge_id).title},history:history('request_id',row.id)}},
  decide(id:string,decision:'approve'|'reject',value:unknown,admin:number){
   const data=record(value),revision=revisionOf(data.revision),reason=text(data.reason,8,280,'el motivo de tu decisión')
   if(Object.keys(data).some(k=>!['revision','reason','confirmed'].includes(k))||data.confirmed!==true)throw new HttpError(400,'Confirma que revisaste la solicitud y su privacidad.')
   transaction(db,()=>{
    const row=request(id);if(row.status!=='pending'||row.revision!==revision)throw new HttpError(409,'La solicitud cambió. Actualiza antes de decidir.')
    if(decision==='approve'){
     if(!student(row.student_id).active)throw new HttpError(409,'El alumno debe conservar su acceso aprobado y activo.')
     if(db.prepare('SELECT id FROM badge_grants WHERE student_id=? AND badge_id=?').get(row.student_id,row.badge_id))throw new HttpError(409,'Esta insignia ya tiene una concesión. Revisa su historial.')
     const id=addGrant(row.student_id,definition(row.badge_id),'cai','CAI revisó y aprobó una solicitud de esta insignia.',new Date().toISOString(),row.id);audit(row.id,id,'approved',reason,admin,null)
    }else audit(row.id,null,'rejected',reason,admin,null)
    db.prepare('UPDATE badge_requests SET status=?,reason=?,revision=revision+1 WHERE id=?').run(decision==='approve'?'approved':'rejected',reason,row.id)
    queueNotice(db,row.student_id,'Revisión de tu solicitud de insignia','CAI revisó una solicitud de insignia. Consulta Tus solicitudes en Mis logros para ver el resultado y el motivo privado.')
   })
  },
  grants(before=0){const rows=db.prepare('SELECT * FROM badge_grants WHERE (?=0 OR id<?) ORDER BY id DESC LIMIT 21').all(before,before) as GrantRow[];return {items:rows.slice(0,20).map(row=>({...ownGrant(row),...student(row.student_id)})),nextCursor:rows.length>20?rows[19]!.id:null}},
  adminGrant(id:string):{grant:BadgeGrantReview;history:BadgeAudit[]}{const row=grant(id);return {grant:{...ownGrant(row),...student(row.student_id)},history:history('grant_id',row.id)}},
  award(value:unknown,admin:number,key:string){
   const data=record(value),badge=definition(data.badgeId),reason=text(data.reason,8,280,'el motivo del reconocimiento'),studentId=numberId(String(data.studentId),'CAI')
   if(Object.keys(data).some(k=>!['studentId','badgeId','reason','confirmed'].includes(k))||data.confirmed!==true||!/^[a-f0-9-]{36}$/i.test(key)||badge.availability!=='institutional')throw new HttpError(400,'Elige un reconocimiento de coordinación y confirma la concesión.')
   const fingerprint=JSON.stringify([admin,studentId,badge.id,reason])
   return transaction(db,()=>{
    const previous=db.prepare('SELECT * FROM badge_grants WHERE create_key=?').get(key) as GrantRow|undefined
    if(previous){if(previous.fingerprint!==fingerprint)throw new HttpError(409,'Este envío ya se recibió con otros datos.');return ownGrant(previous)}
    if(!student(studentId).active)throw new HttpError(409,'El alumno debe conservar su acceso aprobado y activo.')
    if(db.prepare('SELECT id FROM badge_grants WHERE student_id=? AND badge_id=?').get(studentId,badge.id))throw new HttpError(409,'El alumno ya tiene una concesión de esta insignia. Revisa su historial.')
    const id=addGrant(studentId,badge,'cai','CAI otorgó este reconocimiento.',new Date().toISOString(),null,key,fingerprint);audit(null,id,'awarded',reason,admin,null);return ownGrant(grant(folio('BDG',id)))
   })
  },
  correct(id:string,value:unknown,admin:number){
   const data=record(value),revision=revisionOf(data.revision),reason=text(data.reason,8,280,'el motivo de la corrección')
   if(Object.keys(data).some(k=>!['revision','reason','confirmed','status'].includes(k))||data.confirmed!==true||!['active','revoked'].includes(String(data.status)))throw new HttpError(400,'Confirma la corrección y elige el estado de la insignia.')
   transaction(db,()=>{
    const row=grant(id);if(row.revision!==revision||row.status===data.status)throw new HttpError(409,'La insignia cambió. Actualiza antes de corregirla.')
    if(data.status==='active'&&!student(row.student_id).active)throw new HttpError(409,'El alumno debe conservar su acceso aprobado y activo.')
    db.prepare('UPDATE badge_grants SET status=?,revision=revision+1,reason=? WHERE id=?').run(String(data.status),reason,row.id);audit(null,row.id,data.status==='active'?'restored':'revoked',reason,admin,null)
    if(data.status==='revoked'){
     db.prepare("INSERT INTO publication_audit(publication_id,admin_id,action,created_at) SELECT id,?,'badge.held',? FROM publications WHERE badge_grant_id=? AND status='publicada'").run(admin,new Date().toISOString(),row.id)
     db.prepare("UPDATE publications SET status='pendiente',reason='El reconocimiento requiere revisión. Consulta con coordinación.',published_at=NULL,revision=revision+1 WHERE badge_grant_id=? AND status='publicada'").run(row.id)
    }
    queueNotice(db,row.student_id,'Actualización de una insignia','CAI actualizó una insignia. Consulta su estado y el motivo privado en Mis logros. Las historias que requieran revisión no se vuelven a publicar automáticamente.')
   })
  },
 }
}
