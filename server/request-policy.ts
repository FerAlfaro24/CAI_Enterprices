import type { IncomingMessage } from 'node:http'
import { isIP } from 'node:net'
import { HttpError } from './validation.ts'
import { productionPolicy, type RequestPolicy } from './runtime-config.ts'

const loopback = new Set(['127.0.0.1', '::ffff:127.0.0.1', '::1'])
const frontendOrigins = ['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:4180', 'http://localhost:4180']

export function validateRequestPolicy(policy: RequestPolicy): RequestPolicy {
  if (policy.mode === 'local') return { mode: 'local' }
  if (policy.mode !== 'production' || policy.trustedProxy !== 'loopback') throw Error('Política de conexión no admitida.')
  return productionPolicy(policy.publicOrigin)
}

/** Solo un proxy en la misma máquina; nunca confiar en cabeceras de una conexión remota. */
export function requestContext(request: IncomingMessage, policy: RequestPolicy) {
  const host = request.headers.host ?? ''
  const peer = request.socket.remoteAddress ?? ''
  if (!loopback.has(peer)) throw new HttpError(403, 'Conexión de servicio no permitida.')
  if (policy.mode === 'local') {
    if (!/^(127\.0\.0\.1|localhost):\d+$/.test(host)) throw new HttpError(403, 'Este servicio solo está disponible en el equipo local.')
  } else {
    if (host !== new URL(policy.publicOrigin).host || request.headers['x-forwarded-proto'] !== 'https') throw new HttpError(403, 'Se requiere el dominio HTTPS configurado.')
  }
  // El navegador/proxy debe enviar origin-form; no aceptar una URL absoluta que cambie el host.
  if (!request.url?.startsWith('/') || request.url.startsWith('//') || request.url.includes('\\')) throw new HttpError(400, 'Ruta de solicitud no válida.')
  const url = new URL(request.url, policy.mode === 'production' ? policy.publicOrigin : `http://${host}`)
  const method = request.method
  if (!['GET', 'POST', 'PATCH'].includes(method ?? '')) throw new HttpError(405, 'Método no permitido.')
  const origin = request.headers.origin
  if (method !== 'GET' || (policy.mode === 'production' && origin !== undefined)) {
    const allowed = policy.mode === 'production' ? [policy.publicOrigin] : [...frontendOrigins, `http://${host}`]
    if (!origin || !allowed.includes(origin)) throw new HttpError(403, 'El origen de la solicitud no está permitido.')
    if (request.headers['sec-fetch-site'] === 'cross-site') throw new HttpError(403, 'Solicitud de otro sitio no permitida.')
  }
  let clientAddress = peer
  if (policy.mode === 'production') {
    const forwarded = request.headers['x-forwarded-for']
    if (typeof forwarded !== 'string' || !isIP(forwarded) || forwarded.includes(',')) throw new HttpError(403, 'El proxy debe indicar una sola dirección de cliente válida.')
    clientAddress = forwarded.startsWith('::ffff:') && isIP(forwarded.slice(7)) === 4 ? forwarded.slice(7) : forwarded
  }
  return { url, path: url.pathname, method, clientAddress }
}
