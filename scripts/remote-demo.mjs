/** Enlace temporal autorizado. No publica Vite, fuentes o la instalación habitual. */
import { backup, DatabaseSync } from 'node:sqlite'
import { readFile, writeFile, mkdir, mkdtemp, cp, realpath } from 'node:fs/promises'
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
const metadata = JSON.parse(await readFile(join(root, '.local/tests/community-showcase-latest.json'), 'utf8'))
const sourceDirectory = await realpath(metadata.directory)
if (metadata.demonstration !== true || !isWithin(await realpath(join(root, '.local/tests')), sourceDirectory) ||
    !basename(sourceDirectory).startsWith('community-showcase-')) throw Error('Solo se puede compartir la fixture ficticia de presentación.')
const fixture = JSON.parse(await readFile(join(sourceDirectory, 'presentation.json'), 'utf8'))
if (fixture.demonstration !== true || fixture.student !== 'bob@example.test') throw Error('La base no es una presentación autorizada.')

// Datos hermanos del código, dentro de la carpeta de trabajo autorizada y fuera de Git.
const privateRoot = join(dirname(root), '.cai-demo-privada')
await mkdir(privateRoot, { recursive: true })
const directory = await mkdtemp(join(privateRoot, 'presentacion-'))
const databasePath = join(directory, 'cai.sqlite')
const source = new DatabaseSync(join(sourceDirectory, 'fixture.sqlite'), { readOnly: true })
try {
  const emails = [...source.prepare('SELECT email FROM requests').all(), ...source.prepare('SELECT email FROM admin_users').all()]
  if (emails.some(row => typeof row.email !== 'string' || !row.email.endsWith('@example.test')) ||
      source.prepare('SELECT count(*) AS n FROM google_identities').get().n !== 0) throw Error('Se rechazan cuentas ajenas a la fixture ficticia.')
  await backup(source, databasePath)
} finally { source.close() }

const username = 'cai', gatePassword = randomBytes(18).toString('base64url')
const studentPassword = 'CAI-' + randomBytes(18).toString('base64url')
const adminPassword = 'CAI-' + randomBytes(18).toString('base64url')
const db = new DatabaseSync(databasePath)
try {
  db.exec('PRAGMA foreign_keys=ON; BEGIN IMMEDIATE;')
  for (const table of ['sessions', 'student_sessions', 'student_invitations', 'password_resets', 'admin_password_resets', 'admin_invitations', 'google_sessions', 'google_challenges']) db.exec(`DELETE FROM ${table}`)
  db.prepare('UPDATE student_accounts SET password_hash=?').run(await hashPassword(studentPassword))
  db.prepare('UPDATE admin_users SET password_hash=?').run(await hashPassword(adminPassword))
  db.exec('COMMIT;')
} finally { db.close() }
await cp(join(root, 'dist'), join(directory, 'web'), { recursive: true, errorOnExist: true, force: false })
const binary = join(root, '.local/tools/cloudflared.exe')
const configPath = join(directory, 'cloudflared.yml')
await writeFile(configPath, '{}\n', { flag: 'wx' })
const gateway = createPreviewGateway()
gateway.server.listen(0, '127.0.0.1'); await once(gateway.server, 'listening')
const gatewayPort = gateway.server.address().port
const reservation = createServer()
reservation.listen(0, '127.0.0.1'); await once(reservation, 'listening')
const apiPort = reservation.address().port
await new Promise(resolve => reservation.close(resolve))
const expiresAt = Date.now() + 24 * 60 * 60_000
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
  gateway.configure({ origin, directory: join(directory, 'web'), apiPort, username, password: gatePassword, expiresAt })
  const access = { origin, expiresAt: new Date(expiresAt).toISOString(), gate: { username, password: gatePassword }, student: { email: 'bob@example.test', password: studentPassword }, admin: { email: 'admin@example.test', password: adminPassword }, directory, gatewayPort, apiPort, pid: process.pid, tunnelPid: tunnel.pid, sourceDirectory }
  await writeFile(join(directory, 'acceso-privado.json'), JSON.stringify(access, null, 2), { flag: 'wx', mode: 0o600 })
  await writeFile(join(root, '.local/tests/remote-demo-latest.json'), JSON.stringify({ origin, directory, expiresAt: access.expiresAt, pid: process.pid, tunnelPid: tunnel.pid }, null, 2))
  console.info(`Demo privada: ${origin}\nAccesos exclusivamente locales: ${join(directory, 'acceso-privado.json')}\nVálida hasta ${access.expiresAt}. Mantener el equipo conectado; Ctrl+C la detiene.`)
  tunnel.once('exit', () => { void stop() })
} catch (error) {
  await writeFile(join(directory, 'tunnel-start.log'), log.join(''))
  await stop()
  throw error
}
