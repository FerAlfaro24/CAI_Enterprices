import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, request, type Server } from 'node:http'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { once } from 'node:events'
import { createPreviewGateway } from '../preview-gateway.ts'

const origin = 'https://presentacion.example.test'
const password = 'Clave de ejemplo solo para esta prueba 2026'
const authorization = 'Basic ' + Buffer.from('cai:' + password).toString('base64')
const listen = async (server: Server) => {
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  return (server.address() as { port: number }).port
}
const close = (server: Server) => new Promise<void>(resolve => { server.closeAllConnections(); server.close(() => resolve()) })
function send(port: number, path: string, headers: Record<string, string> = {}, method = 'GET') {
  return new Promise<{ status: number; headers: import('node:http').IncomingHttpHeaders; text: string }>((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, path, method, headers: { host: 'presentacion.example.test', 'x-forwarded-proto': 'https', 'cf-connecting-ip': '198.51.100.24', authorization, ...headers } }, res => {
      const chunks: Buffer[] = []; res.on('data', data => chunks.push(data))
      res.on('end', () => resolve({ status: res.statusCode!, headers: res.headers, text: Buffer.concat(chunks).toString('utf8') }))
    })
    req.on('error', reject); req.end()
  })
}

test('Entrada de presentación: acceso, fuentes, origen, proxy, vencimiento y cierre', async t => {
  const root = resolve('.local/tests'); await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'preview-gateway-'))
  await mkdir(join(directory, 'assets'))
  await writeFile(join(directory, 'index.html'), '<html><body><h1>CAI</h1></body></html>')
  await writeFile(join(directory, 'assets/app.js'), 'console.info("CAI")')
  const upstream = createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Set-Cookie', '__Host-cai_session=test; HttpOnly; Secure; SameSite=Strict; Path=/')
    res.end(JSON.stringify({ headers: req.headers, path: req.url }))
  })
  const apiPort = await listen(upstream), gateway = createPreviewGateway(), port = await listen(gateway.server)
  const options = { origin, directory, apiPort, username: 'cai', password, expiresAt: Date.now() + 60_000 }
  try {
    await t.test('Arranca cerrado antes de tener origen y credenciales', async () => assert.equal((await send(port, '/')).status, 503))
    gateway.configure(options)
    await t.test('No permite cambiar el origen durante la presentación', () => assert.throws(() => gateway.configure(options)))
    await t.test('Todas las vistas, recursos y API requieren la contraseña temporal', async () => {
      for (const path of ['/', '/community', '/admin', '/assets/app.js', '/api/local/health', '/api/local/student/gallery']) {
        const result = await send(port, path, { authorization: '' })
        assert.equal(result.status, 401); assert.match(result.headers['www-authenticate']!, /^Basic /)
        assert.doesNotMatch(result.text, /console.info/)
      }
      assert.equal((await send(port, '/', { authorization: 'Basic clave-equivocada' })).status, 401)
    })
    await t.test('Rechaza host, protocolo e IP no verificados', async () => {
      const invalidHeaders: Record<string, string>[] = [{ host: 'evil.example.test' }, { 'x-forwarded-proto': 'http' }, { 'cf-connecting-ip': '198.51.100.24, 1.2.3.4' }]
      for (const headers of invalidHeaders) assert.equal((await send(port, '/', headers)).status, 403)
    })
    await t.test('Sirve rutas profundas y recursos compilados, con aviso y sin caché', async () => {
      for (const path of ['/', '/community', '/login', '/admin/publicaciones']) {
        const result = await send(port, path)
        assert.equal(result.status, 200); assert.match(result.text, /Demostración privada/)
        assert.equal(result.headers['cache-control'], 'no-store'); assert.equal(result.headers['x-frame-options'], 'DENY')
      }
      assert.equal((await send(port, '/assets/app.js')).text, 'console.info("CAI")')
    })
    await t.test('Rechaza fuentes, mapas, datos, rutas ajenas y traversal', async () => {
      for (const path of ['/.git/config', '/.local/cai.sqlite', '/src/app.tsx', '/server/app.ts', '/assets/app.js.map', '/%2e%2e/secreto.txt', '/@vite/client', '/desconocido', '/api/otra']) assert.equal((await send(port, path)).status, 404, path)
    })
    await t.test('Rechaza escritura sin origen, origen ajeno y API desde otro sitio', async () => {
      assert.equal((await send(port, '/api/local/student/session', {}, 'POST')).status, 403)
      assert.equal((await send(port, '/api/local/student/session', { origin: 'https://evil.example.test' }, 'POST')).status, 403)
      assert.equal((await send(port, '/api/local/health', { 'sec-fetch-site': 'cross-site' })).status, 403)
    })
    await t.test('Proxy fija cabeceras, elimina la clave de entrada y conserva cookies seguras', async () => {
      const result = await send(port, '/api/local/student/session', { origin, 'x-forwarded-for': '203.0.113.100', 'x-forwarded-host': 'evil.example.test', forwarded: 'for=evil' }, 'POST')
      assert.equal(result.status, 200)
      const data = JSON.parse(result.text)
      assert.equal(data.headers.host, 'presentacion.example.test')
      assert.equal(data.headers['x-forwarded-proto'], 'https')
      assert.equal(data.headers['x-forwarded-for'], '198.51.100.24')
      assert.equal(data.headers.origin, origin)
      for (const name of ['authorization', 'x-forwarded-host', 'forwarded']) assert.equal(data.headers[name], undefined)
      assert.match(result.headers['set-cookie']![0]!, /__Host-.*HttpOnly; Secure; SameSite=Strict; Path=\//)
    })
    await t.test('Limita los intentos erróneos', async () => {
      let result
      for (let i = 0; i < 31; i++) result = await send(port, '/', { authorization: 'Basic incorrecta', 'cf-connecting-ip': '198.51.100.99' })
      assert.equal(result!.status, 429)
      for (let i = 0; i < 35; i++) assert.equal((await send(port, '/', { authorization: '' })).status, 401)
      assert.equal((await send(port, '/community')).status, 200)
    })
    await t.test('Una presentación vencida bloquea también el contenido autenticado', async () => {
      const expired = createPreviewGateway(); expired.configure({ ...options, expiresAt: Date.now() - 1 })
      const expiredPort = await listen(expired.server)
      try { assert.equal((await send(expiredPort, '/community')).status, 410) } finally { await close(expired.server) }
    })
  } finally { await close(gateway.server); await close(upstream) }
})
