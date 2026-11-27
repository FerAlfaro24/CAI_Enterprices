import { createServer, request as httpRequest, type IncomingMessage, type ServerResponse } from 'node:http'
import { isIP } from 'node:net'
import { createReadStream } from 'node:fs'
import { realpath, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { isWithin, productionPolicy } from './runtime-config.ts'

const hopHeaders = new Set(['connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization', 'te', 'trailer', 'transfer-encoding', 'upgrade'])
const mime: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8' }

function reply(response: ServerResponse, status: number, text: string) {
  response.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(text)
}

/** Railway sobrescribe X-Real-IP en su edge HTTPS. No exponer este puerto por TCP
 * ni compartir el entorno con servicios ajenos: la red privada también llega aquí.
 * La API conserva su listener loopback y recibe cabeceras reconstruidas, nunca la cadena del cliente. */
export function createRailwayProxy(options: { publicOrigin: string; apiPort: number; publicDirectory: string }) {
  const policy = productionPolicy(options.publicOrigin)
  if (policy.mode !== 'production' || !Number.isInteger(options.apiPort) || options.apiPort < 1 || options.apiPort > 65535) throw Error('Configuración del proxy no válida.')
  const origin = policy.publicOrigin, host = new URL(origin).host
  const proxy = createServer({ maxHeaderSize: 16_384, requestTimeout: 60_000, headersTimeout: 15_000 }, (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff')
    response.setHeader('Referrer-Policy', 'no-referrer')
    response.setHeader('X-Frame-Options', 'DENY')
    void handle(request, response).catch(() => {
      if (!response.headersSent) reply(response, 500, 'No se pudo completar la solicitud.')
      else response.destroy()
    })
  })

  async function handle(request: IncomingMessage, response: ServerResponse) {
    // Sondeo de Railway sin cabeceras de visitante. Se abre después de arrancar la API.
    if (request.url === '/healthz' && request.method === 'GET') return reply(response, 200, 'ok')
    const ip = request.headers['x-real-ip']
    if (request.headers.host !== host || request.headers['x-forwarded-proto'] !== 'https' || typeof ip !== 'string' || !isIP(ip)) return reply(response, 403, 'Conexión no permitida.')
    const target = request.url ?? ''
    if (!target.startsWith('/') || target.startsWith('//') || /[\\\0]/.test(target)) return reply(response, 400, 'Ruta no válida.')
    const path = new URL(target, origin).pathname
    if (path === '/api/local' || path.startsWith('/api/local/')) {
      const headers = { ...request.headers }
      const connectionHeaders = String(headers.connection ?? '').toLowerCase().split(',').map(value => value.trim())
      for (const name of Object.keys(headers)) if (hopHeaders.has(name) || connectionHeaders.includes(name) || name.startsWith('x-forwarded-') || ['forwarded', 'x-real-ip', 'cf-connecting-ip', 'true-client-ip', 'fastly-client-ip', 'x-client-ip'].includes(name)) delete headers[name]
      headers.host = host
      headers['x-forwarded-proto'] = 'https'
      headers['x-forwarded-for'] = ip
      const upstream = httpRequest({ hostname: '127.0.0.1', port: options.apiPort, path: target, method: request.method, headers, timeout: 30_000 }, result => {
        const resultHeaders = { ...result.headers }
        for (const name of hopHeaders) delete resultHeaders[name]
        response.writeHead(result.statusCode ?? 502, resultHeaders)
        result.on('error', () => response.destroy())
        result.pipe(response)
      })
      upstream.on('timeout', () => upstream.destroy())
      upstream.on('error', () => {
        if (!response.headersSent) reply(response, 502, 'El servicio no está disponible. Intenta de nuevo.')
        else response.destroy()
      })
      request.on('aborted', () => upstream.destroy())
      response.on('close', () => { if (!response.writableFinished) upstream.destroy() })
      request.pipe(upstream)
      return
    }
    if (!['GET', 'HEAD'].includes(request.method ?? '')) return reply(response, 405, 'Método no permitido.')
    let decoded: string
    try { decoded = decodeURIComponent(path) } catch { return reply(response, 400, 'Ruta no válida.') }
    const segments = decoded.split('/')
    if (/[\\\0]/.test(decoded) || segments.some(segment => segment.startsWith('.')) || /^\/(?:api|server|src|shared|deploy|node_modules|reference)(?:\/|$)/i.test(decoded)) return reply(response, 404, 'No encontrado.')
    const root = await realpath(options.publicDirectory)
    let file = join(root, decoded)
    try {
      file = await realpath(file)
      if (!isWithin(root, file)) return reply(response, 404, 'No encontrado.')
      if (!(await stat(file)).isFile()) throw Error('not-file')
    } catch {
      if (extname(decoded) || decoded.startsWith('/assets/')) return reply(response, 404, 'No encontrado.')
      file = await realpath(join(root, 'index.html'))
      if (!isWithin(root, file)) return reply(response, 404, 'No encontrado.')
    }
    const metadata = await stat(file)
    response.writeHead(200, { 'Content-Type': mime[extname(file).toLowerCase()] ?? 'application/octet-stream', 'Content-Length': metadata.size,
      // Google valida el origen del iframe de acceso. Entre sitios solo viaja el
      // dominio; API, archivos privados y recursos mantienen no-referrer.
      ...(extname(file).toLowerCase() === '.html' ? { 'Referrer-Policy': 'strict-origin-when-cross-origin' } : {}),
      'Cache-Control': decoded.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache' })
    if (request.method === 'HEAD') return response.end()
    await pipeline(createReadStream(file), response)
  }
  return proxy
}
