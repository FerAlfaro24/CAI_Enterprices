import { DatabaseSync } from 'node:sqlite'
import { closeSync, existsSync, lstatSync, openSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute } from 'node:path'
import { hashPassword } from './auth.ts'
import { openDatabase } from './database.ts'
import { isWithin, type RuntimeConfig } from './runtime-config.ts'

export function checkProductionDatabase(config: RuntimeConfig) {
  if (config.policy.mode !== 'production') throw Error('Esta comprobación requiere configuración de producción.')
  try {
    if (lstatSync(config.databasePath).isSymbolicLink() || !isWithin(realpathSync(config.dataDirectory), realpathSync(config.databasePath))) throw Error('unsafe-path')
    const db = new DatabaseSync(config.databasePath, { readOnly: true })
    try {
      if (db.prepare('PRAGMA quick_check').get()?.quick_check !== 'ok' || db.prepare('PRAGMA foreign_key_check').all().length) throw Error('integrity')
      const history = db.prepare('SELECT version FROM migrations ORDER BY version').all()
      if (history.length !== 17 || history.some((row, index) => row.version !== index + 1)) throw Error('schema')
      if (!db.prepare("SELECT id FROM admin_users WHERE role='admin' AND active=1 AND activated=1 LIMIT 1").get()) throw Error('administrator')
    } finally { db.close() }
  } catch { throw Error('La base de producción debe existir, ser íntegra, tener esquema 17 y un administrador activo. No se migró ni creó ninguna base.') }
}

/** Preparación explícita y solo para una base nueva; jamás sobrescribe una existente. */
export async function prepareProductionDatabase(config: RuntimeConfig, email: string, password: string) {
  if (config.policy.mode !== 'production') throw Error('La preparación requiere configuración de producción.')
  if (existsSync(config.databasePath)) throw Error('La base ya existe. No se sobrescribe ni se renuevan accesos al repetir la preparación.')
  if (email.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw Error('CAI_BOOTSTRAP_EMAIL debe ser un correo válido.')
  if ([...password].length < 15 || password.trim().length < 15 || password.length > 128 || /[\r\n]/.test(password)) throw Error('La contraseña inicial requiere una frase de 15 a 128 caracteres en una sola línea.')
  const encoded = await hashPassword(password)
  // wx evita que dos preparaciones simultáneas reemplacen un archivo creado entre tanto.
  closeSync(openSync(config.databasePath, 'wx', 0o600))
  const db = openDatabase(config.databasePath)
  try { db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES (?,'Coordinación',?,'admin')").run(email.toLowerCase(), encoded) }
  finally { db.close() }
}

export function readBootstrapPassword(path: string | undefined, config: RuntimeConfig) {
  if (config.policy.mode !== 'production' || !path || !isAbsolute(path)) throw Error('CAI_BOOTSTRAP_PASSWORD_FILE requiere un archivo privado absoluto dentro de CAI_DATA_DIR.')
  try {
    const metadata = lstatSync(path)
    if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.size > 512 || !isWithin(realpathSync(config.dataDirectory), realpathSync(path))) throw Error('unsafe-file')
    return readFileSync(path, 'utf8').replace(/\r?\n$/, '')
  } catch { throw Error('El archivo de contraseña inicial debe ser privado, pequeño y estar dentro de CAI_DATA_DIR, sin enlaces simbólicos.') }
}
