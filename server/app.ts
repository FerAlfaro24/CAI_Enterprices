import { accountEmail, type AccountMailDelivery } from './account-email.ts'
import { communityModeration } from './community-moderation.ts'
import { learningRepository } from './learning.ts'
import { socialProfiles } from './social-profiles.ts'
import { institutionalPosts } from './institutional-posts.ts'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { openDatabase } from './database.ts'
import { accessRepository } from './access-repository.ts'
import { authRepository } from './auth.ts'
import { studentAccounts } from './student-accounts.ts'
import { googleAccounts, type GoogleOptions } from './google-auth.ts'
import { publications, validatePublication } from './publications.ts'
import { notices } from './notices.ts'
import { administration } from './administration.ts'
import { contactRepository, validateContact } from './contact.ts'
import { galleryRepository } from './gallery.ts'
import { importOfficialMedia } from './official-media.ts'
import { studentProfiles } from './public-profiles.ts'
import { adminRecovery, adminRecoveryMessage, type AdminRecoveryDelivery } from './admin-recovery.ts'
import { adminTeam } from './admin-team.ts'
import { studentRecords } from './student-records.ts'
import { commentsRepository, commentCursor, commentStatus } from './comments.ts'
import { challengesRepository } from './challenges.ts'
import { badgesRepository } from './badges.ts'
import { galleryLimits } from './contracts.ts'
import { HttpError, record, revisionOf, validateSubmission } from './validation.ts'
import type { PublicationDecision, RequestDecision } from './contracts.ts'
import { randomUUID } from 'node:crypto'
import { localPolicy, projectDirectory, type RequestPolicy } from './runtime-config.ts'
import { join } from 'node:path'
import { requestContext, validateRequestPolicy } from './request-policy.ts'
import { requestLogFields, writeOperationalLog, type OperationalLog } from './operational-log.ts'

