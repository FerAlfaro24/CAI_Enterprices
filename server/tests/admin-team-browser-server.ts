/** Fixture de equipo aislada. Nunca abre la base habitual ni crea cuentas de personas reales. */
import { mkdir,mkdtemp,writeFile } from 'node:fs/promises'
import { join,resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
if(process.env.NODE_ENV==='production')throw new Error('Solo pruebas locales ficticias.')
const port=Number(process.env.CAI_API_PORT??3101)
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Puerto inválido.')
const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'admin-team-browser-')),tag=randomUUID().slice(0,8)
const app=createApplication(join(directory,'fixture.sqlite')),encoded=await hashPassword('Frase ficticia de equipo para navegador 2026'),accounts:Record<string,Record<string,{email:string;name:string}>>={}
for(const browser of ['brave','opera']){accounts[browser]={};for(const kind of ['owner','peer']){const email=`${browser}-${kind}-team@example.test`,name=`Prueba ${browser} ${kind} ${tag}`;app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,?,?,'admin')").run(email,name,encoded);accounts[browser]![kind]={email,name}}}
await writeFile(join(directory,'browser.json'),JSON.stringify({accounts,port},null,2),{flag:'wx'})
app.server.listen(port,'127.0.0.1',()=>console.log(`API ficticia de equipo lista. Metadatos: ${join(directory,'browser.json')}`))
process.on('SIGINT',()=>app.server.close(()=>process.exit(0)))
