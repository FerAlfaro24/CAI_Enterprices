import assert from 'node:assert/strict'
import test from 'node:test'
import { cp, mkdir, mkdtemp, copyFile, writeFile, readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { createServer, request } from 'node:http'
import { once } from 'node:events'
import { projectDirectory } from '../runtime-config.ts'

test('CLI productiva: preparación, comprobación, arranque y copia sin datos habituales', async () => {
  const root = resolve('.local/tests'); await mkdir(root, { recursive: true })
  const directory = await mkdtemp(join(root, 'production-cli-')), code = join(directory, 'code'), data = join(directory, 'data')
  await mkdir(code); await mkdir(data)
  // Solo fuente pública y paquetes: nunca copiar .local, .git, accesos o bases del usuario.
  await cp(join(projectDirectory, 'server'), join(code, 'server'), { recursive: true, filter: path => !path.startsWith(join(projectDirectory, 'server/tests')) })
  await cp(join(projectDirectory, 'shared'), join(code, 'shared'), { recursive: true })
  await copyFile(join(projectDirectory, 'package.json'), join(code, 'package.json'))
  await mkdir(join(code, 'src/features/admin/data'), { recursive: true })
  await copyFile(join(projectDirectory, 'src/features/admin/data/mockData.ts'), join(code, 'src/features/admin/data/mockData.ts'))
  await mkdir(join(code, 'src/features/landing/data'), { recursive: true })
  await copyFile(join(projectDirectory, 'src/features/landing/data/content.ts'), join(code, 'src/features/landing/data/content.ts'))
  const secret = 'Frase exclusivamente ficticia para ensayar los comandos 2026', file = join(data, 'bootstrap.txt')
  await writeFile(file, secret, { mode: 0o600 })
  const probe = createServer(); probe.listen(0, '127.0.0.1'); await once(probe, 'listening')
  const address = probe.address(); assert.ok(address && typeof address === 'object')
  const port = address.port; await new Promise<void>(done => probe.close(() => done()))
  const env = { ...process.env, NODE_ENV: 'production', CAI_PUBLIC_ORIGIN: 'https://cai.example.test', CAI_TRUST_PROXY: 'loopback', CAI_DATA_DIR: data, CAI_API_PORT: String(port), GOOGLE_CLIENT_ID: '', CAI_BOOTSTRAP_EMAIL: 'fixture-admin@example.test', CAI_BOOTSTRAP_PASSWORD_FILE: file }
  const run = (name: string) => promisify(execFile)(process.execPath, [join(code, 'server', name)], { cwd: code, env, windowsHide: true })
  const setup = await run('production-setup.ts'); assert.ok(!setup.stdout.includes(secret))
  await assert.rejects(run('production-setup.ts'))
  const check = await run('production-check.ts'); assert.match(check.stdout, /No se abrieron puertos/)
  const child = spawn(process.execPath, [join(code, 'server/index.ts')], { cwd: code, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  let stdout = '', stderr = ''
  const exited = once(child, 'exit')
  try {
    await new Promise<void>((done, fail) => {
      const timer = setTimeout(() => finish(Error('El servidor de prueba no inició.')), 10000)
      const inspect = (chunk: Buffer) => { stdout += chunk.toString(); if (stdout.includes('"event":"listening"')) finish() }
      const earlyExit = () => finish(Error('El servidor de prueba salió antes de escuchar. ' + stderr.slice(-1500)))
      const finish = (error?: Error) => { clearTimeout(timer); child.stdout.off('data', inspect); child.off('exit', earlyExit); if (error) fail(error); else done() }
      child.stdout.on('data', inspect); child.once('exit', earlyExit); child.stderr.on('data', chunk => { stderr += chunk.toString() }); child.once('error', fail)
    })
    const response = await new Promise<{ status: number; body: string }>((done, fail) => {
      const req = request(`http://127.0.0.1:${port}/api/local/ready`, { headers: { Host: 'cai.example.test', 'X-Forwarded-Proto': 'https', 'X-Forwarded-For': '192.0.2.90' } }, reply => {
        let body = ''; reply.on('data', chunk => { body += chunk.toString() }); reply.on('end', () => done({ status: reply.statusCode!, body })); reply.on('error', fail)
      })
      req.on('error', fail); req.end()
    })
    assert.equal(response.status, 200); assert.deepEqual(JSON.parse(response.body), { status: 'ok' })
    const backup = await run('production-backup.ts'); assert.match(backup.stdout, /backup_created/)
    assert.equal((await readdir(join(data, 'backups'))).length, 1)
    assert.ok(!stdout.includes(secret) && !stderr.includes(secret))
    assert.ok(!(await readdir(code)).includes('.local'))
  } finally { child.kill(); await exited }
})
