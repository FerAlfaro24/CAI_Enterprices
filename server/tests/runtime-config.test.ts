import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { readRuntimeConfig, productionPolicy, projectDirectory } from '../runtime-config.ts'
import { requestContext } from '../request-policy.ts'
import { readBootstrapPassword } from '../production-storage.ts'
import type { IncomingMessage } from 'node:http'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

test('Configuración: entornos separados, datos privados y proxy explícito', async t => {
  const root = resolve('.local/tests'); await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'runtime-config-')), code = join(directory, 'code'), data = join(directory, 'data')
  await mkdir(code); await mkdir(data)
  const env = { NODE_ENV: 'production', CAI_PUBLIC_ORIGIN: 'https://cai.example.test', CAI_TRUST_PROXY: 'loopback', CAI_DATA_DIR: data }

  await t.test('el modo local conserva loopback y no admite una configuración de producción accidental', () => {
    const local = readRuntimeConfig({}, code)
    assert.equal(local.policy.mode, 'local'); assert.equal(local.host, '127.0.0.1'); assert.equal(local.port, 3100)
    assert.equal(local.databasePath, join(code, '.local/cai.sqlite'))
    for (const extra of [{ CAI_PUBLIC_ORIGIN: env.CAI_PUBLIC_ORIGIN }, { CAI_DATA_DIR: data }, { CAI_TRUST_PROXY: 'loopback' }, { NODE_ENV: 'prod' }]) assert.throws(() => readRuntimeConfig(extra, code))
  })
  await t.test('producción exige origen HTTPS y confianza acotada, sin alternativas locales', () => {
    assert.throws(() => readRuntimeConfig({ NODE_ENV: 'production' }, code))
    assert.throws(() => readRuntimeConfig({ ...env, CAI_TRUST_PROXY: '*' }, code))
    const config = readRuntimeConfig(env, code)
    assert.equal(config.databasePath, join(data, 'cai.sqlite')); assert.equal(config.policy.mode, 'production')
    for (const origin of ['http://cai.example.test', 'https://localhost', 'https://127.0.0.1', 'https://[::1]', 'https://cai.example.test/ruta', 'https://cai.example.test?token=privado', 'https://cai.example.test#privado', 'https://user:password@cai.example.test', 'https://cai.example.test.evil/ruta', 'https://cai..example.test']) assert.throws(() => productionPolicy(origin), origin)
  })
  await t.test('rechaza datos dentro del código, antecesores, carpetas ausentes y rutas relativas', async () => {
    const inside = join(code, 'dist'); await mkdir(inside)
    for (const path of [code, inside, directory, 'ruta-relativa', join(directory, 'ausente')]) assert.throws(() => readRuntimeConfig({ ...env, CAI_DATA_DIR: path }, code))
  })
  await t.test('valida puerto y Google sin leer configuraciones personales', () => {
    for (const port of ['', '0', '1', '1023', '65536', '3e3', 'NaN', '3100.5']) assert.throws(() => readRuntimeConfig({ ...env, CAI_API_PORT: port }, code))
    assert.equal(readRuntimeConfig({ ...env, CAI_API_PORT: '3181' }, code).port, 3181)
    assert.throws(() => readRuntimeConfig({ ...env, GOOGLE_CLIENT_ID: 'id-no-valido' }, code))
    assert.equal(readRuntimeConfig({ ...env, GOOGLE_CLIENT_ID: '123456-fixture.apps.googleusercontent.com' }, code).googleClientId, '123456-fixture.apps.googleusercontent.com')
  })
  await t.test('el archivo inicial solo se lee dentro del directorio privado y con tamaño acotado', async () => {
    const config = readRuntimeConfig(env, code), secret = 'Frase exclusivamente ficticia del arranque 2026'
    const file = join(data, 'initial.txt'), outside = join(code, 'outside.txt'), large = join(data, 'large.txt')
    await writeFile(file, secret + '\n'); await writeFile(outside, secret); await writeFile(large, 'x'.repeat(513))
    assert.equal(readBootstrapPassword(file, config), secret)
    for (const path of [undefined, 'initial.txt', outside, large, data]) assert.throws(() => readBootstrapPassword(path, config))
  })
  await t.test('no confía en cabeceras de un cliente remoto ni en URL absoluta o método inesperado', () => {
    const policy = productionPolicy(env.CAI_PUBLIC_ORIGIN)
    const request = (overrides: object) => ({ socket: { remoteAddress: '127.0.0.1' }, headers: { host: 'cai.example.test', 'x-forwarded-proto': 'https', 'x-forwarded-for': '192.0.2.10' }, url: '/api/local/health', method: 'GET', ...overrides } as unknown as IncomingMessage)
    assert.equal(requestContext(request({}), policy).clientAddress, '192.0.2.10')
    assert.throws(() => requestContext(request({ socket: { remoteAddress: '203.0.113.10' } }), policy))
    for (const url of ['https://evil.example.test/api/local/health', '//evil.example.test/api/local/health', '/\\evil']) assert.throws(() => requestContext(request({ url }), policy))
    assert.throws(() => requestContext(request({ method: 'TRACE' }), policy))
    const local = requestContext(request({ headers: { host: 'localhost:4180', 'x-forwarded-for': 'malicioso', 'x-forwarded-proto': 'https' } }), { mode: 'local' })
    assert.equal(local.clientAddress, '127.0.0.1')
  })
  await t.test('herramientas locales se detienen en producción antes de crear archivos', async () => {
    for (const [name, args] of [['setup.ts', []], ['backup.ts', []], ['google-setup.ts', ['123456-fixture.apps.googleusercontent.com']]] as const) {
      await assert.rejects(promisify(execFile)(process.execPath, [join(projectDirectory, 'server', name), ...args], { cwd: code, env: { ...process.env, NODE_ENV: 'production' }, windowsHide: true }), /producción/)
    }
    await assert.rejects(import('node:fs/promises').then(fs => fs.stat(join(code, '.local'))), { code: 'ENOENT' })
  })
})
