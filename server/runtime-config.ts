import { isAbsolute, dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { realpathSync, statSync } from 'node:fs'
import { isIP } from 'node:net'
import { validClientId } from './google-auth.ts'

export type RequestPolicy = { mode: 'local' } | { mode: 'production'; publicOrigin: string; trustedProxy: 'loopback' }
export type RuntimeConfig = {
  policy: RequestPolicy; host: '127.0.0.1'; port: number; databasePath: string; dataDirectory: string; googleClientId?: string; mailConfigPath?: string
}
export const projectDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '..')
export const localPolicy: RequestPolicy = { mode: 'local' }

export function productionPolicy(origin: string): RequestPolicy {
  let url: URL
  try { url = new URL(origin) } catch { throw Error('CAI_PUBLIC_ORIGIN debe indicar un origen HTTPS válido.') }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash ||
      isIP(url.hostname.replace(/^\[|\]$/g, '')) || !url.hostname.includes('.') || url.hostname.endsWith('.localhost') ||
      !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(url.hostname) || ![url.origin, url.origin + '/'].includes(origin)) {
    throw Error('CAI_PUBLIC_ORIGIN requiere HTTPS y dominio canónico, sin ruta, credenciales, consulta o fragmento.')
  }
  return { mode: 'production', publicOrigin: url.origin, trustedProxy: 'loopback' }
}

export function isWithin(directory: string, path: string) {
  const difference = relative(directory, path)
  return difference === '' || (!isAbsolute(difference) && difference !== '..' && !difference.startsWith('..' + (process.platform === 'win32' ? '\\' : '/')))
}

/** Validar antes de abrir SQLite; producción nunca cae en .local como alternativa. */
export function readRuntimeConfig(env: Readonly<Record<string, string | undefined>> = process.env, codeDirectory = projectDirectory): RuntimeConfig {
  if (env.NODE_ENV && !['development', 'test', 'production'].includes(env.NODE_ENV)) throw Error('NODE_ENV no es válido.')
  const portText = env.CAI_API_PORT ?? '3100'
  const port = Number(portText)
  if (!/^\d+$/.test(portText) || !Number.isInteger(port) || port < 1024 || port > 65535) throw Error('CAI_API_PORT debe ser un puerto entre 1024 y 65535.')
  if (env.NODE_ENV !== 'production') {
    if (env.CAI_PUBLIC_ORIGIN || env.CAI_DATA_DIR || env.CAI_TRUST_PROXY) throw Error('La configuración de producción requiere NODE_ENV=production; no se mezclarán entornos.')
    return { policy: localPolicy, host: '127.0.0.1', port, databasePath: resolve(codeDirectory, '.local/cai.sqlite'), dataDirectory: resolve(codeDirectory, '.local'), mailConfigPath: env.CAI_MAIL_CONFIG }
  }
  if (!env.CAI_PUBLIC_ORIGIN || env.CAI_TRUST_PROXY !== 'loopback') throw Error('Producción requiere CAI_PUBLIC_ORIGIN HTTPS y CAI_TRUST_PROXY=loopback.')
  const policy = productionPolicy(env.CAI_PUBLIC_ORIGIN)
  if (!env.CAI_DATA_DIR || !isAbsolute(env.CAI_DATA_DIR)) throw Error('CAI_DATA_DIR debe ser una carpeta privada absoluta, fuera del código publicado.')
  let dataDirectory: string
  try {
    dataDirectory = realpathSync(env.CAI_DATA_DIR)
    if (!statSync(dataDirectory).isDirectory()) throw Error('not-directory')
  } catch { throw Error('CAI_DATA_DIR debe existir y ser una carpeta privada accesible.') }
  const code = realpathSync(codeDirectory)
  if (isWithin(code, dataDirectory) || isWithin(dataDirectory, code)) throw Error('Los datos de producción y el código deben estar en carpetas separadas, sin contenerse ni enlazarse entre sí.')
  const googleClientId = env.GOOGLE_CLIENT_ID || undefined
  if (googleClientId && !validClientId(googleClientId)) throw Error('GOOGLE_CLIENT_ID no tiene un formato válido.')
  return { policy, host: '127.0.0.1', port, dataDirectory, databasePath: join(dataDirectory, 'cai.sqlite'), googleClientId, mailConfigPath: env.CAI_MAIL_CONFIG }
}
