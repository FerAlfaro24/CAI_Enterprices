import { existsSync } from 'node:fs'
import { readRuntimeConfig } from './runtime-config.ts'
import { prepareProductionDatabase, readBootstrapPassword } from './production-storage.ts'

try {
  const config = readRuntimeConfig()
  if (config.policy.mode !== 'production') throw Error('Usa NODE_ENV=production y la configuración privada del entorno nuevo.')
  if (existsSync(config.databasePath)) throw Error('La base ya existe. No se sobrescribe ni se cambia el acceso.')
  const email = process.env.CAI_BOOTSTRAP_EMAIL ?? ''
  const password = readBootstrapPassword(process.env.CAI_BOOTSTRAP_PASSWORD_FILE, config)
  await prepareProductionDatabase(config, email, password)
  console.info('Base nueva preparada. Conserva el acceso por el canal privado del responsable; no se imprimió la contraseña.')
} catch {
  console.error('No se preparó una base nueva. Revisa configuración, archivo privado, correo y ausencia de una base previa; no se sobrescriben datos. Consulta la guía de producción.')
  process.exitCode = 1
}
