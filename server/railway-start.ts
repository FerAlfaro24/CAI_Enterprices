import { mkdir, writeFile, lstat, chmod, chown, rename } from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { join, resolve } from 'node:path'
import { readRuntimeConfig, projectDirectory } from './runtime-config.ts'
import { validateGmailSettings } from './email-delivery.ts'
import { prepareProductionDatabase } from './production-storage.ts'
import { startRuntime } from './runtime-server.ts'
import { createRailwayProxy } from './railway-proxy.ts'

async function main() {
  // No usar disco efímero como alternativa si falta el volumen. Una sola réplica.
  const directory = process.env.CAI_DATA_DIR
  if (!process.env.RAILWAY_PROJECT_ID || !process.env.RAILWAY_SERVICE_ID || !directory || directory !== process.env.RAILWAY_VOLUME_MOUNT_PATH || resolve(directory) !== '/data') throw Error('Se requiere el volumen privado de Railway en /data.')
  const portText = process.env.PORT ?? '', port = Number(portText)
  if (!/^\d+$/.test(portText) || port < 1024 || port > 65535 || port === 3100) throw Error('Puerto público no válido.')
  await mkdir(directory, { recursive: true, mode: 0o700 })
  await chmod(directory, 0o700)
  // El volumen llega como root; el servicio y todos sus archivos se crean sin privilegios.
  if (process.getuid?.() === 0) { await chown(directory, 1000, 1000); process.setgroups!([]); process.setgid!(1000); process.setuid!(1000) }
  const config = readRuntimeConfig()
  if (config.policy.mode !== 'production') throw Error('Railway requiere la configuración de producción.')
  if (process.env.CAI_GMAIL_CONFIG_JSON) {
    const settings = validateGmailSettings(JSON.parse(process.env.CAI_GMAIL_CONFIG_JSON), config.policy)
    const path = join(directory, 'railway-gmail.json')
    // Reemplazo atómico; nunca seguir un enlace simbólico ni imprimir el contenido.
    const temporary = join(directory, `.mail-${randomBytes(12).toString('hex')}.json`)
    await writeFile(temporary, JSON.stringify(settings), { flag: 'wx', mode: 0o600 })
    await rename(temporary, path)
    config.mailConfigPath = path
  }
  try { await lstat(config.databasePath) } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') throw error
    if (process.env.CAI_INITIALIZE_EMPTY !== 'true') throw Error('Autoriza explícitamente preparar una base nueva.', { cause: error })
    const password = randomBytes(36).toString('base64url')
    // El acceso inicial queda privado; no llega a logs, imagen Docker o frontend.
    const passwordPath = join(directory, 'initial-admin-password.txt')
    await writeFile(passwordPath, password, { flag: 'wx', mode: 0o600 })
    await prepareProductionDatabase(config, process.env.CAI_BOOTSTRAP_EMAIL ?? '', password)
  }
  const app = await startRuntime(config, { log: event => console.info(JSON.stringify(event)) })
  const proxy = createRailwayProxy({ publicOrigin: config.policy.publicOrigin, apiPort: config.port, publicDirectory: join(projectDirectory, 'dist') })
  try { await new Promise<void>((done, fail) => { proxy.once('error', fail); proxy.listen(port, '0.0.0.0', () => { proxy.off('error', fail); done() }) }) }
  catch (error) { await app.stop(); throw error }
  console.info(JSON.stringify({ event: 'railway_ready', schema: 23 }))
  let stopping = false
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => {
    if (stopping) return
    stopping = true
    const timeout = setTimeout(() => proxy.closeAllConnections(), 10_000)
    timeout.unref()
    proxy.close(() => { clearTimeout(timeout); void app.stop().catch(() => { process.exitCode = 1 }) })
  })
}

main().catch(() => {
  console.error('No se inició CAI en Railway. Revisa volumen, origen, base y configuración privada. No se imprimieron accesos ni credenciales.')
  process.exitCode = 1
})
