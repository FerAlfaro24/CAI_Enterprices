import { queueNotice } from './notices.ts'
import { createHash } from 'node:crypto'
import { administration, administrationAudit } from './administration.ts'
import { transaction, type Database } from './database.ts'
import { HttpError, record, revisionOf } from './validation.ts'
import type { InstitutionalDraft } from './contracts.ts'

function text(value:unknown,min:number,max:number,label:string) {
  if(typeof value!=='string'||value.trim().length<min||value.trim().length>max||[...value].some(char=>char.charCodeAt(0)<32&&![9,10,13].includes(char.charCodeAt(0))))throw new HttpError(400,`Revisa ${label}.`)
  return value.trim()
}
function expiry(value:unknown) {
  if(value===null)return null
  if(typeof value!=='string'||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)throw new HttpError(400,'Revisa la fecha de finalización.')
  return value
}
export function institutionalPosts(db:Database) {
  const audit=(admin:number,id:number,action:string)=>administrationAudit(db,admin,action,{id})
  return {
    create(value:unknown,key:string,admin:number) {
      const data=record(value)
      if(Object.keys(data).some(k=>!['title','body','kind','audience','program','group','imageIds','showInGallery','highlighted','expiresAt','confirmed'].includes(k))||data.confirmed!==true)throw new HttpError(400,'Confirma el contenido, sus permisos y los destinatarios.')
      if(typeof data.kind!=='string'||typeof data.audience!=='string'||!['story','notice','album'].includes(data.kind)||!['group','community'].includes(data.audience)||typeof data.showInGallery!=='boolean'||typeof data.highlighted!=='boolean')throw new HttpError(400,'Revisa el tipo de publicación y dónde se mostrará.')
      if(!Array.isArray(data.imageIds)||data.imageIds.length>12||new Set(data.imageIds).size!==data.imageIds.length||data.imageIds.some(id=>typeof id!=='string'||! /^[a-f0-9-]{36}$/i.test(id)))throw new HttpError(400,'Elige hasta doce fotografías diferentes.')
      if((data.kind==='album'||data.showInGallery)&&!data.imageIds.length)throw new HttpError(400,'Añade al menos una foto para guardar un álbum.')
      const draft:InstitutionalDraft={title:text(data.title,4,100,'el título'),body:text(data.body,10,1200,'el texto'),kind:data.kind as InstitutionalDraft['kind'],audience:data.audience as InstitutionalDraft['audience'],program:typeof data.program==='string'?data.program:'',group:typeof data.group==='string'?data.group:'',imageIds:data.imageIds as string[],showInGallery:data.kind==='album'||data.showInGallery,highlighted:data.highlighted,expiresAt:expiry(data.expiresAt),confirmed:true}
      if(draft.audience==='community'&&(draft.program||draft.group))throw new HttpError(400,'Para toda la comunidad no indiques un grupo.')
      const fingerprint=createHash('sha256').update(JSON.stringify(draft)).digest('hex')
      return transaction(db,()=>{
        const previous=db.prepare('SELECT id,content_fingerprint FROM publications WHERE admin_author_id IS NOT NULL AND idempotency_key=?').get(key)
        if(previous){if(previous.content_fingerprint!==fingerprint)throw new HttpError(409,'Este envío ya existe con otro contenido.');return Number(previous.id)}
        if(draft.expiresAt&&Date.parse(draft.expiresAt)<=Date.now())throw new HttpError(400,'La fecha de finalización debe ser futura.')
        if(draft.audience==='group'&&(draft.group==='Por asignar'||!administration(db).groups().some(g=>g.active&&g.program===draft.program&&g.name===draft.group)))throw new HttpError(400,'Elige un grupo activo del catálogo.')
        for(const id of draft.imageIds){
          const image=db.prepare('SELECT audience,program,group_name,withdrawn_at FROM gallery_images WHERE id=?').get(id)
          if(!image||image.withdrawn_at||db.prepare('SELECT 1 FROM publication_images WHERE image_id=?').get(id))throw new HttpError(409,'Una imagen no está disponible o ya pertenece a una historia.')
          if(image.audience==='group'&&(draft.audience!=='group'||image.program!==draft.program||image.group_name!==draft.group))throw new HttpError(400,'La publicación no puede ampliar los destinatarios de una foto.')
        }
        const now=new Date().toISOString()
        const id=Number(db.prepare(`INSERT INTO publications(author_id,admin_author_id,idempotency_key,title,body,category,program,group_name,status,created_at,published_at,audience,kind,show_in_gallery,highlighted,expires_at,content_fingerprint)
          VALUES (NULL,?,?,?,?, 'experience',?,?,'publicada',?,?,?,?,?,?,?,?)`).run(admin,key,draft.title,draft.body,draft.program,draft.group,now,now,draft.audience,draft.kind,Number(draft.showInGallery),Number(draft.highlighted),draft.expiresAt,fingerprint).lastInsertRowid)
        for(const [position,image]of draft.imageIds.entries()){db.prepare('INSERT INTO publication_images VALUES (?,?,?)').run(id,image,position);db.prepare('UPDATE gallery_images SET draft=0 WHERE id=?').run(image)}
        if(draft.kind==='notice'){
          const recipients=db.prepare("SELECT r.id,r.payload FROM requests r JOIN students s ON s.request_id=r.id WHERE r.status='aprobada' AND s.status='activo'").all()
          for(const recipient of recipients){const profile=JSON.parse(String(recipient.payload)) as {program:string;group:string};if(draft.audience==='community'||(profile.program===draft.program&&profile.group===draft.group&&profile.group!=='Por asignar'))queueNotice(db,Number(recipient.id),'Nuevo aviso de CAI','CAI publicó un aviso. Consulta Inicio para leer los avisos disponibles para tu cuenta.','announcement')}
        }
        audit(admin,id,'institutional.published');return id
      })
    },
    update(id:number,value:unknown,admin:number) {
      const data=record(value),revision=revisionOf(data.revision)
      if(Object.keys(data).some(k=>!['revision','confirmed','withdraw','highlighted','expiresAt','reason'].includes(k))||data.confirmed!==true||typeof data.withdraw!=='boolean'||typeof data.highlighted!=='boolean')throw new HttpError(400,'Confirma la acción y actualiza la publicación.')
      const expires=expiry(data.expiresAt),reason=data.withdraw ? text(data.reason??'Eliminada por coordinación',5,240,'el motivo de eliminación') : null
      transaction(db,()=>{
        const row=db.prepare('SELECT revision,status FROM publications WHERE id=? AND admin_author_id IS NOT NULL').get(id)
        if(!row)throw new HttpError(404,'No se encontró la publicación de CAI.')
        if(row.revision!==revision||row.status==='retirada')throw new HttpError(409,'La publicación cambió o fue retirada. Actualiza antes de continuar.')
        if(expires&&Date.parse(expires)<=Date.now()&&!data.withdraw)throw new HttpError(400,'Elige una fecha futura o retira la publicación.')
        db.prepare('UPDATE publications SET highlighted=?,expires_at=?,status=?,reason=?,revision=revision+1 WHERE id=?').run(Number(data.highlighted),expires,data.withdraw?'retirada':String(row.status),reason,id)
        administrationAudit(db,admin,data.withdraw?'institutional.withdrawn':'institutional.updated',{id,...(reason?{reason}:{})})
      })
    },
  }
}
