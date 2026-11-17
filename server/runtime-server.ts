import { createApplication } from './app.ts'
import { readGoogleClientId } from './google-config.ts'
import { checkProductionDatabase } from './production-storage.ts'
import { type RuntimeConfig } from './runtime-config.ts'
import { type OperationalLog } from './operational-log.ts'
import { join } from 'node:path'

export async function startRuntime(config: RuntimeConfig, options: { log?: OperationalLog; shutdownMilliseconds?: number } = {}) {
  if (config.policy.mode === 'production') checkProductionDatabase(config)
  const clientId = config.policy.mode === 'production' ? config.googleClientId : readGoogleClientId(join(config.dataDirectory, 'google.json'))
  const app = createApplication(config.databasePath, { clientId }, { runtime: config.policy, log: options.log })
  await new Promise<void>((resolve, reject) => {
    app.server.once('error', reject)
    app.server.listen(config.port, config.host, () => { app.server.off('error', reject); resolve() })
  })
  let stopping: Promise<void> | undefined
  const stop = () => {
    stopping ??= new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => app.server.closeAllConnections(), options.shutdownMilliseconds ?? 15_000)
      timeout.unref()
      app.server.close(error => { clearTimeout(timeout); if (error) reject(error); else resolve() })
    })
    return stopping
  }
  return { ...app, stop }
}
