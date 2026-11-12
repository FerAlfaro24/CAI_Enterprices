/** Buzón y cuentas exclusivamente ficticios. No es una herramienta de recuperación real. */
import { mkdir,mkdtemp,writeFile } from 'node:fs/promises'
import { join,resolve } from 'node:path'
import { randomBytes,randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import type { AdminRecoveryMail } from '../admin-recovery.ts'

if(process.env.NODE_ENV==='production')throw new Error('Solo pruebas ficticias locales.')
const port=Number(process.env.CAI_API_PORT??3101),mailPort=3102
if(!Number.isInteger(port)||port<1024||port>65535||port===mailPort)throw new Error('Puerto de prueba inválido.')
const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'admin-recovery-browser-'))
const mails:AdminRecoveryMail[]=[],mailKey=randomBytes(32).toString('hex'),tag=randomUUID().slice(0,8)
const app=createApplication(join(directory,'fixture.sqlite'),{},{adminRecoveryDelivery:async mail=>{mails.push(mail)}})
const hash=await hashPassword('Frase ficticia inicial de recuperación navegador 2026'),accounts:Record<string,Record<string,{email:string;name:string}>>={}
for(const browser of ['brave','opera']){
  accounts[browser]={}
  for(const kind of ['owner','peer']){const email=`${browser}-${kind}-recovery@example.test`,name=`Prueba ${browser} ${kind} ${tag}`;app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,?,?,'admin')").run(email,name,hash);accounts[browser]![kind]={email,name}}
}
// Servidor separado, autenticado y solo loopback: el producto no tiene un endpoint de buzón.
const mailbox=createServer((request,response)=>{
  if(request.method!=='GET'||request.url!=='/mailbox'||request.headers.authorization!==`Bearer ${mailKey}`||!['127.0.0.1','::ffff:127.0.0.1'].includes(request.socket.remoteAddress??'')){response.writeHead(403);response.end();return}
  response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify(mails.filter(mail=>app.db.prepare("SELECT user_id FROM admin_password_resets WHERE state='delivered' AND user_id=(SELECT id FROM admin_users WHERE email=?)").get(mail.to))))
})
await writeFile(join(directory,'browser.json'),JSON.stringify({accounts,port,mailPort,mailKey},null,2),{flag:'wx'})
mailbox.listen(mailPort,'127.0.0.1',()=>app.server.listen(port,'127.0.0.1',()=>console.log(`API y buzón ficticios listos. Metadatos privados de prueba: ${join(directory,'browser.json')}`)))
process.on('SIGINT',()=>mailbox.close(()=>app.server.close(()=>process.exit(0))))