async function body(request: IncomingMessage, maximum = 16_384) {
  if (request.headers['content-type']?.split(';')[0]?.trim() !== 'application/json') throw new HttpError(415, 'Envía los datos como JSON.')
  const chunks: Buffer[] = []
  let size = 0
  for await (const part of request) {
    const chunk = Buffer.from(part)
    size += chunk.length
    if (size <= maximum) chunks.push(chunk)
  }
  if (size > maximum) throw new HttpError(413, 'La solicitud es demasiado grande.')
  try { return record(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
  catch (error) {
    if (error instanceof HttpError) throw error
    throw new HttpError(400, 'No se pudieron leer los datos enviados.')
  }
}

function json(response: ServerResponse, status: number, data: unknown) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' })
  response.end(JSON.stringify(data))
}

export function createApplication(databasePath: string, googleOptions: GoogleOptions = {}, options: {emailDelivery?: AccountMailDelivery;adminRecoveryDelivery?: AdminRecoveryDelivery;challengeClock?:()=>Date;runtime?:RequestPolicy;log?:OperationalLog;officialMediaDirectory?:string;demonstration?:boolean} = {}) {
  const policy = validateRequestPolicy(options.runtime ?? localPolicy)
  if(options.demonstration&&policy.mode!=='local')throw Error('La demostración de comunidad solo puede ejecutarse en local.')
  const cookies = { secure: policy.mode === 'production' }
  const log = options.log ?? (policy.mode === 'production' ? event => console.info(JSON.stringify(event)) : undefined)
  const db = openDatabase(databasePath)
  const emails = accountEmail(db, options.emailDelivery)
  const access = accessRepository(db, emails.enabled ? emails.approved : undefined)
  const dispatchEmail = () => setImmediate(() => { void emails.deliverPending().catch(() => console.error('No se pudo procesar la entrega de cuentas.')) })
  const auth = authRepository(db, cookies)
  const studentAuth = studentAccounts(db, cookies)
  const google = googleAccounts(db, googleOptions, cookies)
  const posts = publications(db)
  const institutional = institutionalPosts(db)
  const mail = notices(db)
  const config = administration(db)
  const contacts = contactRepository(db)
  const gallery = galleryRepository(db)
  const profiles = studentProfiles(db)
  const recovery = adminRecovery(db, options.adminRecoveryDelivery)
  const team=adminTeam(db)
  const records=studentRecords(db)
  const comments=commentsRepository(db)
  const moderation=communityModeration(db)
  const challenges=challengesRepository(db,options.challengeClock)
  const badges=badgesRepository(db)
  const learning=learningRepository(db), socialProfile=socialProfiles(db)
  const limits = new Map<string, { count: number; until: number }>()
  const limit = (key: string, maximum: number, duration: number) => {
    const now = Date.now()
    for (const [name, entry] of limits) if (entry.until <= now) limits.delete(name)
    const entry = limits.get(key) ?? { count: 0, until: now + duration }
    entry.count++
    limits.set(key, entry)
    if (entry.count > maximum) throw new HttpError(429, 'Has hecho varios intentos. Espera unos minutos antes de volver a probar.')
  }

  const handle = async (request: IncomingMessage, response: ServerResponse) => {
    const { url, path, method, clientAddress } = requestContext(request, policy)
    limit(`all:${clientAddress}`, 600, 60_000)
    if (path === '/api/local/health' && method === 'GET') return json(response, 200, { status: 'ok', mode: policy.mode === 'production' ? 'production' : 'local-test' })
    if (path === '/api/local/ready' && method === 'GET') {
      db.prepare('SELECT 1').get()
      return json(response, 200, { status: 'ok' })
    }
    if (path === '/api/local/delivery/config' && method === 'GET') return json(response, 200, { enabled:emails.enabled, adminEnabled:Boolean(options.adminRecoveryDelivery) })
    if (path === '/api/local/catalog' && method === 'GET') return json(response, 200, config.publicCatalog())
    if (path === '/api/local/admin-recovery/request' && method === 'POST') {
      limit(`admin-recovery:${clientAddress}`,10,15*60_000)
      const data=await body(request)
      if (Object.keys(data).some(key=>key!=='email') || typeof data.email!=='string' || data.email.length>160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) throw new HttpError(400,'Escribe un correo válido.')
      recovery.request(data.email.trim())
      json(response,202,{message:options.adminRecoveryDelivery ? 'Si el correo corresponde a una cuenta administrativa, recibirás un enlace de recuperación. Revisa también Spam. No se ha cambiado ninguna contraseña.' : policy.mode === 'local' ? adminRecoveryMessage : 'Si el correo corresponde a una cuenta administrativa, se preparará su recuperación. Consulta con coordinación para recibir ayuda. No se ha cambiado ninguna contraseña.'})
      // La entrega ocurre fuera de la respuesta pública; ninguna URL privada vuelve al solicitante.
      setImmediate(()=>{void recovery.deliverPending().catch(()=>console.error('No se pudo procesar la entrega administrativa.'))})
      return
    }
    if (path === '/api/local/admin-recovery/reset' && method === 'POST') {
      limit(`admin-reset:${clientAddress}`,20,15*60_000)
      const data=await body(request)
      if (Object.keys(data).some(key=>!['token','password','confirm'].includes(key)) || data.confirm!==data.password) throw new HttpError(400,'Revisa la confirmación de contraseña.')
      const currentUser=auth.session(request)
      const recoveredId=await recovery.changePassword(data.token,data.password)
      if (!currentUser || currentUser.id===recoveredId) response.setHeader('Set-Cookie',auth.end(request))
      return json(response,200,{ok:true})
    }
    if(path==='/api/local/admin-activation'&&method==='POST'){
      limit(`admin-activation:${clientAddress}`,20,15*60_000)
      const data=await body(request)
      if(Object.keys(data).some(key=>!['token','password','confirm'].includes(key))||data.confirm!==data.password)throw new HttpError(400,'Revisa la confirmación de contraseña.')
      const current=auth.session(request),id=await team.activate(data.token,data.password)
      if(!current||current.id===id)response.setHeader('Set-Cookie',auth.end(request))
      return json(response,200,{ok:true})
    }
    if (path === '/api/local/contact' && method === 'POST') {
      limit(`contact:${clientAddress}`, 20, 60 * 60_000)
      const key = request.headers['idempotency-key']
      if (typeof key !== 'string' || !/^[a-f0-9-]{36}$/i.test(key)) throw new HttpError(400, 'Falta el identificador del envío.')
      return json(response, 201, contacts.submit(validateContact(await body(request)), key))
    }
    if (path === '/api/local/recovery/request' && method === 'POST') {
      limit(`recovery:${clientAddress}`, 10, 15 * 60_000)
      const data = await body(request)
      if (Object.keys(data).some((key) => key !== 'email') || typeof data.email !== 'string' || data.email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) throw new HttpError(400, 'Escribe un correo válido.')
      if (emails.enabled) { emails.requestRecovery(data.email.trim()); dispatchEmail() } else mail.requestRecovery(data.email.trim())
      return json(response, 202, { message: emails.enabled ? 'Si existe una cuenta con contraseña aprobada y activa, recibirás un enlace de recuperación. Revisa también Spam. Si entras con Google, recupera tu cuenta desde Google.' : policy.mode === 'local' ? 'Si existe una cuenta con contraseña aprobada y activa, se preparará su recuperación. En estas pruebas locales no se envían correos; consulta con coordinación. Si entras con Google, recupera tu cuenta desde Google.' : 'Si existe una cuenta con contraseña aprobada y activa, se preparará su recuperación. Si necesitas ayuda, consulta con coordinación. Si entras con Google, recupera tu cuenta desde Google.' })
    }
    if (path === '/api/local/recovery/reset' && method === 'POST') {
      limit(`reset:${clientAddress}`, 20, 15 * 60_000)
      const data = await body(request)
      if (Object.keys(data).some((key) => !['token','password','confirm'].includes(key)) || data.confirm !== data.password) throw new HttpError(400, 'Revisa la confirmación de contraseña.')
      await mail.changePassword(data.token, data.password)
      response.setHeader('Set-Cookie', [...google.end(request), studentAuth.end(request)])
      return json(response, 200, { ok: true })
    }
    if (path === '/api/local/google/config' && method === 'GET') return json(response, 200, google.config())
    if (path === '/api/local/google/challenge' && method === 'POST') {
      limit(`google-challenge:${clientAddress}`, 30, 15 * 60_000)
      const challenge = google.challenge(request)
      response.setHeader('Set-Cookie', challenge.cookie)
      return json(response, 200, { nonce: challenge.nonce, clientId: challenge.clientId })
    }
    if (path === '/api/local/google/signin' && method === 'POST') {
      limit(`google-signin:${clientAddress}`, 30, 15 * 60_000)
      const data = await body(request)
      if (Object.keys(data).some((key) => key !== 'credential')) throw new HttpError(400, 'El acceso contiene datos no admitidos.')
      const result = await google.signIn(request, data.credential)
      const user = studentAuth.forGoogle(result.subject)
      response.setHeader('Set-Cookie', [...result.cookies, studentAuth.end(request), ...(user ? [studentAuth.start(user)] : [])])
      return json(response, 200, { destination: user ? '/community' : '/solicitud-google' })
    }
    if (path === '/api/local/student/google' && method === 'GET') {
      const member=studentAuth.session(request)
      if(!member)throw new HttpError(401,'Inicia sesión para consultar tu cuenta.')
      return json(response,200,{enabled:google.config().enabled,linked:Boolean(db.prepare('SELECT subject FROM google_identities WHERE request_id=?').get(Number(member.id.slice(4))))})
    }
    if (path === '/api/local/student/google/link' && method === 'POST') {
      limit(`google-link:${clientAddress}`,20,15*60_000)
      const member=studentAuth.session(request)
      if(!member)throw new HttpError(401,'Entra primero con tu contraseña de CAI para vincular tu cuenta.')
      const data=await body(request)
      if(Object.keys(data).some(key=>key!=='credential'))throw new HttpError(400,'Revisa el acceso con Google.')
      const result=await google.signIn(request,data.credential,{requestId:Number(member.id.slice(4)),isCurrent:()=>studentAuth.session(request)?.id===member.id})
      const linked=studentAuth.forGoogle(result.subject)
      if(!linked||linked.id!==member.id)throw new HttpError(401,'No pudimos vincular la cuenta. Vuelve a entrar.')
      response.setHeader('Set-Cookie',[...result.cookies,studentAuth.end(request),studentAuth.start(linked)])
      return json(response,200,{destination:'/community'})
    }
    if (path === '/api/local/google/session' && method === 'GET') return json(response, 200, google.state(request))
    if (path === '/api/local/google/logout' && method === 'POST') {
      response.setHeader('Set-Cookie', [...google.end(request), studentAuth.end(request)])
      return json(response, 200, { ok: true })
    }
    if (path === '/api/local/google/profile' && method === 'POST') {
      limit(`google-profile:${clientAddress}`, 20, 60 * 60_000)
      const identity = google.requireIdentity(request)
      const data = await body(request)
      // Rechazar, en lugar de aceptar silenciosamente, el cambio del correo verificado.
      if (typeof data.email !== 'string' || data.email.toLowerCase() !== identity.email.toLowerCase()) throw new HttpError(400, 'Usa el correo confirmado por Google.')
      const key = request.headers['idempotency-key']
      if (typeof key !== 'string' || !/^[a-f0-9-]{36}$/i.test(key)) throw new HttpError(400, 'Falta el identificador de la solicitud.')
      return json(response, 201, access.submit(validateSubmission(data, new Date(), config.groups()), key, identity.subject))
    }
    if (path === '/api/local/google/continue' && method === 'POST') {
      const identity = google.requireIdentity(request)
      const user = studentAuth.forGoogle(identity.subject)
      if (!user) throw new HttpError(403, 'CAI debe aprobar tu solicitud y mantener el acceso activo para que puedas entrar.')
      response.setHeader('Set-Cookie', [studentAuth.end(request), studentAuth.start(user)])
      return json(response, 200, { destination: '/community' })
    }
    if (path === '/api/local/auth/session' && method === 'GET') return json(response, 200, { user: auth.session(request) })
    if (path === '/api/local/auth/login' && method === 'POST') {
      limit(`login:${clientAddress}`, 10, 15 * 60_000)
      const data = await body(request)
      if (typeof data.email !== 'string' || data.email.length > 160 || typeof data.password !== 'string' || data.password.length < 1 || data.password.length > 128) throw new HttpError(400, 'Escribe el correo y la contraseña.')
      const user = await auth.login(data.email.trim(), data.password)
      if (!user) throw new HttpError(401, 'El correo o la contraseña no son correctos.')
      limits.delete(`login:${clientAddress}`)
      response.setHeader('Set-Cookie', [auth.end(request), auth.start(user)])
      return json(response, 200, { user })
    }
    if (path === '/api/local/auth/logout' && method === 'POST') {
      response.setHeader('Set-Cookie', auth.end(request))
      return json(response, 200, { ok: true })
    }
    if (path === '/api/local/activation' && method === 'POST') {
      limit(`activation:${clientAddress}`, 20, 15 * 60_000)
      const data = await body(request)
      if (Object.keys(data).some((key) => !['token', 'password', 'confirm'].includes(key))) throw new HttpError(400, 'La activación contiene datos no admitidos.')
      if (typeof data.confirm !== 'string' || data.password !== data.confirm) throw new HttpError(400, 'Las contraseñas no coinciden.')
      await studentAuth.activate(data.token, data.password)
      // Exigir el acceso normal después de activar, incluso si este navegador
      // conservaba una sesión de otro alumno. No se altera la sesión administrativa.
      response.setHeader('Set-Cookie', [...google.end(request), studentAuth.end(request)])
      return json(response, 200, { ok: true })
    }
    if (path === '/api/local/student/session' && method === 'GET') return json(response, 200, { user: studentAuth.session(request) })
    if (path === '/api/local/student/login' && method === 'POST') {
      limit(`student-login:${clientAddress}`, 10, 15 * 60_000)
      const data = await body(request)
      if (typeof data.email !== 'string' || data.email.length > 160 || typeof data.password !== 'string' || data.password.length < 1 || data.password.length > 128) throw new HttpError(400, 'Escribe el correo y la contraseña.')
      const user = await studentAuth.login(data.email.trim(), data.password)
      if (!user) throw new HttpError(401, 'Los datos no son correctos o el acceso aún no está disponible. Consulta con CAI.')
      limits.delete(`student-login:${clientAddress}`)
      response.setHeader('Set-Cookie', [...google.end(request), studentAuth.end(request), studentAuth.start(user)])
      return json(response, 200, { user })
    }
    if (path === '/api/local/student/logout' && method === 'POST') {
      response.setHeader('Set-Cookie', [...google.end(request), studentAuth.end(request)])
      return json(response, 200, { ok: true })
    }
    const image = path.match(/^\/api\/local\/gallery\/([a-f0-9-]{36})\/image$/)
    if (image && method === 'GET') {
      const admin = auth.session(request), student = studentAuth.session(request)
      if (!admin && !student) throw new HttpError(401, 'Inicia sesión para ver imágenes privadas.')
      const bytes = gallery.image(image[1]!, student, Boolean(admin))
      response.writeHead(200, { 'Content-Type':'image/webp', 'Content-Length':bytes.length, 'Cache-Control':'private, no-store, max-age=0', 'X-Content-Type-Options':'nosniff', 'Cross-Origin-Resource-Policy':'same-origin', 'Referrer-Policy':'no-referrer', 'Content-Disposition':'inline; filename="cai-image.webp"', 'Content-Security-Policy':"default-src 'none'; sandbox" })
      response.end(bytes)
      return
    }
    const learningImage=path.match(/^\/api\/local\/learning-images\/([a-f0-9-]{36})$/)
    if(learningImage&&method==='GET') {
      const admin=auth.session(request),student=studentAuth.session(request)
      if(!admin&&!student)throw new HttpError(401,'Inicia sesión para ver la imagen.')
      const bytes=learning.image(learningImage[1]!,student,Boolean(admin))
      response.writeHead(200,{'Content-Type':'image/webp','Content-Length':bytes.length,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; sandbox"})
      response.end(bytes);return
    }
    if (path.startsWith('/api/local/student/')) {
      const user = studentAuth.session(request)
      if (!user) throw new HttpError(401, 'Tu sesión terminó o el acceso no está disponible. Vuelve a entrar o consulta con CAI.')
      const protectedBody = async (maximum?:number) => {
        const data = await body(request,maximum)
        if (studentAuth.session(request)?.id !== user.id) throw new HttpError(401, 'Tu sesión terminó. Vuelve a entrar antes de guardar cambios.')
        return data
      }
      if(path==='/api/local/student/achievements'&&method==='GET')return json(response,200,learning.mine(user,commentCursor(url.searchParams.get('before'))))
      const achievement=path.match(/^\/api\/local\/student\/achievements(?:\/([1-9]\d*)(?:\/(submit|cancel))?)?$/)
      if(achievement&&(method==='POST'||method==='PATCH')) {
        limit(`learning:${user.id}`,30,60*60_000)
        const id=achievement[1]?Number(achievement[1]):null
        if(id!==null&&!Number.isSafeInteger(id))throw new HttpError(400,'Logro inválido.')
        if(id&&achievement[2]&&method==='POST')return json(response,200,{item:achievement[2]==='submit'?learning.submit(user,id,await protectedBody()):learning.cancel(user,id,await protectedBody())})
        if(!achievement[2]&&((id&&method==='PATCH')||(!id&&method==='POST'))){
          const key=request.headers['idempotency-key'];if(typeof key!=='string')throw new HttpError(400,'Falta el identificador de guardado.')
          return json(response,id?200:201,{item:await learning.save(user,id,await protectedBody(12_610_000),key,()=>studentAuth.session(request)?.id===user.id)})
        }
      }
      const social=path.match(/^\/api\/local\/student\/members\/([a-f0-9-]{36}|cai-team)$/)
      if(social&&method==='GET')return json(response,200,socialProfile(user,social[1]!,commentCursor(url.searchParams.get('before'))))
      if(path==='/api/local/student/badges'&&method==='GET')return json(response,200,badges.snapshot(user))
      if(path==='/api/local/student/badge-requests'&&method==='GET')return json(response,200,badges.mine(user,commentCursor(url.searchParams.get('before'))))
      if(path==='/api/local/student/badge-requests'&&method==='POST'){
        limit(`badge-request:${user.id}`,20,60*60_000);const key=request.headers['idempotency-key'];if(typeof key!=='string')throw new HttpError(400,'Falta el identificador de tu solicitud.');return json(response,201,{request:badges.apply(user,await protectedBody(),key)})
      }
      const badgeRequest=path.match(/^\/api\/local\/student\/badge-requests\/(BSR-\d+)(\/withdraw)?$/)
      if(badgeRequest&&!badgeRequest[2]&&method==='GET')return json(response,200,badges.requestDetail(user,badgeRequest[1]!))
      if(badgeRequest&&badgeRequest[2]&&method==='POST'){limit(`badge-withdraw:${user.id}`,30,15*60_000);badges.withdraw(user,badgeRequest[1]!,await protectedBody());return json(response,200,{ok:true})}
      const badgeGrant=path.match(/^\/api\/local\/student\/badges\/(BDG-\d+)$/)
      if(badgeGrant&&method==='GET')return json(response,200,badges.grantDetail(user,badgeGrant[1]!))
      if(path==='/api/local/student/challenges'&&method==='GET')return json(response,200,challenges.snapshot(user))
      if(path==='/api/local/student/challenges/history'&&method==='GET')return json(response,200,challenges.history(user,commentCursor(url.searchParams.get('before'))))
      const challenge=path.match(/^\/api\/local\/student\/challenges\/(Q-\d+)\/answer$/)
      if(challenge&&method==='POST'){
        limit(`challenge:${user.id}`,60,15*60_000)
        const key=request.headers['idempotency-key'];if(typeof key!=='string')throw new HttpError(400,'Falta el identificador de tu respuesta.')
        return json(response,200,{result:challenges.answer(user,challenge[1]!,await protectedBody(),key)})
      }
      if (path === '/api/local/student/me' && method === 'GET') return json(response, 200, { user })
      if (path === '/api/local/student/profile' && method === 'GET') return json(response, 200, { profile: profiles.get(user) })
      if (path === '/api/local/student/profile' && method === 'PATCH') {
        limit(`profile:${user.id}`, 30, 15 * 60_000)
        return json(response, 200, { profile: profiles.update(user, await protectedBody()) })
      }
      if (path === '/api/local/student/gallery' && method === 'GET') return json(response, 200, { images: gallery.forStudent(user) })
      if (path === '/api/local/student/notices' && method === 'GET') return json(response, 200, { notices: mail.forStudent(user) })
      if(path==='/api/local/student/notices/archive-viewed'&&method==='POST'){
        limit(`notices-close:${user.id}`,60,15*60_000);mail.archiveViewed(user,await protectedBody());return json(response,200,{ok:true})
      }
      if(path==='/api/local/student/notices/dismiss-history'&&method==='POST'){
        limit(`notices-dismiss:${user.id}`,60,15*60_000);mail.dismissHistory(user,await protectedBody());return json(response,200,{ok:true})
      }
      const seen = path.match(/^\/api\/local\/student\/notices\/(\d+)\/seen$/)
      if (seen && method === 'POST') {
        const id = Number(seen[1]), data = await protectedBody()
        if (!Number.isSafeInteger(id) || id < 1 || Object.keys(data).length) throw new HttpError(400, 'Aviso no válido.')
        mail.studentSeen(user, id)
        return json(response, 200, { ok: true })
      }
      if (path === '/api/local/student/group' && method === 'GET') return json(response, 200, { members: studentAuth.group(user) })
      if (path === '/api/local/student/posts' && method === 'GET') return json(response, 200, { demonstration:options.demonstration===true, posts: posts.feed(user).map(post=>({...post,commentCount:comments.count(post.id)})), mine: posts.mine(user) })
      const conversation=path.match(/^\/api\/local\/student\/posts\/(PUB-\d+)\/comments(\/mine)?$/)
      if(conversation&&method==='GET')return json(response,200,conversation[2]?comments.mine(user,conversation[1]!,commentCursor(url.searchParams.get('before'))):comments.list(user,conversation[1]!,commentCursor(url.searchParams.get('before'))))
      if(conversation&&!conversation[2]&&method==='POST'){
        limit(`comment:${user.id}`,20,60*60_000)
        const key=request.headers['idempotency-key'];if(typeof key!=='string')throw new HttpError(400,'Falta el identificador del comentario.')
        return json(response,201,{comment:comments.create(user,conversation[1]!,await protectedBody(),key)})
      }
      const ownComment=path.match(/^\/api\/local\/student\/comments\/(CMT-\d+)\/withdraw$/)
      if(ownComment&&method==='POST'){
        limit(`comment-withdraw:${user.id}`,60,15*60_000);comments.withdraw(user,ownComment[1]!,await protectedBody());return json(response,200,{ok:true})
      }
      const reaction = path.match(/^\/api\/local\/student\/posts\/(PUB-\d+)\/reaction$/)
      if (reaction && method === 'PATCH') {
        limit(`reaction:${user.id}`, 60, 15 * 60_000)
        const key = request.headers['idempotency-key']
        if (typeof key !== 'string') throw new HttpError(400, 'Falta el identificador de la reacción.')
        posts.react(user, reaction[1]!, await protectedBody(), key)
        return json(response, 200, { ok: true })
      }
      if (path === '/api/local/student/posts' && method === 'POST') {
        limit(`post:${user.id}`, 20, 60 * 60_000)
        const key = request.headers['idempotency-key']
        if (typeof key !== 'string' || !/^[a-f0-9-]{36}$/i.test(key)) throw new HttpError(400, 'Falta el identificador del envío.')
        return json(response, 201, { post: posts.create(user, validatePublication(await protectedBody()), key) })
      }
      const withdrawal = path.match(/^\/api\/local\/student\/posts\/(PUB-\d+)\/withdraw$/)
      if (withdrawal && method === 'POST') {
        const data = await protectedBody()
        if (Object.keys(data).some((key) => key !== 'revision')) throw new HttpError(400, 'El retiro contiene datos no admitidos.')
        posts.withdraw(user, withdrawal[1]!, revisionOf(data.revision))
        return json(response, 200, { ok: true })
      }
      throw new HttpError(404, 'No se encontró esta operación.')
    }
    if (path === '/api/local/requests' && method === 'POST') {
      limit(`submission:${clientAddress}`, 20, 60 * 60_000)
      const key = request.headers['idempotency-key']
      if (typeof key !== 'string' || !/^[a-f0-9-]{36}$/i.test(key)) throw new HttpError(400, 'Falta el identificador de la solicitud.')
      return json(response, 201, access.submit(validateSubmission(await body(request), new Date(), config.groups()), key))
    }
    const user = auth.session(request)
    if (!user || user.role !== 'admin') throw new HttpError(401, 'Inicia sesión para abrir la administración local.')
    const protectedBody = async (maximum?: number) => {
      const data = await body(request, maximum)
      if (auth.session(request)?.id !== user.id) throw new HttpError(401, 'Tu sesión terminó. Vuelve a entrar antes de guardar cambios.')
      return data
    }
    if(path==='/api/local/community/posts'&&method==='GET')return json(response,200,moderation.feed(commentCursor(url.searchParams.get('before'))))
    const communityComments=path.match(/^\/api\/local\/community\/posts\/(PUB-\d+)\/comments$/)
    if(communityComments&&method==='GET')return json(response,200,moderation.comments(communityComments[1]!,commentCursor(url.searchParams.get('before'))))
    if(path==='/api/local/community/restrictions'&&method==='GET'){
      const view=url.searchParams.get('view')??'active';if(!['active','history'].includes(view))throw new HttpError(400,'Elige suspensiones activas o historial.')
      return json(response,200,moderation.restrictions(view==='history',commentCursor(url.searchParams.get('before'))))
    }
    const communityAction=path.match(/^\/api\/local\/community\/students\/(CAI-\d+)(?:\/comments\/(CMT-\d+))?\/moderate$/)
    if(communityAction&&method==='POST'){
      limit(`community-moderation:${user.id}`,60,15*60_000)
      const key=request.headers['idempotency-key'];return json(response,200,moderation.apply(communityAction[1]!,communityAction[2]??null,await protectedBody(),typeof key==='string'?key:'',user.id))
    }
    const endRestriction=path.match(/^\/api\/local\/community\/restrictions\/([1-9]\d*)\/revoke$/)
    if(endRestriction&&method==='POST'){
      limit(`community-moderation:${user.id}`,60,15*60_000);const id=Number(endRestriction[1]);if(!Number.isSafeInteger(id))throw new HttpError(400,'Suspensión inválida.')
      return json(response,200,moderation.revoke(id,await protectedBody(),user.id))
    }
    if(path==='/api/local/achievements/reviews'&&method==='GET')return json(response,200,learning.reviews(commentCursor(url.searchParams.get('before'))))
    const learningReview=path.match(/^\/api\/local\/achievements\/([1-9]\d*)\/review$/)
    if(learningReview&&method==='POST'){
      limit(`learning-review:${user.id}`,60,15*60_000)
      const id=Number(learningReview[1]);if(!Number.isSafeInteger(id))throw new HttpError(400,'Logro inválido.')
      return json(response,200,{item:learning.decide(id,await protectedBody(),user.id)})
    }
    if(path==='/api/local/badge-counts'&&method==='GET')return json(response,200,{counts:{...badges.counts(),pending:badges.counts().pending+learning.pendingCount()}})
    if(path==='/api/local/badge-requests'&&method==='GET')return json(response,200,badges.reviews(url.searchParams.get('status')??'pending',commentCursor(url.searchParams.get('before'))))
    const badgeReview=path.match(/^\/api\/local\/badge-requests\/(BSR-\d+)(?:\/(approve|reject))?$/)
    if(badgeReview&&!badgeReview[2]&&method==='GET')return json(response,200,badges.reviewDetail(badgeReview[1]!))
    if(badgeReview&&badgeReview[2]&&method==='POST'){limit(`badge-review:${user.id}`,60,15*60_000);badges.decide(badgeReview[1]!,badgeReview[2] as 'approve'|'reject',await protectedBody(),user.id);return json(response,200,{ok:true})}
    if(path==='/api/local/badge-grants'&&method==='GET')return json(response,200,badges.grants(commentCursor(url.searchParams.get('before'))))
    if(path==='/api/local/badge-grants'&&method==='POST'){limit(`badge-award:${user.id}`,30,15*60_000);const key=request.headers['idempotency-key'];if(typeof key!=='string')throw new HttpError(400,'Falta el identificador del reconocimiento.');return json(response,201,{grant:badges.award(await protectedBody(),user.id,key)})}
    const grantReview=path.match(/^\/api\/local\/badge-grants\/(BDG-\d+)$/)
    if(grantReview&&method==='GET')return json(response,200,badges.adminGrant(grantReview[1]!))
    if(grantReview&&method==='PATCH'){limit(`badge-correct:${user.id}`,30,15*60_000);badges.correct(grantReview[1]!,await protectedBody(),user.id);return json(response,200,{ok:true})}
    if(path==='/api/local/challenges/bank'&&method==='GET')return json(response,200,{items:challenges.bank()})
    if(path==='/api/local/challenges/controls'&&method==='GET')return json(response,200,challenges.controls())
    if(path==='/api/local/challenges/controls'&&method==='PATCH'){challenges.configure(await protectedBody(),user.id);return json(response,200,{ok:true})}
    if(path==='/api/local/challenges/calendar'&&method==='GET')return json(response,200,challenges.calendar(url.searchParams.get('day'),Number(url.searchParams.get('groupId'))))
    if(path==='/api/local/challenges/calendar'&&method==='POST'){
      limit(`challenge-calendar:${user.id}`,60,15*60_000);return json(response,200,challenges.schedule(await protectedBody(),user.id))
    }
    const bankQuestion=path.match(/^\/api\/local\/challenges\/bank\/([a-zA-Z0-9-]+)$/)
    if((path==='/api/local/challenges/bank'&&method==='POST')||(bankQuestion&&method==='PATCH')){
      limit(`challenge-bank:${user.id}`,60,15*60_000)
      const key=request.headers['idempotency-key'];return json(response,200,{item:challenges.saveBank(bankQuestion?.[1]??null,await protectedBody(),user.id,typeof key==='string'?key:'')})
    }
    if (path === '/api/local/auth/password' && method === 'POST') {
      limit(`admin-password:${user.id}`, 5, 15 * 60_000)
      await auth.changePassword(request, await protectedBody())
      response.setHeader('Set-Cookie', auth.end(request))
      return json(response, 200, { ok: true })
    }
    if(path==='/api/local/admin-team'&&method==='GET')return json(response,200,{accounts:team.list()})
    if(path==='/api/local/admin-team'&&method==='POST'){
      limit(`admin-team:${user.id}`,30,15*60_000)
      const key=request.headers['idempotency-key']
      if(typeof key!=='string')throw new HttpError(400,'Falta el identificador del alta.')
      return json(response,201,{account:await team.create(request,await protectedBody(),key)})
    }
    const teamAccount=path.match(/^\/api\/local\/admin-team\/(\d+)(\/invitation)?$/)
    if(teamAccount&&((method==='PATCH'&&!teamAccount[2])||(method==='POST'&&teamAccount[2]))){
      limit(`admin-team:${user.id}`,30,15*60_000)
      const data=await protectedBody(),id=Number(teamAccount[1])
      return teamAccount[2]?json(response,200,await team.invite(request,id,data)):json(response,200,{account:await team.setActive(request,id,data)})
    }
    if (path === '/api/local/gallery' && method === 'GET') return json(response, 200, { images: gallery.list() })
    if (path === '/api/local/gallery/official/import' && method === 'POST') {
      limit(`gallery-official:${user.id}`, 10, 60 * 60_000)
      const data = await protectedBody()
      const directory = options.officialMediaDirectory ?? (policy.mode === 'local' ? join(projectDirectory, '.local', 'official-media') : undefined)
      return json(response, 200, await importOfficialMedia(gallery, data, () => auth.session(request)?.id ?? null, directory))
    }
    if (path === '/api/local/gallery' && method === 'POST') {
      limit(`gallery:${user.id}`, 30, 60 * 60_000)
      const key = request.headers['idempotency-key']
      if (typeof key !== 'string' || !/^[a-f0-9-]{36}$/i.test(key)) throw new HttpError(400, 'Falta el identificador de envío.')
      const data = await protectedBody( Math.ceil(galleryLimits.uploadBytes / 3) * 4 + 16_384)
      return json(response, 201, { image: await gallery.create(data,key,()=>auth.session(request)?.id??null) })
    }
    const withdrawalImage = path.match(/^\/api\/local\/gallery\/([a-f0-9-]{36})\/withdraw$/)
    if (withdrawalImage && method === 'POST') {
      gallery.withdraw(withdrawalImage[1]!,await protectedBody(),user.id)
      return json(response, 200, { ok:true })
    }
    if (path === '/api/local/contacts' && method === 'GET') return json(response, 200, { contacts: contacts.list() })
    const contact = path.match(/^\/api\/local\/contacts\/(CON-\d+)$/)
    if (contact && method === 'PATCH') {
      contacts.update(contact[1]!, await protectedBody(), user.id)
      return json(response, 200, { ok: true })
    }
    if (path === '/api/local/configuration' && method === 'GET') return json(response, 200, { groups: config.groups(), settings: config.settings() })
    if (path === '/api/local/configuration' && method === 'PATCH') {
      config.updateSettings(await protectedBody(), user.id)
      return json(response, 200, { ok: true })
    }
    if (path === '/api/local/groups' && method === 'POST') return json(response, 201, { id: config.createGroup(await protectedBody(), user.id) })
    const catalogGroup = path.match(/^\/api\/local\/groups\/(\d+)$/)
    if (catalogGroup && method === 'PATCH') {
      const id = Number(catalogGroup[1])
      if (!Number.isSafeInteger(id) || id < 1) throw new HttpError(400, 'Grupo no válido.')
      config.updateGroup(id, await protectedBody(), user.id)
      return json(response, 200, { ok: true })
    }
    const assignment = path.match(/^\/api\/local\/students\/(CAI-\d+)\/assignment$/)
    const studentRecord=path.match(/^\/api\/local\/students\/(CAI-\d+)\/record$/)
    if(studentRecord&&method==='GET')return json(response,200,{record:records.get(studentRecord[1]!)})
    if(studentRecord&&method==='PATCH'){
      limit(`student-record:${user.id}`,30,15*60_000)
      const key=request.headers['idempotency-key']
      if(typeof key!=='string')throw new HttpError(400,'Falta el identificador de la corrección.')
      await records.correct(request,studentRecord[1]!,await protectedBody(),key)
      return json(response,200,{ok:true})
    }
    if (assignment && method === 'PATCH') {
      const data = await protectedBody()
      if (Object.keys(data).some(key => !['revision', 'program', 'group', 'confirmed'].includes(key))) throw new HttpError(400, 'La asignación contiene datos no admitidos.')
      access.assignStudent(assignment[1]!, revisionOf(data.revision), data.program, data.group, data.confirmed, user.id)
      return json(response, 200, { ok: true })
    }
    if (path === '/api/local/requests' && method === 'GET') return json(response, 200, { requests: access.requests() })
    if (path === '/api/local/students' && method === 'GET') return json(response, 200, { students: access.students() })
    if (path === '/api/local/notices' && method === 'GET') return json(response, 200, { notices: mail.list() })
    const notice = path.match(/^\/api\/local\/notices\/(\d+)\/(preview|acknowledge)$/)
    if (notice && method === 'POST') {
      const id = Number(notice[1])
      if (!Number.isSafeInteger(id) || id < 1) throw new HttpError(400, 'Aviso no válido.')
      if (notice[2] === 'preview') return json(response, 200, mail.previewRecovery(id, user.id))
      mail.acknowledge(id)
      return json(response, 200, { ok: true })
    }
    if(path==='/api/local/institutional-posts'&&method==='GET')return json(response,200,{posts:posts.institutional()})
    if(path==='/api/local/institutional-posts'&&method==='POST'){
      limit(`institutional:${user.id}`,30,60*60_000)
      const key=request.headers['idempotency-key']
      if(typeof key!=='string'||!/^[a-f0-9-]{36}$/i.test(key))throw new HttpError(400,'Falta el identificador del envío.')
      const data=await protectedBody();return json(response,201,{id:institutional.create(data,key,user.id)})
    }
    const officialPost=path.match(/^\/api\/local\/institutional-posts\/PUB-(\d{4,})$/)
    if(officialPost&&method==='PATCH'){institutional.update(Number(officialPost[1]),await protectedBody(),user.id);return json(response,200,{ok:true})}
    if (path === '/api/local/posts' && method === 'GET') return json(response, 200, { posts: posts.review() })
    if(path==='/api/local/comment-counts'&&method==='GET')return json(response,200,{counts:comments.counts()})
    if(path==='/api/local/comments'&&method==='GET')return json(response,200,{...comments.reviews(commentStatus(url.searchParams.get('status')??'pendiente'),commentCursor(url.searchParams.get('before'))),counts:comments.counts()})
    const comment=path.match(/^\/api\/local\/comments\/(CMT-\d+)(?:\/(approve|reject|undo|withdraw))?$/)
    if(comment&&!comment[2]&&method==='GET')return json(response,200,comments.detail(comment[1]!))
    if(comment&&comment[2]&&method==='POST'){
      limit(`comment-review:${user.id}`,60,15*60_000);comments.decide(comment[1]!,comment[2] as 'approve'|'reject'|'undo'|'withdraw',await protectedBody(),user.id);return json(response,200,{ok:true})
    }
    const discussion=path.match(/^\/api\/local\/posts\/(PUB-\d+)\/comments$/)
    if(discussion&&method==='PATCH'){comments.configure(discussion[1]!,await protectedBody(),user.id);return json(response,200,{ok:true})}
    const review = path.match(/^\/api\/local\/posts\/(PUB-\d+)\/(approve|reject|undo|withdraw)$/)
    if (review && method === 'POST') {
      const data = await protectedBody()
      if (Object.keys(data).some((key) => !['revision', 'reason', 'confirmed'].includes(key))) throw new HttpError(400, 'La revisión contiene datos no admitidos.')
      posts.decide(review[1]!, revisionOf(data.revision), review[2] as PublicationDecision, user.id, data.reason, data.confirmed)
      return json(response, 200, { ok: true })
    }
    const emailStatus = path.match(/^\/api\/local\/students\/(CAI-\d+)\/access-email$/)
    if (emailStatus && method === 'GET') return json(response, 200, emails.forStudent(emailStatus[1]!))
    if (emailStatus && method === 'POST') {
      limit(`account-email:${user.id}`, 30, 60 * 60_000)
      const data = await protectedBody()
      if (Object.keys(data).some(key => key !== 'revision')) throw new HttpError(400, 'Revisa el envío de acceso.')
      const result = emails.resend(emailStatus[1]!, revisionOf(data.revision), user.id)
      dispatchEmail()
      return json(response, 202, result)
    }
    const invite = path.match(/^\/api\/local\/students\/(CAI-\d+)\/invitation$/)
    if (invite && method === 'POST') {
      const data = await protectedBody()
      return json(response, 200, studentAuth.invite(invite[1]!, revisionOf(data.revision), user.id))
    }
    const decision = path.match(/^\/api\/local\/requests\/(CAI-\d+)\/(approve|reject|undo|consent)$/)
    if (decision && method === 'POST') {
      const data = await protectedBody()
      access.decide(decision[1]!, revisionOf(data.revision), decision[2] as RequestDecision, user.id, typeof data.reference === 'string' ? data.reference : undefined)
      if (decision[2] === 'approve') dispatchEmail()
      return json(response, 200, { ok: true, emailQueued: decision[2] === 'approve' && emails.enabled })
    }
    const student = path.match(/^\/api\/local\/students\/(CAI-\d+)$/)
    if (student && method === 'PATCH') {
      const data = await protectedBody()
      if (data.status !== 'activo' && data.status !== 'suspendido') throw new HttpError(400, 'Estado del alumno no válido.')
      access.setStudentStatus(student[1]!, revisionOf(data.revision), data.status, user.id)
      return json(response, 200, { ok: true })
    }
    throw new HttpError(404, 'No se encontró esta operación.')
  }

  const server = createServer((request, response) => {
    const requestId = randomUUID(), started = performance.now(), fields = requestLogFields(request)
    response.setHeader('X-Request-Id', requestId)
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Referrer-Policy', 'no-referrer')
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('X-Frame-Options', 'DENY')
    response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'")
    if (policy.mode === 'production') response.setHeader('Strict-Transport-Security', 'max-age=31536000')
    response.once('finish', () => writeOperationalLog(log, { event: 'request', requestId, ...fields, status: response.statusCode, durationMs: Math.round(performance.now() - started) }))
    void handle(request, response).catch((error: unknown) => {
      const known = error instanceof HttpError
      if (!known) {
        if (policy.mode === 'local') console.error('Error interno en la API local. Revisa la base de datos y el estado del servicio.')
        writeOperationalLog(log, { event: 'internal_error', requestId, ...fields, status: 500, durationMs: Math.round(performance.now() - started) })
      }
      if (response.destroyed) return
      if (!response.headersSent) json(response, known ? error.status : 500, { error: known ? error.message : 'No se pudo completar la operación. Inténtalo de nuevo.' })
      else if (!response.writableEnded) response.end()
    })
  })
  server.requestTimeout = 15_000
  server.headersTimeout = 10_000
  server.on('listening',()=>{dispatchEmail();void recovery.deliverPending().catch(()=>console.error('No se pudo procesar la entrega administrativa.'))})
  let closed = false
  const dispose = () => { if (!closed) { closed = true; emails.stop(); recovery.stop(); db.close() } }
  server.on('close', dispose)
  server.on('error', () => { if (!server.listening) dispose() })
  return { server, db }
}
