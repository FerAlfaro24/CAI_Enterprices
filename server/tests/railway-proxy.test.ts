import test from 'node:test'
import assert from 'node:assert/strict'
import { once } from 'node:events'
import { request as httpRequest, type Server } from 'node:http'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import { createRailwayProxy } from '../railway-proxy.ts'

async function listen(server: Server) { server.listen(0, '127.0.0.1'); await once(server, 'listening'); const address = server.address(); assert.ok(address && typeof address === 'object'); return address.port }
const close = (server: Server) => new Promise<void>((done, fail) => { server.closeAllConnections(); server.close(error => error ? fail(error) : done()) })

test('Railway: contrato del edge, API loopback, cookies y contenido privado', async t => {
  const root = resolve('.local/tests'); await mkdir(root, { recursive: true }); const folder = await mkdtemp(join(root, 'railway-proxy-'))
  const publicDirectory = join(folder, 'dist'); await mkdir(publicDirectory); await mkdir(join(publicDirectory, 'assets'))
  await writeFile(join(publicDirectory, 'index.html'), '<html>CAI fixture</html>'); await writeFile(join(publicDirectory, 'assets', 'app.js'), '/* fixture */')
  const origin = 'https://cai.example.test', password = 'Frase ficticia de administrador 2026'
  const app = createApplication(':memory:', {}, { runtime: { mode: 'production', publicOrigin: origin, trustedProxy: 'loopback' } })
  app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','Fixture',?,'admin')").run(await hashPassword(password))
  const apiPort = await listen(app.server), proxy = createRailwayProxy({ publicOrigin: origin, apiPort, publicDirectory }), port = await listen(proxy)
  t.after(async () => { await close(proxy); await close(app.server) })
  const call = (path: string, method = 'GET', data?: unknown, changes: Record<string, string | undefined> = {}, destination = port) => new Promise<{ status: number; headers: import('node:http').IncomingHttpHeaders; body: string }>((done, fail) => {
    const headers = Object.fromEntries(Object.entries({ Host: 'cai.example.test', 'X-Forwarded-Proto': 'https', 'X-Real-IP': '192.0.2.10', Origin: origin, ...(data === undefined ? {} : { 'Content-Type': 'application/json' }), ...changes }).filter((entry): entry is [string, string] => entry[1] !== undefined))
    const request = httpRequest({ host: '127.0.0.1', port: destination, path, method, headers }, response => { const chunks: Buffer[] = []; response.on('data', chunk => chunks.push(Buffer.from(chunk))); response.on('end', () => done({ status: response.statusCode!, headers: response.headers, body: Buffer.concat(chunks).toString() })) })
    request.on('error', fail); request.end(data === undefined ? undefined : JSON.stringify(data))
  })
  await t.test('sin edge HTTPS o dirección válida se rechaza antes de llegar a la API', async () => {
    for (const headers of [{ 'X-Real-IP': undefined }, { 'X-Real-IP': '192.0.2.1, 192.0.2.2' }, { 'X-Forwarded-Proto': 'http' }, { Host: 'evil.example.test' }]) assert.equal((await call('/api/local/health', 'GET', undefined, headers)).status, 403)
    assert.equal((await call('/healthz', 'GET', undefined, { Host: 'healthcheck.railway.app', 'X-Real-IP': undefined })).status, 200)
  })
  await t.test('reconstruye cabeceras y conserva la defensa de origen de la API', async () => {
    assert.equal((await call('/api/local/health', 'GET', undefined, { 'X-Forwarded-For': 'invalid, forged', Forwarded: 'for=evil', 'X-Forwarded-Host': 'evil.example.test' })).status, 200)
    assert.equal((await call('/api/local/auth/login', 'POST', { email: 'admin@example.test', password }, { Origin: 'https://evil.example.test' })).status, 403)
    assert.equal((await call('/api/local/auth/login', 'POST', { email: 'admin@example.test', password }, { 'Sec-Fetch-Site': 'cross-site' })).status, 403)
    assert.equal((await call('/api/local/health', 'GET', undefined, {}, apiPort)).status, 403)
  })
  await t.test('entrada administrativa real conserva cookies seguras y datos privados', async () => {
    const result = await call('/api/local/auth/login', 'POST', { email: 'admin@example.test', password })
    assert.equal(result.status, 200)
    const cookie = result.headers['set-cookie']?.join(';') ?? ''
    assert.match(cookie, /__Host-/); assert.match(cookie, /Secure/); assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/)
    assert.equal((await call('/api/local/students')).status, 401)
  })
  await t.test('solo sirve dist; rutas de la aplicación funcionan y archivos ausentes no son HTML', async () => {
    assert.match((await call('/login')).body, /CAI fixture/)
    assert.equal((await call('/assets/app.js')).headers['content-type'], 'text/javascript; charset=utf-8')
    for (const path of ['/server/runtime-config.ts', '/.env', '/.git/config', '/.local/cai.sqlite', '/shared/classes.ts', '/assets/missing.js', '/api/missing', '/%2e%2e%2fprivate.json', '/src/features/admin/data/mockData.ts']) assert.equal((await call(path)).status, 404, path)
    assert.equal((await call('/login', 'POST', {})).status, 405)
  })
  await t.test('HTML permite validar el origen de Google; API y recursos conservan no-referrer', async () => {
    for (const path of ['/login', '/registro', '/community']) {
      assert.equal((await call(path)).headers['referrer-policy'], 'strict-origin-when-cross-origin')
    }
    assert.equal((await call('/api/local/health')).headers['referrer-policy'], 'no-referrer')
    assert.equal((await call('/assets/app.js')).headers['referrer-policy'], 'no-referrer')
    assert.equal((await call('/.env')).headers['referrer-policy'], 'no-referrer')
  })
})
