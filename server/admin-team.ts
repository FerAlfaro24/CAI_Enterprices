import { createHash,randomBytes } from 'node:crypto'
import type { IncomingMessage } from 'node:http'
import { authRepository,hashPassword,verifyPassword } from './auth.ts'
import { transaction,type Database } from './database.ts'
import { HttpError,record,revisionOf } from './validation.ts'
import { administrationAudit } from './administration.ts'
import type { ActivationInvitation,AdminAccount } from './contracts.ts'

const digest=(token:string)=>createHash('sha256').update(token).digest('hex')
const invalid=()=>new HttpError(400,'El enlace no es válido, caducó o ya se utilizó. Pide otra invitación al administrador.')
type AccountRow={id:number;name:string;email:string;active:number;activated:number;revision:number}
const view=(row:AccountRow):AdminAccount=>({...row,active:row.active===1,activated:row.activated===1})
const fields='id,name,email,active,activated,revision'

export function adminTeam(db:Database){
  const auth=authRepository(db)
  const account=(id:number)=>{
    if(!Number.isSafeInteger(id)||id<1)throw new HttpError(404,'No se encontró la cuenta administrativa.')
    const row=db.prepare(`SELECT ${fields} FROM admin_users WHERE id=? AND role='admin'`).get(id) as AccountRow|undefined
    if(!row)throw new HttpError(404,'No se encontró la cuenta administrativa.')
    return row
  }
  const credential=(id:number)=>db.prepare("SELECT password_hash FROM admin_users WHERE id=? AND active=1 AND activated=1 AND role='admin'").get(id) as {password_hash:string}|undefined
  const proof=async(request:IncomingMessage,data:Record<string,unknown>)=>{
    const actor=auth.session(request)
    if(!actor)throw new HttpError(401,'Tu sesión terminó. Vuelve a entrar.')
    if(data.confirmed!==true)throw new HttpError(400,'Confirma que esta persona tendrá acceso completo a la administración.')
    if(typeof data.currentPassword!=='string'||!data.currentPassword.length||data.currentPassword.length>128)throw new HttpError(400,'Escribe tu contraseña actual para confirmar.')
    const original=credential(actor.id)
    if(!original||!await verifyPassword(data.currentPassword,original.password_hash))throw new HttpError(400,'La contraseña actual no es correcta.')
    return ()=>{
      if(auth.session(request)?.id!==actor.id)throw new HttpError(401,'Tu sesión terminó durante la operación. Vuelve a entrar.')
      if(credential(actor.id)?.password_hash!==original.password_hash)throw new HttpError(409,'Tu contraseña cambió. Vuelve a entrar antes de gestionar el equipo.')
      return actor.id
    }
  }
  const invitation=(token:unknown)=>{
    if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw invalid()
    const row=db.prepare(`SELECT u.id FROM admin_invitations i JOIN admin_users u ON u.id=i.user_id
      WHERE i.token_hash=? AND i.expires_at>? AND u.role='admin' AND u.active=1 AND u.activated=0`).get(digest(token),Date.now()) as {id:number}|undefined
    if(!row)throw invalid()
    return row.id
  }
  return {
    list():AdminAccount[]{return (db.prepare(`SELECT ${fields} FROM admin_users WHERE role='admin' ORDER BY id`).all() as AccountRow[]).map(view)},
    async create(request:IncomingMessage,value:unknown,key:string):Promise<AdminAccount>{
      const data=record(value)
      if(Object.keys(data).some(k=>!['name','email','currentPassword','confirmed'].includes(k)))throw new HttpError(400,'El alta contiene datos no admitidos.')
      if(typeof data.name!=='string'||data.name.trim().length<2||data.name.trim().length>100||/[\p{Cc}\p{Cf}]/u.test(data.name))throw new HttpError(400,'Escribe un nombre de 2 a 100 caracteres, en una sola línea.')
      if(typeof data.email!=='string'||data.email.length>160||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))throw new HttpError(400,'Escribe un correo válido.')
      if(!/^[a-f0-9-]{36}$/i.test(key))throw new HttpError(400,'Falta el identificador del alta.')
      const name=data.name.trim(),email=data.email.trim().toLowerCase(),check=await proof(request,data)
      return transaction(db,()=>{
        const actor=check(),existing=db.prepare('SELECT id FROM admin_users WHERE create_key=?').get(key)
        if(existing){const row=account(Number(existing.id));if(row.name!==name||row.email!==email)throw new HttpError(409,'Este alta ya se recibió con otros datos. Actualiza el equipo.');return view(row)}
        if(db.prepare('SELECT id FROM admin_users WHERE email=?').get(email))throw new HttpError(409,'Ya existe una cuenta con ese correo. Revisa el equipo antes de crear otra.')
        const id=Number(db.prepare("INSERT INTO admin_users(email,name,password_hash,role,active,activated,create_key) VALUES (?,?,?,'admin',1,0,?)").run(email,name,`pending:${randomBytes(32).toString('hex')}`,key).lastInsertRowid)
        administrationAudit(db,actor,'team.account_created',{targetId:id})
        return view(account(id))
      })
    },
    async invite(request:IncomingMessage,id:number,value:unknown):Promise<ActivationInvitation>{
      const data=record(value)
      if(Object.keys(data).some(k=>!['revision','currentPassword','confirmed'].includes(k)))throw new HttpError(400,'La invitación contiene datos no admitidos.')
      const revision=revisionOf(data.revision),check=await proof(request,data)
      return transaction(db,()=>{
        const actor=check(),row=account(id)
        if(row.revision!==revision)throw new HttpError(409,'La cuenta cambió. Actualiza el equipo antes de preparar otro enlace.')
        if(!row.active||row.activated)throw new HttpError(409,'Solo se invita a cuentas pendientes y habilitadas. Las cuentas ya activadas usan recuperación.')
        const token=randomBytes(32).toString('hex'),expiresAt=Date.now()+24*60*60_000
        db.prepare('INSERT INTO admin_invitations VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET token_hash=excluded.token_hash,expires_at=excluded.expires_at,created_by=excluded.created_by').run(id,digest(token),expiresAt,actor)
        db.prepare('UPDATE admin_users SET revision=revision+1 WHERE id=?').run(id)
        administrationAudit(db,actor,'team.invitation_prepared',{targetId:id})
        return {path:`/activar-administracion#token=${token}`,expiresAt:new Date(expiresAt).toISOString()}
      })
    },
    async setActive(request:IncomingMessage,id:number,value:unknown):Promise<AdminAccount>{
      const data=record(value)
      if(Object.keys(data).some(k=>!['revision','active','currentPassword','confirmed'].includes(k))||typeof data.active!=='boolean')throw new HttpError(400,'Revisa el cambio de acceso.')
      const revision=revisionOf(data.revision),active=data.active,check=await proof(request,data)
      return transaction(db,()=>{
        const actor=check(),row=account(id)
        if(row.revision!==revision){if(row.revision===revision+1&&Boolean(row.active)===active)return view(row);throw new HttpError(409,'La cuenta cambió en otra ventana. Actualiza el equipo.')}
        if(Boolean(row.active)===active)return view(row)
        if(!active&&row.active&&row.activated&&Number(db.prepare("SELECT COUNT(*) AS n FROM admin_users WHERE role='admin' AND active=1 AND activated=1").get()!.n)<=1)throw new HttpError(409,'No puedes desactivar la última cuenta administrativa activa. Primero activa otra.')
        if(!active&&id===actor)throw new HttpError(400,'No puedes desactivar tu propia cuenta desde esta sesión.')
        db.prepare('UPDATE admin_users SET active=?,revision=revision+1 WHERE id=?').run(active?1:0,id)
        const revoked=Number(db.prepare('DELETE FROM sessions WHERE user_id=?').run(id).changes)
        db.prepare('DELETE FROM admin_password_resets WHERE user_id=?').run(id)
        db.prepare('DELETE FROM admin_invitations WHERE user_id=?').run(id)
        administrationAudit(db,actor,active?'team.account_reactivated':'team.account_deactivated',{targetId:id,sessionsRevoked:revoked})
        return view(account(id))
      })
    },
    async activate(token:unknown,password:unknown){
      if(typeof password!=='string'||[...password].length<15||password.trim().length<15||password.length>128)throw new HttpError(400,'Elige una contraseña de 15 a 128 caracteres. Puedes usar una frase.')
      invitation(token)
      const encoded=await hashPassword(password)
      return transaction(db,()=>{
        const id=invitation(token)
        db.prepare('UPDATE admin_users SET password_hash=?,activated=1,revision=revision+1 WHERE id=?').run(encoded,id)
        db.prepare('DELETE FROM admin_invitations WHERE user_id=?').run(id)
        db.prepare('DELETE FROM admin_password_resets WHERE user_id=?').run(id)
        db.prepare('DELETE FROM sessions WHERE user_id=?').run(id)
        administrationAudit(db,id,'team.account_activated',{})
        return id
      })
    },
  }
}
