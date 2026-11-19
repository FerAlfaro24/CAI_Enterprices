/** Entrada temporal: solo frontend compilado y API, siempre tras autenticación. */
import { createServer, request as upstreamRequest, type IncomingMessage, type ServerResponse } from 'node:http'
import { createHash, timingSafeEqual } from 'node:crypto'
import { readFile, realpath, stat } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { isIP } from 'node:net'
import { isWithin, productionPolicy } from './runtime-config.ts'

type PreviewOptions = {
  origin: string
  directory: string
  apiPort: number
  username: string
  password: string
  expiresAt: number
}

const mime: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
}
const securityHeaders = {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY', 'X-Robots-Tag': 'noindex, nofollow, noarchive',
}
const banner = '<aside role="note" style="padding:10px 16px;background:#102552;color:white;text-align:center;font:14px/1.5 system-ui">Demostración privada de CAI · Cuentas, publicaciones e interacciones ficticias. Fotografías oficiales. No ingresar datos reales.</aside>'

export function createPreviewHandler(options: PreviewOptions) {
  const origin = productionPolicy(options.origin)
  if (origin.mode !== 'production') throw Error('Se requiere HTTPS.')
  if (options.password.length < 20 || !/^[a-z0-9-]+$/i.test(options.username)) throw Error('Acceso temporal inválido.')
  const root = resolve(options.directory), host = new URL(origin.publicOrigin).host
  const expected = createHash('sha256').update('Basic ' + Buffer.from(`${options.username}:${options.password}`).toString('base64')).digest()
  const attempts = new Map<string, { count: number; until: number }>()
  const reply = (response: ServerResponse, code: number, message: string) => {
    response.writeHead(code, { ...securityHeaders, 'Content-Type': 'text/plain; charset=utf-8' })
    response.end(message)
  }

  return async (request: IncomingMessage, response: ServerResponse) => {
    try {
      if (Date.now() >= options.expiresAt) return reply(response, 410, 'La demostración temporal ha terminado.')
      if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(request.socket.remoteAddress ?? '') ||
          request.headers.host !== host || request.headers['x-forwarded-proto'] !== 'https') {
        return reply(response, 403, 'Utiliza el enlace HTTPS de la demostración.')
      }
      const ip = request.headers['cf-connecting-ip']
      if (typeof ip !== 'string' || !isIP(ip)) return reply(response, 403, 'No se pudo verificar la conexión.')
      const authorization = request.headers.authorization ?? ''
      const supplied = createHash('sha256').update(authorization).digest()
      if (!timingSafeEqual(supplied, expected)) {
        // La primera visita sin Authorization es el desafío normal del navegador,
        // no un fallo de contraseña. Contar solo claves incorrectas evita bloquear
        // a visitantes legítimos que comparten IP durante la presentación.
        if (authorization) {
          const now = Date.now()
          for (const [key, item] of attempts) if (item.until <= now) attempts.delete(key)
          const attempt = attempts.get(ip) ?? { count: 0, until: now + 15 * 60_000 }
          attempt.count++; attempts.set(ip, attempt)
          if (attempt.count > 30) return reply(response, 429, 'Espera unos minutos antes de volver a intentar.')
        }
        response.setHeader('WWW-Authenticate', 'Basic realm="CAI demostracion privada", charset="UTF-8"')
        return reply(response, 401, 'Esta demostración requiere el acceso compartido por CAI.')
      }
      if (!['GET', 'POST', 'PATCH'].includes(request.method ?? '')) return reply(response, 405, 'Método no permitido.')
      const raw = request.url ?? ''
      let path: string
      try { path = decodeURIComponent(raw.split('?')[0]!) } catch { return reply(response, 400, 'Ruta inválida.') }
      if (!raw.startsWith('/') || raw.startsWith('//') || path.includes('\\') || path.includes('\0') ||
          path.split('/').some(part => part.startsWith('.') || part === '..')) return reply(response, 404, 'No disponible.')
      const suppliedOrigin = request.headers.origin
      if ((suppliedOrigin && suppliedOrigin !== origin.publicOrigin) ||
          (request.method !== 'GET' && suppliedOrigin !== origin.publicOrigin)) return reply(response, 403, 'Origen no permitido.')
      if (path.startsWith('/api/local/')) {
        if (request.headers['sec-fetch-site'] === 'cross-site') return reply(response, 403, 'Origen no permitido.')
        const headers: Record<string, string> = {
          host, 'x-forwarded-proto': 'https', 'x-forwarded-for': ip,
        }
        // No reenviar Authorization, cabeceras de proxy del visitante ni cabeceras hop-by-hop.
        for (const name of ['content-type', 'content-length', 'cookie', 'origin', 'accept', 'idempotency-key', 'sec-fetch-site']) {
          const value = request.headers[name]
          if (typeof value === 'string') headers[name] = value
        }
        const upstream = upstreamRequest({ hostname: '127.0.0.1', port: options.apiPort, method: request.method, path: raw, headers }, incoming => {
          response.writeHead(incoming.statusCode ?? 502, { ...incoming.headers, ...securityHeaders })
          incoming.pipe(response)
        })
        upstream.setTimeout(30_000, () => upstream.destroy())
        upstream.on('error', () => { if (!response.headersSent) reply(response, 502, 'La demostración no está disponible.'); else response.destroy() })
        request.on('aborted', () => upstream.destroy())
        request.pipe(upstream)
        return
      }
      if (path.startsWith('/api/')) return reply(response, 404, 'No disponible.')
      if (request.method !== 'GET') return reply(response, 405, 'Método no permitido.')
      const extension = extname(path)
      if (!extension && !/^\/(?:$|(?:login|registro|registro-local|activar|recuperar|recuperar-acceso|recuperar-acceso-administrativo|recuperar-administracion|activar-administracion|mi-inscripcion|solicitud-google|community)\/?$|(?:admin|gestion|alumnos)(?:\/[^.]*)?$)/.test(path)) return reply(response, 404, 'No disponible.')
      // Solo recursos compilados tipados; nunca fuentes, mapas, datos o carpetas del proyecto.
      if (extension && !mime[extension]) return reply(response, 404, 'No disponible.')
      if (!extension && path.startsWith('/assets/')) return reply(response, 404, 'No disponible.')
      const target = resolve(root, extension ? '.' + path : 'index.html')
      let canonical: string
      try { canonical = await realpath(target) } catch { return reply(response, 404, 'No disponible.') }
      if (!isWithin(root, canonical) || !(await stat(canonical)).isFile()) return reply(response, 404, 'No disponible.')
      const bytes = await readFile(canonical)
      response.writeHead(200, {
        ...securityHeaders, 'Content-Type': mime[extension || '.html']!,
        'Content-Security-Policy': "default-src 'self'; img-src 'self' https: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'",
      })
      response.end((extension || '.html') === '.html' ? bytes.toString('utf8').replace('<body>', '<body>' + banner) : bytes)
    } catch {
      if (!response.headersSent) reply(response, 500, 'No se pudo cargar la demostración.')
      else response.destroy()
    }
  }
}

/** Se inicia cerrado; no atiende el túnel hasta completar copia, origen y API. */
export function createPreviewGateway() {
  let handler: ReturnType<typeof createPreviewHandler> | undefined
  const server = createServer((request, response) => {
    if (!handler) { response.writeHead(503, securityHeaders); response.end('Preparando demostración.'); return }
    void handler(request, response)
  })
  server.requestTimeout = 30_000
  server.headersTimeout = 15_000
  return { server, configure(options: PreviewOptions) {
    if (handler) throw Error('El origen temporal no puede cambiar durante una presentación.')
    handler = createPreviewHandler(options)
  } }
}
