import { existsSync, readFileSync } from 'node:fs'
import { validClientId } from './google-auth.ts'

export function readGoogleClientId(path: string): string | undefined {
  const configured: unknown = process.env.GOOGLE_CLIENT_ID || (existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as { clientId?: unknown }).clientId : undefined)
  if (configured === undefined) return undefined
  if (typeof configured !== 'string' || !validClientId(configured)) throw new Error('Revisa el ID de cliente web de Google en .local/google.json o GOOGLE_CLIENT_ID.')
  return configured
}
