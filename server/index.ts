import { resolve } from 'node:path'
import { createApplication } from './app.ts'
import { readGoogleClientId } from './google-config.ts'

if (process.env.NODE_ENV === 'production') throw new Error('Esta primera API está limitada a pruebas locales; falta preparar el despliegue de producción.')
const port = Number(process.env.CAI_API_PORT ?? 3100)
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error('CAI_API_PORT debe ser un puerto entre 1024 y 65535.')
const { server } = createApplication(resolve('.local/cai.sqlite'), { clientId: readGoogleClientId(resolve('.local/google.json')) })
server.listen(port, '127.0.0.1', () => console.log(`API local de CAI: http://127.0.0.1:${port}. Usa solo datos ficticios.`))
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => server.close())
