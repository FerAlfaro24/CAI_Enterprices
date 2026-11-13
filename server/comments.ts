import { transaction, type Database } from './database.ts'
import { publications } from './publications.ts'
import { administration } from './administration.ts'
import { publicProfileId } from './public-profiles.ts'
import { queueNotice } from './notices.ts'
import { HttpError, record, revisionOf } from './validation.ts'
import type { CommentCounts, CommentPage, CommentReview, CommentStatus, OwnComment, PublicComment, StudentUser, Submission, CommentHistory } from './contracts.ts'

const statuses: CommentStatus[] = ['pendiente','publicado','rechazado','retirado']
const folio = (id:number) => 'CMT-'+String(id).padStart(4,'0')
function numberId(id:string,prefix='CMT') {
 if(!new RegExp('^'+prefix+'-\\d{4,}$').test(id)||!Number.isSafeInteger(Number(id.slice(4))))throw new HttpError(404,'No se encontró el comentario.')
 return Number(id.slice(4))
}
export function commentCursor(value:string|null) {
 if(value===null)return 0
 if(!/^\d{1,15}$/.test(value)||!Number.isSafeInteger(Number(value)))throw new HttpError(400,'La página de comentarios no es válida.')
 return Number(value)
}
export function commentStatus(value:string|null):CommentStatus {
 if(!statuses.includes(value as CommentStatus))throw new HttpError(400,'Elige un estado de comentarios válido.')
 return value as CommentStatus
}
function text(value:unknown,min:number,max:number,label:string) {
 if(typeof value!=='string'||value.trim().length<min||value.trim().length>max||[...value].some(char=>(char.charCodeAt(0)<32&&![9,10,13].includes(char.charCodeAt(0)))||char.charCodeAt(0)===127))throw new HttpError(400,`Revisa ${label}: usa de ${min} a ${max} caracteres.`)
 return value.trim()
}
type Row={id:number;publication_id:number;author_id:number;body:string;status:CommentStatus;reason:string|null;revision:number;created_at:string;payload:string;student_status:string;request_status:string;program:string;group_name:string;publication_status:CommentReview['publication']['status'];title:string;post_revision:number;comments_open:number}
const select=`SELECT c.*,r.payload,s.status AS student_status,r.status AS request_status,p.program,p.group_name,p.title,p.status AS publication_status,p.revision AS post_revision,p.comments_open
 FROM post_comments c JOIN requests r ON r.id=c.author_id JOIN students s ON s.request_id=c.author_id JOIN publications p ON p.id=c.publication_id`
