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
import { studentProfiles } from './public-profiles.ts'
import { adminRecovery, adminRecoveryMessage, type AdminRecoveryDelivery } from './admin-recovery.ts'
import { adminTeam } from './admin-team.ts'
import { studentRecords } from './student-records.ts'
import { commentsRepository, commentCursor, commentStatus } from './comments.ts'
import { challengesRepository } from './challenges.ts'
import { galleryLimits } from './contracts.ts'
import { HttpError, record, revisionOf, validateSubmission } from './validation.ts'
import type { PublicationDecision, RequestDecision } from './contracts.ts'

const frontendOrigins = ['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:4180', 'http://localhost:4180']

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

export function createApplication(databasePath: string, googleOptions: GoogleOptions = {}, options: {adminRecoveryDelivery?: AdminRecoveryDelivery;challengeClock?:()=>Date} = {}) {
  const db = openDatabase(databasePath)
  const access = accessRepository(db)
  const auth = authRepository(db)
  const studentAuth = studentAccounts(db)
  const google = googleAccounts(db, googleOptions)
  const posts = publications(db)
  const mail = notices(db)
  const config = administration(db)
  const contacts = contactRepository(db)
  const gallery = galleryRepository(db)
  const profiles = studentProfiles(db)
  const recovery = adminRecovery(db, options.adminRecoveryDelivery)
  const team=adminTeam(db)
  const records=studentRecords(db)
  const comments=commentsRepository(db)
  const challenges=challengesRepository(db,options.challengeClock)
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
    const host = request.headers.host ?? ''
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new HttpError(403, 'Este servicio solo está disponible en el equipo local.')
    if (!['127.0.0.1', '::ffff:127.0.0.1', '::1'].includes(request.socket.remoteAddress ?? '')) throw new HttpError(403, 'Acceso local requerido.')
    const url = new URL(request.url ?? '/', `http://${host}`)
    const path = url.pathname
    const method = request.method
    if (!['GET', 'POST', 'PATCH'].includes(method ?? '')) throw new HttpError(405, 'Método no permitido.')
    if (method !== 'GET') {
      const origin = request.headers.origin
      if (!origin || ![...frontendOrigins, `http://${host}`].includes(origin)) throw new HttpError(403, 'El origen de la solicitud no está permitido.')
      if (request.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'Solicitud de otro sitio no permitida.')
    }
    limit(`all:${request.socket.remoteAddress}`, 600, 60_000)
    if (path === '/api/local/health' && method === 'GET') return json(response, 200, { status: 'ok', mode: 'local-test' })
    if (path === '/api/local/catalog' && method === 'GET') return json(response, 200, config.publicCatalog())
    if (path === '/api/local/admin-recovery/request' && method === 'POST') {
      limit(`admin-recovery:${request.socket.remoteAddress}`,10,15*60_000)
      const data=await body(request)
      if (Object.keys(data).some(key=>key!=='email') || typeof data.email!=='string' || data.email.length>160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) throw new HttpError(400,'Escribe un correo válido.')
      recovery.request(data.email.trim())
      json(response,202,{message:adminRecoveryMessage})
      // La entrega ocurre fuera de la respuesta pública; ninguna URL privada vuelve al solicitante.
      setImmediate(()=>{void recovery.deliverPending().catch(()=>console.error('No se pudo procesar la entrega administrativa.'))})
      return
    }
    if (path === '/api/local/admin-recovery/reset' && method === 'POST') {
      limit(`admin-reset:${request.socket.remoteAddress}`,20,15*60_000)
      const data=await body(request)
      if (Object.keys(data).some(key=>!['token','password','confirm'].includes(key)) || data.confirm!==data.password) throw new HttpError(400,'Revisa la confirmación de contraseña.')
      const currentUser=auth.session(request)
      const recoveredId=await recovery.changePassword(data.token,data.password)
      if (!currentUser || currentUser.id===recoveredId) response.setHeader('Set-Cookie',auth.end(request))
      return json(response,200,{ok:true})
    }
    if(path==='/api/local/admin-activation'&&method==='POST'){
      limit(`admin-activation:${request.socket.remoteAddress}`,20,15*60_000)
      const data=await body(request)
      if(Object.keys(data).some(key=>!['token','password','confirm'].includes(key))||data.confirm!==data.password)throw new HttpError(400,'Revisa la confirmación de contraseña.')
      const current=auth.session(request),id=await team.activate(data.token,data.password)
      if(!current||current.id===id)response.setHeader('Set-Cookie',auth.end(request))
      return json(response,200,{ok:true})
    }
    if (path === '/api/local/contact' && method === 'POST') {
      limit(`contact:${request.socket.remoteAddress}`, 20, 60 * 60_000)
      const key = request.headers['idempotency-key']
      if (typeof key !== 'string' || !/^[a-f0-9-]{36}$/i.test(key)) throw new HttpError(400, 'Falta el identificador del envío.')
      return json(response, 201, contacts.submit(validateContact(await body(request)), key))
    }
    if (path === '/api/local/recovery/request' && method === 'POST') {
      limit(`recovery:${request.socket.remoteAddress}`, 10, 15 * 60_000)
      const data = await body(request)
      if (Object.keys(data).some((key) => key !== 'email') || typeof data.email !== 'string' || data.email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) throw new HttpError(400, 'Escribe un correo válido.')
      mail.requestRecovery(data.email.trim())
      return json(response, 202, { message: 'Si existe una cuenta con contraseña aprobada y activa, se preparará su recuperación. En estas pruebas locales no se envían correos; consulta con coordinación. Si entras con Google, recupera tu cuenta desde Google.' })
    }
    if (path === '/api/local/recovery/reset' && method === 'POST') {
      limit(`reset:${request.socket.remoteAddress}`, 20, 15 * 60_000)
      const data = await body(request)
      if (Object.keys(data).some((key) => !['token','password','confirm'].includes(key)) || data.confirm !== data.password) throw new HttpError(400, 'Revisa la confirmación de contraseña.')
      await mail.changePassword(data.token, data.password)
      response.setHeader('Set-Cookie', [...google.end(request), studentAuth.end(request)])
      return json(response, 200, { ok: true })
    }
    if (path === '/api/local/google/config' && method === 'GET') return json(response, 200, google.config())
    if (path === '/api/local/google/challenge' && method === 'POST') {
      limit(`google-challenge:${request.socket.remoteAddress}`, 30, 15 * 60_000)
      const challenge = google.challenge(request)
      response.setHeader('Set-Cookie', challenge.cookie)
      return json(response, 200, { nonce: challenge.nonce, clientId: challenge.clientId })
    }
    if (path === '/api/local/google/signin' && method === 'POST') {
      limit(`google-signin:${request.socket.remoteAddress}`, 30, 15 * 60_000)
      const data = await body(request)
      if (Object.keys(data).some((key) => key !== 'credential')) throw new HttpError(400, 'El acceso contiene datos no admitidos.')
      const result = await google.signIn(request, data.credential)
      const user = studentAuth.forGoogle(result.subject)
      response.setHeader('Set-Cookie', [...result.cookies, studentAuth.end(request), ...(user ? [studentAuth.start(user)] : [])])
      return json(response, 200, { destination: user ? '/community' : '/solicitud-google' })
    }
    if (path === '/api/local/google/session' && method === 'GET') return json(response, 200, google.state(request))
    if (path === '/api/local/google/logout' && method === 'POST') {
      response.setHeader('Set-Cookie', [...google.end(request), studentAuth.end(request)])
      return json(response, 200, { ok: true })
    }
    if (path === '/api/local/google/profile' && method === 'POST') {
      limit(`google-profile:${request.socket.remoteAddress}`, 20, 60 * 60_000)
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
      limit(`login:${request.socket.remoteAddress}`, 10, 15 * 60_000)
      const data = await body(request)
      if (typeof data.email !== 'string' || data.email.length > 160 || typeof data.password !== 'string' || data.password.length < 1 || data.password.length > 128) throw new HttpError(400, 'Escribe el correo y la contraseña.')
      const user = await auth.login(data.email.trim(), data.password)
      if (!user) throw new HttpError(401, 'El correo o la contraseña no son correctos.')
      limits.delete(`login:${request.socket.remoteAddress}`)
      response.setHeader('Set-Cookie', [auth.end(request), auth.start(user)])
      return json(response, 200, { user })
    }
    if (path === '/api/local/auth/logout' && method === 'POST') {
      response.setHeader('Set-Cookie', auth.end(request))
      return json(response, 200, { ok: true })
    }
    if (path === '/api/local/activation' && method === 'POST') {
      limit(`activation:${request.socket.remoteAddress}`, 20, 15 * 60_000)
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
      limit(`student-login:${request.socket.remoteAddress}`, 10, 15 * 60_000)
      const data = await body(request)
      if (typeof data.email !== 'string' || data.email.length > 160 || typeof data.password !== 'string' || data.password.length < 1 || data.password.length > 128) throw new HttpError(400, 'Escribe el correo y la contraseña.')
      const user = await studentAuth.login(data.email.trim(), data.password)
      if (!user) throw new HttpError(401, 'Los datos no son correctos o el acceso aún no está disponible. Consulta con CAI.')
      limits.delete(`student-login:${request.socket.remoteAddress}`)
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
    if (path.startsWith('/api/local/student/')) {
      const user = studentAuth.session(request)
      if (!user) throw new HttpError(401, 'Tu sesión terminó o el acceso no está disponible. Vuelve a entrar o consulta con CAI.')
      const protectedBody = async () => {
        const data = await body(request)
        if (studentAuth.session(request)?.id !== user.id) throw new HttpError(401, 'Tu sesión terminó. Vuelve a entrar antes de guardar cambios.')
        return data
      }
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
      const seen = path.match(/^\/api\/local\/student\/notices\/(\d+)\/seen$/)
      if (seen && method === 'POST') {
        const id = Number(seen[1]), data = await protectedBody()
        if (!Number.isSafeInteger(id) || id < 1 || Object.keys(data).length) throw new HttpError(400, 'Aviso no válido.')
        mail.studentSeen(user, id)
        return json(response, 200, { ok: true })
      }
      if (path === '/api/local/student/group' && method === 'GET') return json(response, 200, { members: studentAuth.group(user) })
      if (path === '/api/local/student/posts' && method === 'GET') return json(response, 200, { posts: posts.feed(user).map(post=>({...post,commentCount:comments.count(post.id)})), mine: posts.mine(user) })
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
      limit(`submission:${request.socket.remoteAddress}`, 20, 60 * 60_000)
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
    const review = path.match(/^\/api\/local\/posts\/(PUB-\d+)\/(approve|reject|undo)$/)
    if (review && method === 'POST') {
      const data = await protectedBody()
      if (Object.keys(data).some((key) => !['revision', 'reason', 'confirmed'].includes(key))) throw new HttpError(400, 'La revisión contiene datos no admitidos.')
      posts.decide(review[1]!, revisionOf(data.revision), review[2] as PublicationDecision, user.id, data.reason, data.confirmed)
      return json(response, 200, { ok: true })
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
      return json(response, 200, { ok: true })
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
    void handle(request, response).catch((error: unknown) => {
      const known = error instanceof HttpError
      if (!known) console.error('Error interno en la API local. Revisa la base de datos y el estado del servicio.')
      if (!response.headersSent) json(response, known ? error.status : 500, { error: known ? error.message : 'No se pudo completar la operación. Inténtalo de nuevo.' })
      else response.end()
    })
  })
  server.requestTimeout = 15_000
  server.headersTimeout = 10_000
  server.on('listening',()=>{void recovery.deliverPending().catch(()=>console.error('No se pudo procesar la entrega administrativa.'))})
  server.on('close', () => { recovery.stop(); db.close() })
  return { server, db }
}
