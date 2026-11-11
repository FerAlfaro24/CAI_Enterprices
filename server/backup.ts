import { backup, DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

/** Snapshot consistente, incluso si el servicio local mantiene la base abierta con WAL. */
export async function backupLocalDatabase(source: string, directory: string) {
  mkdirSync(directory, { recursive: true })
  const target = join(directory, `cai-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}.sqlite`)
  const db = new DatabaseSync(source, { readOnly: true })
  try { await backup(db, target) }
  finally { db.close() }
  return target
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const path = await backupLocalDatabase(resolve('.local/cai.sqlite'), resolve('.local/backups'))
  console.log(`Respaldo local creado: ${path}. Contiene datos privados; no lo subas a Git.`)
}
