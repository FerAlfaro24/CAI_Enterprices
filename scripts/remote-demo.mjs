/** Enlace temporal autorizado. No publica Vite, fuentes o la instalación habitual. */
import { backup, DatabaseSync } from 'node:sqlite'
import { readFile, writeFile, mkdir, mkdtemp, cp, realpath, rename } from 'node:fs/promises'
import { join, resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:net'
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { createPreviewGateway } from '../server/preview-gateway.ts'
import { readRuntimeConfig, isWithin } from '../server/runtime-config.ts'
import { startRuntime } from '../server/runtime-server.ts'
import { hashPassword } from '../server/auth.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
if (process.cwd() !== root || process.env.NODE_ENV === 'production') throw Error('Ejecuta la demo desde la raíz del proyecto, fuera de producción.')
const flags=new Set(process.argv.slice(2))
if([...flags].some(flag=>!['--resume','--open-entry'].includes(flag)))throw Error('Opciones de presentación inválidas.')
const resuming=flags.has('--resume'),openEntry=flags.has('--open-entry')
const privateRoot = join(dirname(root), '.cai-demo-privada')
await mkdir(privateRoot, { recursive: true })
let directory,databasePath,sourceDirectory,access,expiresAt,entryMode
if(resuming){
  const metadata=JSON.parse(await readFile(join(root,'.local/tests/remote-demo-latest.json'),'utf8'))
  directory=await realpath(metadata.directory)
  if(!isWithin(await realpath(privateRoot),directory)||!basename(directory).startsWith('presentacion-'))throw Error('Solo se puede reanudar la copia temporal identificada.')
  access=JSON.parse(await readFile(join(directory,'acceso-privado.json'),'utf8'))
  if(access.directory!==directory||access.origin!==metadata.origin||access.expiresAt!==metadata.expiresAt)throw Error('Los metadatos de la copia no coinciden.')
  expiresAt=Date.parse(access.expiresAt)
  if(!Number.isFinite(expiresAt)||expiresAt<=Date.now()||expiresAt>Date.now()+24*60*60_000)throw Error('La ventana autorizada venció o no es válida. No se amplió.')
  if(!isWithin(directory,await realpath(join(directory,'web'))))throw Error('Frontend fuera de la copia autorizada.')
  databasePath=join(directory,'cai.sqlite')
  if(!isWithin(directory,await realpath(databasePath)))throw Error('Base fuera de la copia autorizada.')
  sourceDirectory=access.sourceDirectory
  entryMode=openEntry?'open':access.entryMode??'password'
}else{
  const metadata = JSON.parse(await readFile(join(root, '.local/tests/community-showcase-latest.json'), 'utf8'))
  sourceDirectory = await realpath(metadata.directory)
  if (metadata.demonstration !== true || !isWithin(await realpath(join(root, '.local/tests')), sourceDirectory) ||
      !basename(sourceDirectory).startsWith('community-showcase-')) throw Error('Solo se puede compartir la fixture ficticia de presentación.')
  const fixture = JSON.parse(await readFile(join(sourceDirectory, 'presentation.json'), 'utf8'))
  if (fixture.demonstration !== true || fixture.student !== 'bob@example.test') throw Error('La base no es una presentación autorizada.')
  directory = await mkdtemp(join(privateRoot, 'presentacion-'))
  databasePath = join(directory, 'cai.sqlite')
  const source = new DatabaseSync(join(sourceDirectory, 'fixture.sqlite'), { readOnly: true })
  try {
    const emails = [...source.prepare('SELECT email FROM requests').all(), ...source.prepare('SELECT email FROM admin_users').all()]
    if (emails.some(row => typeof row.email !== 'string' || !row.email.endsWith('@example.test')) ||
        source.prepare('SELECT count(*) AS n FROM google_identities').get().n !== 0) throw Error('Se rechazan cuentas ajenas a la fixture ficticia.')
    await backup(source, databasePath)
  } finally { source.close() }
  const gatePassword=randomBytes(18).toString('base64url'),studentPassword='CAI-'+randomBytes(18).toString('base64url'),adminPassword='CAI-'+randomBytes(18).toString('base64url')
  const db = new DatabaseSync(databasePath)
  try {
    db.exec('PRAGMA foreign_keys=ON; BEGIN IMMEDIATE;')
    for (const table of ['sessions', 'student_sessions', 'student_invitations', 'password_resets', 'admin_password_resets', 'admin_invitations', 'google_sessions', 'google_challenges']) db.exec(`DELETE FROM ${table}`)
    db.prepare('UPDATE student_accounts SET password_hash=?').run(await hashPassword(studentPassword))
    db.prepare('UPDATE admin_users SET password_hash=?').run(await hashPassword(adminPassword))
    db.exec('COMMIT;')
  } finally { db.close() }
  await cp(join(root, 'dist'), join(directory, 'web'), { recursive: true, errorOnExist: true, force: false })
  expiresAt=Date.now()+24*60*60_000
  entryMode=openEntry?'open':'password'
  access={gate:{username:'cai',password:gatePassword},student:{email:'bob@example.test',password:studentPassword},admin:{email:'admin@example.test',password:adminPassword}}
}
const {username,password:gatePassword}=access.gate
const binary = join(root, '.local/tools/cloudflared.exe')
const configPath = join(directory, 'cloudflared.yml')
if(resuming){const config=JSON.parse(await readFile(configPath,'utf8'));if(!config||Object.keys(config).length)throw Error('No se admite configuración ajena a la copia temporal.')}else await writeFile(configPath, '{}\n', { flag: 'wx' })
const gateway = createPreviewGateway()
gateway.server.listen(0, '127.0.0.1'); await once(gateway.server, 'listening')
const gatewayPort = gateway.server.address().port
const reservation = createServer()
reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening')
const apiPort = reservation.address().port
await new Promise(resolve => reservation.close(resolve))
let runtime, stopping = false
const tunnel = spawn(binary, ['tunnel', '--config', configPath, '--no-autoupdate', '--protocol', 'http2', '--url', `http://127.0.0.1:${gatewayPort}`, '--metrics', '127.0.0.1:0'], {
  cwd: directory, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  // No adoptar tokens, certificados, cuenta o configuración personal de Cloudflare.
  env: Object.fromEntries(['SystemRoot', 'WINDIR', 'PATH', 'TEMP', 'TMP'].filter(key => process.env[key]).map(key => [key, process.env[key]])),
})
const stop = async () => {
  if (stopping) return
  stopping = true; clearTimeout(expiry)
  tunnel.kill()
  gateway.server.closeAllConnections()
  await new Promise(resolve => gateway.server.close(resolve))
  if (runtime) { await runtime.stop(); runtime.db.close() }
}
const expiry = setTimeout(() => { void stop() }, expiresAt - Date.now())
process.on('SIGINT', () => { void stop() })
process.on('SIGTERM', () => { void stop() })
const log = []
try {
  const origin = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error('No se pudo crear el enlace temporal en 60 segundos.')), 60_000)
    const inspect = chunk => {
      const line = chunk.toString('utf8'); log.push(line)
      const url = line.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/)
      if (url) { clearTimeout(timeout); resolve(url[0]) }
    }
    tunnel.stdout.on('data', inspect); tunnel.stderr.on('data', inspect)
    tunnel.once('error', error => { clearTimeout(timeout); reject(error) })
    tunnel.once('exit', code => { clearTimeout(timeout); reject(Error(`El túnel terminó (${code}).`)) })
  })
  const config = readRuntimeConfig({ NODE_ENV: 'production', CAI_PUBLIC_ORIGIN: origin, CAI_TRUST_PROXY: 'loopback', CAI_DATA_DIR: directory, CAI_API_PORT: String(apiPort) }, root)
  runtime = await startRuntime(config, { log: () => {} })
  gateway.configure({ origin, directory: join(directory, 'web'), apiPort, username, password: gatePassword, expiresAt, entryMode })
  const previousOrigin=access.origin
  access={...access,origin,expiresAt:new Date(expiresAt).toISOString(),entryMode,directory,gatewayPort,apiPort,pid:process.pid,tunnelPid:tunnel.pid,sourceDirectory}
  if(resuming)await writeFile(join(directory,`acceso-anterior-${Date.now()}.json`),await readFile(join(directory,'acceso-privado.json')),{flag:'wx',mode:0o600})
  const staging=join(directory,`acceso-ready-${Date.now()}.json`)
  await writeFile(staging,JSON.stringify(access,null,2),{flag:'wx',mode:0o600})
  await rename(staging,join(directory,'acceso-privado.json'))
  await writeFile(join(root, '.local/tests/remote-demo-latest.json'), JSON.stringify({ origin, directory, expiresAt: access.expiresAt,entryMode,pid: process.pid, tunnelPid: tunnel.pid }, null, 2))
  if(previousOrigin&&previousOrigin!==origin)console.info('La copia y sus accesos se conservaron. Utiliza el enlace nuevo; el vencimiento no cambió.')
  console.info(`Prueba temporal (${entryMode==='open'?'sin contraseña adicional':'entrada protegida'}): ${origin}\nAccesos exclusivamente locales: ${join(directory, 'acceso-privado.json')}\nVálida hasta ${access.expiresAt}. Mantener el equipo conectado; Ctrl+C la detiene.`)
  tunnel.once('exit', () => { void stop() })
} catch (error) {
  await writeFile(join(directory, 'tunnel-start.log'), log.join(''))
  await stop()
  throw error
}
