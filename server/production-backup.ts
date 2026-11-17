import { mkdirSync, realpathSync, lstatSync } from 'node:fs'
import { join, basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { backupLocalDatabase } from './backup.ts'
import { isWithin, readRuntimeConfig, type RuntimeConfig } from './runtime-config.ts'

/** Reutiliza la copia consistente existente; no requiere que haya un administrador disponible. */
export async function createProductionBackup(config: RuntimeConfig) {
  if (config.policy.mode !== 'production') throw Error('El respaldo de producción requiere su configuración explícita.')
  const data = realpathSync(config.dataDirectory)
  if (!lstatSync(config.databasePath).isFile() || lstatSync(config.databasePath).isSymbolicLink() || !isWithin(data, realpathSync(config.databasePath))) throw Error('Origen privado de respaldo no válido.')
  const directory = join(data, 'backups')
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  if (lstatSync(directory).isSymbolicLink() || !isWithin(data, realpathSync(directory))) throw Error('La carpeta de respaldos debe permanecer dentro del directorio privado.')
  return backupLocalDatabase(config.databasePath, directory)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const path = await createProductionBackup(readRuntimeConfig())
    console.info(JSON.stringify({ event: 'backup_created', file: basename(path) }))
  } catch {
    console.error('No se creó el respaldo de producción. Revisa configuración, origen y carpeta privada; no se sustituyeron datos.')
    process.exitCode = 1
  }
}
