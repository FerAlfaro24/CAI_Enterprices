import { createServer } from 'node:http'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import { lstat, mkdir, readFile, realpath, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { spawnSync } from 'node:child_process'
import { OAuth2Client } from 'google-auth-library'

// Asistente local y temporal. No envía mensajes ni modifica la cuenta de Google.
// La autorización real se concede en Google, antes de guardar el refresh token.
const usage = 'node scripts/configure-gmail-oauth.mjs --client ARCHIVO --output ARCHIVO --from CORREO@gmail.com --origin https://DOMINIO'
const scopes = ['openid', 'email', 'https://www.googleapis.com/auth/gmail.send']
const root = resolve('.local')
const within = (parent, child) => {
  const path = relative(parent, child)
  return path !== '' && !isAbsolute(path) && path !== '..' && !path.startsWith(`..${sep}`)
}

async function privateDirectory(directory) {
  await mkdir(directory, { recursive: true, mode: 0o700 })
  const stat = await lstat(directory)
  if (!stat.isDirectory() || stat.isSymbolicLink() || !within(await realpath(root), await realpath(directory))) throw Error('private-directory')
  if (process.platform === 'win32') {
    const user = spawnSync('whoami.exe', [], { encoding: 'utf8', windowsHide: true })
    if (user.status !== 0 || !user.stdout.trim()) throw Error('private-owner')
    const acl = spawnSync('icacls.exe', [directory, '/inheritance:r', '/grant:r', `${user.stdout.trim()}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F'], { encoding: 'utf8', windowsHide: true })
    if (acl.status !== 0) throw Error('private-acl')
  }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.length !== 8) throw Error('arguments')
  const options = new Map()
  for (let i = 0; i < args.length; i += 2) {
    if (!['--client', '--output', '--from', '--origin'].includes(args[i]) || options.has(args[i]) || !args[i + 1]) throw Error('arguments')
    options.set(args[i], args[i + 1])
  }
  const clientPath = resolve(options.get('--client')), output = resolve(options.get('--output'))
  const from = options.get('--from').toLowerCase(), origin = options.get('--origin')
  if (!within(root, clientPath) || !within(root, output) || clientPath === output || dirname(output) === root) throw Error('private-path')
  const originUrl = new URL(origin)
  if (originUrl.protocol !== 'https:' || originUrl.origin !== origin || !/^[a-z0-9._%+-]+@gmail\.com$/i.test(from)) throw Error('origin-or-sender')
  const stat = await lstat(clientPath)
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 8192 || !within(await realpath(root), await realpath(clientPath))) throw Error('client-file')
  const clientFile = JSON.parse(await readFile(clientPath, 'utf8'))
  const installed = clientFile.installed
  if (!installed || !/^\d+-[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(installed.client_id) ||
      typeof installed.client_secret !== 'string' || !/^[^\s\0]{10,1024}$/.test(installed.client_secret)) throw Error('desktop-client-required')
  // No sobrescribir una autorización previa ni seguir enlaces simbólicos.
  try { await lstat(output); throw Error('output-exists') }
  catch (error) { if (error.code !== 'ENOENT') throw error }
  await privateDirectory(dirname(output))
  const state = randomBytes(32).toString('base64url')
  const client = new OAuth2Client({ clientId: installed.client_id, clientSecret: installed.client_secret, transporterOptions: { timeout: 20_000 } })
  const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync()
  let settled = false, resolveDone
  const done = new Promise(resolve => { resolveDone = resolve })
  const finish = success => { process.exitCode = success ? 0 : 1; server.close(); resolveDone() }
  const server = createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store')
    response.setHeader('Referrer-Policy', 'no-referrer')
    response.setHeader('Content-Type', 'text/plain; charset=utf-8')
    const url = new URL(request.url ?? '/', redirectUri)
    if (request.method !== 'GET' || request.headers.host !== new URL(redirectUri).host || url.pathname !== '/oauth/callback') {
      response.writeHead(404).end('Ruta no disponible.'); return
    }
    const candidate = url.searchParams.get('state') ?? ''
    if (Buffer.byteLength(candidate) !== Buffer.byteLength(state) || !timingSafeEqual(Buffer.from(candidate), Buffer.from(state))) {
      response.writeHead(400).end('La autorización no corresponde a esta sesión.'); return
    }
    if (settled) { response.writeHead(409).end('Esta sesión ya se utilizó.'); return }
    settled = true
    clearTimeout(timer)
    try {
      const code = url.searchParams.get('code')
      if (url.searchParams.has('error') || !code) throw Error('consent-not-granted')
      const { tokens } = await client.getToken({ code, codeVerifier, redirect_uri: redirectUri })
      if (!tokens.refresh_token || !tokens.id_token || !scopes.every(scope => scope === 'openid' || scope === 'email' || tokens.scope?.split(' ').includes(scope))) throw Error('incomplete-consent')
      const ticket = await client.verifyIdToken({ idToken: tokens.id_token, audience: installed.client_id })
      const identity = ticket.getPayload()
      if (!identity?.email_verified || identity.email?.toLowerCase() !== from) throw Error('different-account')
      const granted = new Set((tokens.scope ?? '').split(' '))
      const allowed = new Set([...scopes, 'https://www.googleapis.com/auth/userinfo.email'])
      if ([...granted].some(scope => !allowed.has(scope))) throw Error('unexpected-scope')
      await writeFile(output, JSON.stringify({ provider: 'gmail-api', clientId: installed.client_id, clientSecret: installed.client_secret,
        refreshToken: tokens.refresh_token, from, publicOrigin: origin }), { flag: 'wx', mode: 0o600 })
      response.end('Autorización guardada de forma privada. Puedes cerrar esta pestaña. No se enviaron correos.')
      console.info('Autorización de envío guardada; identidad y permisos comprobados. No se imprimieron credenciales ni se enviaron correos.')
      finish(true)
    } catch {
      response.writeHead(400).end('No se guardó la autorización. Revisa la cuenta y el permiso de envío; vuelve a iniciar el asistente.')
      console.error('No se completó la autorización. No se mostraron credenciales ni respuestas privadas de Google.')
      finish(false)
    }
  })
  await new Promise((resolveListening, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolveListening) })
  const redirectUri = `http://127.0.0.1:${server.address().port}/oauth/callback`
  const authUrl = client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: scopes, state, redirect_uri: redirectUri,
    code_challenge: codeChallenge, code_challenge_method: 'S256', login_hint: from, include_granted_scopes: false })
  console.info('Abre este enlace para revisar y autorizar únicamente identificación básica y envío desde la cuenta institucional:')
  console.info(authUrl)
  const timer = setTimeout(() => { console.error('La autorización venció sin guardar credenciales.'); finish(false) }, 10 * 60_000)
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { clearTimeout(timer); finish(false) })
  await done
}

main().catch(() => { console.error(`No se inició el asistente privado. Revisa los archivos y argumentos. Uso: ${usage}`); process.exitCode = 1 })
