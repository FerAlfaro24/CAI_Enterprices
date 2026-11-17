import { readRuntimeConfig } from './runtime-config.ts'
import { checkProductionDatabase } from './production-storage.ts'

try {
  const config = readRuntimeConfig()
  checkProductionDatabase(config)
  console.info('Configuración y base preparadas para el contrato de proxy HTTPS local. No se abrieron puertos ni se aplicaron migraciones. Falta comprobar el alojamiento real.')
} catch {
  console.error('Preparación incompleta. Revisa NODE_ENV, CAI_PUBLIC_ORIGIN, CAI_TRUST_PROXY, CAI_DATA_DIR y la base inicializada según la guía de producción. No se imprimen rutas privadas o credenciales.')
  process.exitCode = 1
}
