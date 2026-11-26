import test from 'node:test'
import assert from 'node:assert/strict'
import { gmailDelivery, validateGmailSettings, readMailSettings } from '../email-delivery.ts'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import type { AccountMail } from '../account-email.ts'
import type { RuntimeConfig } from '../runtime-config.ts'

const origin = 'https://cai.example.test'
const policy = { mode: 'production' as const, publicOrigin: origin, trustedProxy: 'loopback' as const }
const settings = { provider: 'gmail-api' as const, clientId: '12345-fixture.apps.googleusercontent.com', clientSecret: 'fictional-client-secret', refreshToken: 'fictional-refresh-token-for-tests', from: 'fixture@gmail.com', publicOrigin: origin }
const mail: AccountMail = { to: 'student@example.test', kind: 'activation', path: '/activar#token=' + 'a'.repeat(64), expiresAt: '2026-11-30T12:00:00Z' }

test('Gmail: valida configuración privada, origen y credenciales sin aceptarlas del navegador', async () => {
  assert.deepEqual(validateGmailSettings(settings, policy), settings)
  for (const change of [{ clientId: 'bad' }, { clientSecret: 'short' }, { refreshToken: 'x\r\nsecret' }, { from: 'a@gmail.com\r\nBcc:x@example.test' }, { publicOrigin: 'https://evil.example.test' }, { endpoint: 'https://evil.example.test' }, { scope: 'gmail.readonly' }]) assert.throws(() => validateGmailSettings({ ...settings, ...change }, policy))
  const parent = resolve('.local/tests'); await mkdir(parent, { recursive: true })
  const directory = await mkdtemp(join(parent, 'gmail-')), path = join(directory, 'mail.json')
  const config: RuntimeConfig = { policy, host: '127.0.0.1', port: 3100, databasePath: join(directory, 'cai.sqlite'), dataDirectory: directory, mailConfigPath: path }
  await writeFile(path, JSON.stringify(settings))
  assert.deepEqual(readMailSettings(config), settings)
})

test('Gmail: MIME completo por HTTPS, destinatario único y confirmación antes de dar por entregado', async () => {
  let calls = 0, credentials = 0
  const email = gmailDelivery(settings, { accessToken: async () => { credentials++; return 'fictional-access-token' }, request: async (url, init) => {
    calls++
    assert.equal(url, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send')
    assert.equal(init?.method, 'POST'); assert.equal(init?.redirect, 'error')
    assert.ok(init?.signal); assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer fictional-access-token')
    const raw = Buffer.from(JSON.parse(String(init?.body)).raw, 'base64url').toString('utf8')
    assert.match(raw, /From: CAI <fixture@gmail.com>/); assert.match(raw, /To: student@example.test/)
    assert.match(raw, /multipart\/alternative/); assert.match(raw, /Auto-Submitted: auto-generated/)
    assert.ok(!raw.includes(settings.refreshToken)); assert.ok(!raw.includes(settings.clientSecret)); assert.ok(!/\r\n(?:Bcc|Cc):/i.test(raw))
    assert.ok(raw.includes('https://cai.example.test/activar'))
    return Response.json({ id: 'fictional-message-id' })
  } })
  await email.deliver(mail); assert.equal(calls, 1)
  await assert.rejects(email.deliver({ ...mail, path: 'https://evil.example.test/' }))
  await assert.rejects(email.deliver({ ...mail, to: 'student@example.test\r\nBcc:x@example.test' }))
  assert.equal(calls, 1); assert.equal(credentials, 1)
  email.close()
})

test('Gmail: rechazos, respuestas inciertas y tokens vencidos no reenvían ni filtran secretos', async () => {
  for (const response of [new Response('sensitive-provider-body', { status: 401 }), Response.json({}), Response.json({ id: '' }), new Response('not-json')]) {
    let calls = 0
    const email = gmailDelivery(settings, { accessToken: async () => 'fixture', request: async () => { calls++; return response } })
    await assert.rejects(email.deliver(mail), error => { assert.ok(error instanceof Error); assert.ok(!error.message.includes('sensitive-provider-body')); return true })
    assert.equal(calls, 1)
  }
  let calls = 0
  const email = gmailDelivery(settings, { accessToken: async () => { throw Error(settings.refreshToken) }, request: async () => { calls++; return Response.json({ id: 'unused' }) } })
  await assert.rejects(email.deliver(mail), error => { assert.ok(error instanceof Error); assert.ok(!error.message.includes(settings.refreshToken)); return true })
  await assert.rejects(email.verify(), /comprobar la autorización/); assert.equal(calls, 0)
})
