import { readRuntimeConfig } from './runtime-config.ts'
import { startRuntime } from './runtime-server.ts'

try {
  const config = readRuntimeConfig()
  const app = await startRuntime(config)
  console.info(config.policy.mode === 'local' ? `API local de CAI: http://127.0.0.1:${config.port}. Usa solo datos ficticios.` : JSON.stringify({ event: 'listening', mode: 'production', port: config.port }))
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => {
    void app.stop().catch(() => { console.error('No se completó el cierre del servicio.'); process.exitCode = 1 })
  })
} catch {
  console.error('No se inició la API. Revisa la configuración y el estado de la base según la guía del entorno; no se usarán datos de otro entorno como alternativa.')
  process.exitCode = 1
}