const eligible=`r.status='aprobada' AND s.status='activo' AND json_extract(r.payload,'$.program')=p.program AND json_extract(r.payload,'$.group')=p.group_name`
/** Caller already owns the assignment/record transaction. Never revive old public text silently. */
export function holdAuthorComments(db:Database,author:number,admin:number,reason:string) {
 db.prepare("INSERT INTO comment_audit(comment_id,admin_id,action,reason,created_at) SELECT id,?,'comment.held',?,? FROM post_comments WHERE author_id=? AND status='publicado'").run(admin,reason,new Date().toISOString(),author)
 db.prepare("UPDATE post_comments SET status='pendiente',reason=?,revision=revision+1 WHERE author_id=? AND status='publicado'").run(reason,author)
}
function page<T>(rows:Row[],map:(row:Row)=>T):CommentPage<T> {return {items:rows.slice(0,20).map(map),nextCursor:rows.length>20?rows[19]!.id:null}}
export function commentsRepository(db:Database) {
 const posts=publications(db)
 const publicComment=(row:Row):PublicComment=>{const profile=JSON.parse(row.payload) as Submission;return {id:folio(row.id),body:row.body,createdAt:row.created_at,author:{id:publicProfileId(db,row.author_id),displayName:profile.displayName,avatarColor:profile.avatarColor}}}
 const own=(row:Row):OwnComment=>({...publicComment(row),status:row.status,reason:row.reason,revision:row.revision})
 const get=(id:string)=>{const row=db.prepare(select+' WHERE c.id=?').get(numberId(id)) as Row|undefined;if(!row)throw new HttpError(404,'No se encontró el comentario.');return row}
 const audit=(id:number,action:string,admin:number|null,student:number|null,reason:string|null=null)=>db.prepare('INSERT INTO comment_audit(comment_id,admin_id,student_id,action,reason,created_at) VALUES (?,?,?,?,?,?)').run(id,admin,student,action,reason,new Date().toISOString())
 const active=(row:Row)=>{const profile=JSON.parse(row.payload) as Submission;return row.request_status==='aprobada'&&row.student_status==='activo'&&profile.program===row.program&&profile.group===row.group_name}
 const review=(row:Row):CommentReview=>({...own(row),authorActive:active(row),publication:{id:'PUB-'+String(row.publication_id).padStart(4,'0'),title:row.title,status:row.publication_status,program:row.program,group:row.group_name,revision:row.post_revision,commentsOpen:row.comments_open===1}})
 return {
  count(postId:string) {return Number(db.prepare(`SELECT COUNT(*) AS n FROM post_comments c JOIN requests r ON r.id=c.author_id JOIN students s ON s.request_id=c.author_id JOIN publications p ON p.id=c.publication_id WHERE c.publication_id=? AND c.status='publicado' AND ${eligible}`).get(numberId(postId,'PUB'))!.n)},
  list(user:StudentUser,postId:string,before=0) {
   const post=posts.visible(user,postId)
   const rows=db.prepare(`${select} WHERE c.publication_id=? AND c.status='publicado' AND ${eligible} AND (?=0 OR c.id<?) ORDER BY c.id DESC LIMIT 21`).all(post.id,before,before) as Row[]
   return {...page(rows,publicComment),commentsOpen:post.comments_open===1&&administration(db).settings().commentsOpen}
  },
  mine(user:StudentUser,postId:string,before=0) {
   const post=posts.visible(user,postId)
   return page(db.prepare(select+' WHERE c.publication_id=? AND c.author_id=? AND (?=0 OR c.id<?) ORDER BY c.id DESC LIMIT 21').all(post.id,numberId(user.id,'CAI'),before,before) as Row[],own)
  },
  create(user:StudentUser,postId:string,value:unknown,key:string) {
   const data=record(value);if(Object.keys(data).some(k=>k!=='body'))throw new HttpError(400,'El comentario contiene datos no admitidos.')
   const body=text(data.body,1,400,'el comentario')
   if(!/^[a-f0-9-]{36}$/i.test(key))throw new HttpError(400,'Falta el identificador del comentario.')
   return transaction(db,()=>{
    const post=posts.visible(user,postId),author=numberId(user.id,'CAI')
    const previous=db.prepare(select+' WHERE c.author_id=? AND c.request_key=?').get(author,key) as Row|undefined
    if(previous){if(previous.publication_id!==post.id||previous.body!==body)throw new HttpError(409,'Este envío ya se recibió con otros datos. Actualiza tus comentarios.');return own(previous)}
    if(!administration(db).settings().commentsOpen||post.comments_open!==1)throw new HttpError(409,'Los nuevos comentarios están pausados. Puedes leer la conversación y retirar los tuyos.')
    const id=Number(db.prepare('INSERT INTO post_comments(publication_id,author_id,request_key,body,created_at) VALUES (?,?,?,?,?)').run(post.id,author,key,body,new Date().toISOString()).lastInsertRowid)
    audit(id,'comment.submitted',null,author);return own(get(folio(id)))
   })
  },
  withdraw(user:StudentUser,id:string,value:unknown) {
   const data=record(value),revision=revisionOf(data.revision)
   if(Object.keys(data).some(k=>!['revision','confirmed'].includes(k))||data.confirmed!==true)throw new HttpError(400,'Confirma que quieres retirar tu comentario.')
   transaction(db,()=>{
    const row=get(id),author=numberId(user.id,'CAI')
    if(row.author_id!==author)throw new HttpError(404,'No se encontró el comentario.')
    if(row.revision!==revision||row.status==='retirado')throw new HttpError(409,'El comentario cambió. Actualiza tus envíos antes de retirarlo.')
    db.prepare("UPDATE post_comments SET status='retirado',reason=NULL,revision=revision+1 WHERE id=?").run(row.id);audit(row.id,'comment.withdrawn',null,author)
   })
  },
  counts():CommentCounts {const result:CommentCounts={pendiente:0,publicado:0,rechazado:0,retirado:0};for(const row of db.prepare('SELECT status,COUNT(*) AS n FROM post_comments GROUP BY status').all())result[row.status as CommentStatus]=Number(row.n);return result},
  reviews(status:CommentStatus,before=0) {return page(db.prepare(select+' WHERE c.status=? AND (?=0 OR c.id<?) ORDER BY c.id DESC LIMIT 21').all(status,before,before) as Row[],review)},
  detail(id:string):{comment:CommentReview;history:CommentHistory[]} {
   const row=get(id)
   const history=db.prepare(`SELECT a.action,a.reason,a.created_at,u.name FROM comment_audit a LEFT JOIN admin_users u ON u.id=a.admin_id WHERE a.comment_id=? ORDER BY a.id DESC LIMIT 20`).all(row.id).map(item=>({action:String(item.action),reason:item.reason as string|null,actor:item.name?String(item.name):'Autor del comentario',createdAt:String(item.created_at)}))
   return {comment:review(row),history}
  },
  decide(id:string,decision:'approve'|'reject'|'undo'|'withdraw',value:unknown,admin:number) {
   const data=record(value),revision=revisionOf(data.revision)
   if(Object.keys(data).some(k=>!['revision','reason','confirmed'].includes(k))||data.confirmed!==true)throw new HttpError(400,'Confirma que revisaste el comentario y su privacidad.')
   const reason=decision==='approve'?null:text(data.reason,5,240,'el motivo')
   transaction(db,()=>{
    const row=get(id)
    if(row.revision!==revision||row.status==='retirado')throw new HttpError(409,'El comentario cambió. Actualiza antes de decidir.')
    if((['approve','reject'].includes(decision)&&row.status!=='pendiente')||(decision==='undo'&&!['publicado','rechazado'].includes(row.status))||(decision==='withdraw'&&row.status!=='publicado'))throw new HttpError(409,'Esta decisión no corresponde al estado actual.')
    if(decision==='approve'){
     if(!active(row))throw new HttpError(409,'El autor debe tener acceso activo y conservar el grupo de la historia.')
     const user={id:'CAI-'+String(row.author_id).padStart(4,'0')} as StudentUser;posts.visible(user,'PUB-'+String(row.publication_id).padStart(4,'0'))
    }
    const status:CommentStatus=decision==='approve'?'publicado':decision==='reject'?'rechazado':decision==='undo'?'pendiente':'retirado'
    db.prepare('UPDATE post_comments SET status=?,reason=?,revision=revision+1 WHERE id=?').run(status,reason,row.id);audit(row.id,'comment.'+decision,admin,null,reason)
    queueNotice(db,row.author_id,'Revisión de tu comentario','CAI actualizó la revisión de un comentario. Consulta Mis comentarios dentro de la historia para revisar su estado.')
   })
  },
  configure(postId:string,value:unknown,admin:number) {
   const data=record(value),revision=revisionOf(data.revision)
   if(Object.keys(data).some(k=>!['revision','open'].includes(k))||typeof data.open!=='boolean')throw new HttpError(400,'Revisa el permiso de comentarios de la historia.')
   transaction(db,()=>{
    const post=db.prepare('SELECT status,revision FROM publications WHERE id=?').get(numberId(postId,'PUB'))
    if(!post)throw new HttpError(404,'No se encontró la historia.')
    if(post.revision!==revision||post.status==='retirada')throw new HttpError(409,'La historia cambió. Actualiza antes de cambiar sus comentarios.')
    db.prepare('UPDATE publications SET comments_open=?,revision=revision+1 WHERE id=?').run(Number(data.open),numberId(postId,'PUB'))
    db.prepare('INSERT INTO publication_audit(publication_id,admin_id,action,created_at) VALUES (?,?,?,?)').run(numberId(postId,'PUB'),admin,data.open?'comments.opened':'comments.closed',new Date().toISOString())
   })
  },
 }
}

