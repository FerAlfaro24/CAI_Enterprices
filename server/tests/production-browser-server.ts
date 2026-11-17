/** Simulación de transporte productivo; no despliega ni abre la base habitual. */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { readRuntimeConfig } from '../runtime-config.ts'
import { prepareProductionDatabase } from '../production-storage.ts'
import { startRuntime } from '../runtime-server.ts'

if (process.env.NODE_ENV === 'production') throw Error('Esta fixture solo permite simulaciones locales con datos ficticios.')
const root = resolve('.local/tests'); await mkdir(root, { recursive: true })
const directory = await mkdtemp(join(root, 'production-browser-')), code = join(directory, 'code'), data = join(directory, 'data')
await mkdir(code); await mkdir(data)
const publicOrigin = 'https://cai.example.test', port = Number(process.env.CAI_API_PORT ?? 3181)
// Árboles ficticios hermanos para ensayar la separación; la CLI real usa la raíz real del proyecto.
const config = readRuntimeConfig({ NODE_ENV: 'production', CAI_PUBLIC_ORIGIN: publicOrigin, CAI_TRUST_PROXY: 'loopback', CAI_DATA_DIR: data, CAI_API_PORT: String(port) }, code)
const email = 'revision-' + randomUUID().slice(0, 8) + '@example.test', password = 'Frase ficticia de revisión final CAI 2026'
await prepareProductionDatabase(config, email, password)
const app = await startRuntime(config, { log: () => {} })
await writeFile(join(directory, 'browser.json'), JSON.stringify({ email, name: 'Coordinación', port, publicOrigin }, null, 2), { flag: 'wx' })
console.info('Simulación de producción lista. Metadatos ficticios: ' + join(directory, 'browser.json'))
process.on('SIGINT', () => { void app.stop() })
