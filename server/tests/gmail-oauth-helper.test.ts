import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { request } from 'node:http'

test('asistente Gmail: PKCE y callback local rechazan sesiones/hosts ajenos sin guardar tokens', async () => {
  const parent = resolve('.local/tests')
  await mkdir(parent, { recursive: true })
  const directory = await mkdtemp(join(parent, 'gmail-oauth-helper-'))
  const client = join(directory, 'client.json'), output = join(directory, 'private', 'gmail.json')
  await writeFile(client, JSON.stringify({ installed: { client_id: '12345-fictional.apps.googleusercontent.com', client_secret: 'fictional-client-secret-for-tests' } }))
  const child = spawn(process.execPath, ['scripts/configure-gmail-oauth.mjs', '--client', client, '--output', output,
    '--from', 'fixture@gmail.com', '--origin', 'https://cai.example.test'], { cwd: process.cwd(), windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  const closed = once(child, 'close')
  let stdout = ''
  child.stdout.setEncoding('utf8')
  // Nunca se abre el enlace de Google ni se pide un token; cliente y correo ficticios.
  try {
    const url = await new Promise<URL>((resolveUrl, reject) => {
      const timer = setTimeout(() => reject(Error('El asistente no abrió el callback local.')), 10_000)
      child.once('error', () => { clearTimeout(timer); reject(Error('No se pudo ejecutar el asistente.')) })
      child.once('close', () => { clearTimeout(timer); reject(Error('El asistente terminó antes de preparar la autorización.')) })
      child.stdout.on('data', chunk => {
        stdout += chunk
        const match = stdout.match(/https:\/\/accounts\.google\.com\/[^\s]+/)
        if (match) { clearTimeout(timer); resolveUrl(new URL(match[0])) }
      })
    })
    assert.equal(url.origin, 'https://accounts.google.com')
    assert.equal(url.searchParams.get('code_challenge_method'), 'S256')
    assert.equal(url.searchParams.get('code_challenge')?.length, 43)
    assert.equal(url.searchParams.get('state')?.length, 43)
    assert.equal(url.searchParams.get('access_type'), 'offline')
    assert.equal(url.searchParams.get('include_granted_scopes'), 'false')
    assert.deepEqual(url.searchParams.get('scope')?.split(' '), ['openid', 'email', 'https://www.googleapis.com/auth/gmail.send'])
    const callback = new URL(url.searchParams.get('redirect_uri')!)
    assert.equal(callback.hostname, '127.0.0.1')
    callback.searchParams.set('state', 'sesion-ajena')
    assert.equal((await fetch(callback)).status, 400)
    assert.equal((await fetch(callback, { method: 'POST' })).status, 404)
    const foreignHostStatus = await new Promise<number | undefined>((resolveStatus, reject) => {
      const req = request(callback, { headers: { Host: 'evil.example.test' } }, response => { response.resume(); resolveStatus(response.statusCode) })
      req.on('error', reject)
      req.end()
    })
    assert.equal(foreignHostStatus, 404)
    await assert.rejects(readFile(output), { code: 'ENOENT' })
  } finally {
    child.kill('SIGTERM')
    await closed
  }
})
