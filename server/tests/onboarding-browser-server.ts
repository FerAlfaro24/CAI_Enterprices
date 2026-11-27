/** QA aislada de F6: la entrega capturada y las rutas QA nunca se utilizan en server/index.ts. */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { resolve, join, dirname } from 'node:path'
import { readMailSettings, smtpDelivery } from '../email-delivery.ts'
import { createServer } from 'vite'
import { createApplication } from '../app.ts'
import { authRepository, hashPassword } from '../auth.ts'
import type { AccountMail } from '../account-email.ts'
import type { GoogleIdentity } from '../google-auth.ts'
import { requestContext } from '../request-policy.ts'
import { once } from 'node:events'

if (process.env.NODE_ENV !== 'test') throw Error('Esta muestra requiere NODE_ENV=test y cuentas ficticias.')
const webPort=Number(process.argv[2]??4680),apiPort=Number(process.argv[3]??3288)
if(![webPort,apiPort].every(n=>Number.isInteger(n)&&n>=1024&&n<=65535)||webPort===apiPort)throw Error('Puertos QA inválidos.')
const root=resolve('.local/tests');await mkdir(root,{recursive:true});const directory=await mkdtemp(join(root,'onboarding-browser-'))
const realGoogle=process.argv.includes('--real-google'),realMail=process.argv.includes('--smtp'),clientId=realGoogle?process.env.CAI_F6_GOOGLE_CLIENT_ID:realMail?undefined:'123456-onboardingfixture.apps.googleusercontent.com'
if(realGoogle&&!clientId)throw Error('Falta el identificador público de Google para esta prueba.')
const mailbox:AccountMail[]=[];let failNext=false
const mailPath=process.env.CAI_F6_MAIL_CONFIG
if(realMail&&!mailPath)throw Error('Falta CAI_F6_MAIL_CONFIG privado para la prueba SMTP.')
const configuredMail=realMail?readMailSettings({policy:{mode:'local'},host:'127.0.0.1',port:apiPort,dataDirectory:dirname(resolve(mailPath!)),databasePath:join(directory,'fixture.sqlite'),mailConfigPath:resolve(mailPath!)}):undefined
if(configuredMail&&'provider' in configuredMail)throw Error('Esta fixture histórica requiere SMTP; no usará otra credencial de correo.')
const mailSettings=configuredMail
if(mailSettings&&mailSettings.publicOrigin!==`http://localhost:${webPort}`)throw Error('El origen del correo debe coincidir con el puerto de esta fixture.')
const smtp=mailSettings?smtpDelivery(mailSettings):undefined
const app=createApplication(join(directory,'fixture.sqlite'),{clientId,...(realGoogle?{}:{verify:async(credential:string)=>{if(!credential.startsWith('fixture:'))throw Error('Identidad ficticia inválida');return JSON.parse(credential.slice(8)) as GoogleIdentity}})},
  {emailDelivery:async message=>{if(failNext){failNext=false;throw Error('Fallo de entrega ficticio')}if(smtp){if(message.to!==mailSettings!.user)throw Error('La prueba real solo envía a la misma cuenta institucional configurada.');await smtp.deliver(message)}mailbox.push(message);await writeFile(join(directory,'mailbox.json'),JSON.stringify(mailbox,null,2),{mode:0o600})}})
const password='Frase ficticia para onboarding 2026',email='onboarding-admin@example.test'
app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,'Coordinación de prueba',?,'admin')").run(email,await hashPassword(password))
const auth=authRepository(app.db),original=app.server.listeners('request')[0]!
app.server.removeAllListeners('request')
app.server.on('request',(request,response)=>{
  if(!request.url?.startsWith('/api/local/__qa/')){original.call(app.server,request,response);return}
  try {
    const context=requestContext(request,{mode:'local'})
    if(!auth.session(request)){response.writeHead(401);response.end();return}
    if(context.path==='/api/local/__qa/mailbox'&&context.method==='GET'){response.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});response.end(JSON.stringify({mailbox}));return}
    if(context.path==='/api/local/__qa/fail-next'&&context.method==='POST'){failNext=true;response.writeHead(200,{'Content-Type':'application/json'});response.end('{}');return}
    response.writeHead(404);response.end()
  }catch{response.writeHead(403);response.end()}
})
app.server.listen(apiPort,'127.0.0.1');await once(app.server,'listening')
const vite=await createServer({cacheDir:`node_modules/.vite-cai-web-${apiPort}`,server:{port:webPort,strictPort:true,host:'127.0.0.1',proxy:{'/api/local':{target:`http://127.0.0.1:${apiPort}`}}}});await vite.listen()
app.server.once('close',()=>smtp?.close())
const metadata={baseURL:`http://localhost:${webPort}`,directory,email,password,realGoogle,delivery:realMail?'smtp':'captured-only',clientId}
await writeFile(join(directory,'fixture.json'),JSON.stringify(metadata,null,2),{mode:0o600});await writeFile(join(root,realMail?'onboarding-smtp-latest.json':realGoogle?'onboarding-real-latest.json':'onboarding-browser-latest.json'),JSON.stringify(metadata,null,2),{mode:0o600})
console.info(`QA F6 lista en ${metadata.baseURL}; correo ${realMail?'SMTP real solo al remitente institucional':'capturado en fixture privada'}; Google ${realGoogle?'real':'simulado'}.`)
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>{void vite.close().then(()=>app.server.close())})
