import nodemailer from 'nodemailer'
import MailComposer from 'nodemailer/lib/mail-composer/index.js'
import { OAuth2Client } from 'google-auth-library'
import { lstatSync, readFileSync, realpathSync } from 'node:fs'
import { isAbsolute } from 'node:path'
import { isWithin, productionPolicy, type RuntimeConfig } from './runtime-config.ts'
import { validClientId } from './google-auth.ts'
import type { AccountMail, AccountMailDelivery } from './account-email.ts'

export type SmtpSettings = { host: string; port: 465 | 587; user: string; password: string; from: string; publicOrigin: string }
export type GmailSettings = { provider: 'gmail-api'; clientId: string; clientSecret: string; refreshToken: string; from: string; publicOrigin: string }
export type MailSettings = SmtpSettings | GmailSettings
const address = (value: unknown): value is string => typeof value === 'string' && value.length <= 160 && /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,}$/i.test(value)

export function validateMailSettings(value: unknown, policy: RuntimeConfig['policy']): SmtpSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Revisa la configuración privada de correo.')
  const data = value as Record<string, unknown>
  if (Object.keys(data).some(key => !['host','port','user','password','from','publicOrigin'].includes(key)) ||
    typeof data.host !== 'string' || data.host.length > 253 || !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i.test(data.host) ||
    ![465,587].includes(Number(data.port)) || typeof data.port !== 'number' || !address(data.user) || !address(data.from) ||
    typeof data.password !== 'string' || data.password.length < 8 || data.password.length > 2048 || /[\r\n\0]/.test(data.password) || typeof data.publicOrigin !== 'string') throw Error('Revisa servidor, puerto seguro, remitente y credencial de correo; no se mostraron sus valores.')
  let origin: URL
  try { origin = new URL(data.publicOrigin) } catch { throw Error('El correo necesita un origen fijo autorizado.') }
  const local = policy.mode === 'local' && /^http:\/\/localhost:\d+$/.test(data.publicOrigin)
  if (!local) productionPolicy(data.publicOrigin)
  if (policy.mode === 'production' && data.publicOrigin !== policy.publicOrigin) throw Error('El origen de los correos debe coincidir con CAI_PUBLIC_ORIGIN.')
  if (origin.origin !== data.publicOrigin) throw Error('Configura solo el origen, sin ruta, consulta o fragmento.')
  return data as SmtpSettings
}

export function validateGmailSettings(value: unknown, policy: RuntimeConfig['policy']): GmailSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Revisa la configuración privada de Gmail.')
  const data = value as Record<string, unknown>
  const credential = (key: string, min: number, max: number) => typeof data[key] === 'string' && data[key].length >= min && data[key].length <= max && !/[\s\0]/.test(data[key])
  if (Object.keys(data).some(key => !['provider', 'clientId', 'clientSecret', 'refreshToken', 'from', 'publicOrigin'].includes(key)) ||
      data.provider !== 'gmail-api' || typeof data.clientId !== 'string' || !validClientId(data.clientId) ||
      !credential('clientSecret', 10, 1024) || !credential('refreshToken', 20, 4096) ||
      !address(data.from) || !/^[^@]+@gmail\.com$/i.test(data.from) || typeof data.publicOrigin !== 'string') throw Error('Revisa la configuración privada de Gmail; no se mostraron credenciales.')
  const origin = data.publicOrigin
  const local = policy.mode === 'local' && /^http:\/\/localhost:\d+$/.test(origin)
  if (!local) productionPolicy(origin)
  if (new URL(origin).origin !== origin || policy.mode === 'production' && origin !== policy.publicOrigin) throw Error('El origen de Gmail debe coincidir con el de CAI.')
  return data as GmailSettings
}

export function readMailSettings(config: RuntimeConfig): MailSettings | undefined {
  if (!config.mailConfigPath) return
  try {
    const path = config.mailConfigPath, stat = lstatSync(path)
    if (!isAbsolute(path) || !stat.isFile() || stat.isSymbolicLink() || stat.size > 8192 ||
      !isWithin(realpathSync(config.dataDirectory), realpathSync(path))) throw Error('unsafe-file')
    const data = JSON.parse(readFileSync(path, 'utf8'))
    return data?.provider === 'gmail-api' ? validateGmailSettings(data, config.policy) : validateMailSettings(data, config.policy)
  } catch { throw Error('CAI_MAIL_CONFIG debe apuntar a un archivo JSON privado válido dentro del directorio de datos; no se mostraron credenciales.') }
}

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]!)
export function accountEmailContent(message: AccountMail, origin: string) {
  const prefix = message.kind === 'activation' ? '/activar#token=' : message.kind === 'recovery' ? '/recuperar#token=' : message.kind === 'admin-recovery' ? '/recuperar-administracion#token=' : null
  if (prefix ? !message.path.startsWith(prefix) || !/^[a-f0-9]{64}$/.test(message.path.slice(prefix.length)) : message.path !== '/login') throw Error('Enlace de cuenta no permitido.')
  const url = new URL(message.path, origin)
  if (url.origin !== origin || !address(message.to) || !Number.isFinite(Date.parse(message.expiresAt))) throw Error('Mensaje de cuenta inválido.')
  const activation = message.kind === 'activation', google = message.kind === 'google-approved'
  const subject = activation || google ? 'Tu solicitud de CAI fue aprobada' : 'Recupera tu acceso a CAI'
  const title = activation ? '¡Bienvenido a CAI!' : google ? 'Tu comunidad te espera' : 'Vuelve a tu espacio CAI'
  const explanation = activation ? 'Coordinación aprobó tu solicitud. Elige tu contraseña para entrar a la comunidad.' : google ? 'Coordinación aprobó tu solicitud. Entra con la misma cuenta de Google que usaste para registrarte.' : 'Recibimos una solicitud para cambiar tu contraseña de CAI. Si no fuiste tú, ignora este correo: tu contraseña sigue igual.'
  const button = activation ? 'Activar mi cuenta' : google ? 'Entrar con Google' : 'Elegir nueva contraseña'
  const expiry = google ? '' : `Este enlace es privado y de un solo uso. Vence el ${new Intl.DateTimeFormat('es-MX', { dateStyle:'medium',timeStyle:'short',timeZone:'America/Mexico_City' }).format(new Date(message.expiresAt))}, hora de Ciudad de México.`
  return { subject, text: `${title}\n\n${explanation}\n\n${button}: ${url.href}\n\n${expiry}\n\nCAI · El inglés nos conecta`,
    html: `<div lang="es" style="font-family:Arial,sans-serif;color:#142746;max-width:560px;margin:auto;padding:28px"><p style="font-weight:bold">CAI · El inglés nos conecta</p><h1>${escapeHtml(title)}</h1><p style="line-height:1.6">${escapeHtml(explanation)}</p><p style="padding:16px 0"><a href="${escapeHtml(url.href)}" style="background:#2055d9;color:white;padding:14px 22px;border-radius:12px;text-decoration:none;display:inline-block">${escapeHtml(button)}</a></p><p>${escapeHtml(expiry)}</p><p>Si el botón no abre, copia este enlace en tu navegador:</p><p style="overflow-wrap:anywhere">${escapeHtml(url.href)}</p></div>` }
}

export function smtpDelivery(settings: SmtpSettings) {
  const transport = nodemailer.createTransport({ host: settings.host, port: settings.port, secure: settings.port === 465, requireTLS: true,
    auth: { user: settings.user, pass: settings.password }, tls: { minVersion:'TLSv1.2', rejectUnauthorized:true },
    connectionTimeout: 15_000, greetingTimeout: 10_000, socketTimeout: 20_000, logger:false, debug:false,
    disableFileAccess:true, disableUrlAccess:true })
  const deliver: AccountMailDelivery = async message => {
    const content = accountEmailContent(message, settings.publicOrigin)
    const result = await transport.sendMail({ from: { name:'CAI',address:settings.from }, to:message.to, ...content,
      disableFileAccess:true, disableUrlAccess:true, headers: { 'Auto-Submitted':'auto-generated' } })
    if (!result.accepted.some(item => String(item).toLowerCase() === message.to.toLowerCase()) || result.rejected.length) throw Error('El servicio de correo no aceptó al destinatario.')
  }
  return { deliver, verify: () => transport.verify(), close: () => transport.close() }
}

/** Gmail por HTTPS: solo envío, sin leer el buzón y sin reintentos automáticos del POST. */
export function gmailDelivery(settings: GmailSettings, dependencies: { accessToken?: () => Promise<string>; request?: typeof fetch } = {}) {
  const client = new OAuth2Client({ clientId: settings.clientId, clientSecret: settings.clientSecret })
  client.setCredentials({ refresh_token: settings.refreshToken })
  const accessToken = dependencies.accessToken ?? (async () => {
    const result = await client.getAccessToken()
    if (!result.token) throw Error('Gmail no concedió acceso de envío.')
    return result.token
  })
  const request = dependencies.request ?? fetch
  const deliver: AccountMailDelivery = async message => {
    // Validar destino/enlace antes de pedir credenciales o realizar una solicitud.
    const content = accountEmailContent(message, settings.publicOrigin)
    try {
      const mime = await new MailComposer({ from: { name: 'CAI', address: settings.from }, to: message.to,
        ...content, headers: { 'Auto-Submitted': 'auto-generated' }, disableFileAccess: true, disableUrlAccess: true }).compile().build()
      const token = await accessToken()
      const response = await request('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: mime.toString('base64url') }), redirect: 'error', signal: AbortSignal.timeout(20_000),
      })
      if (!response.ok) { await response.body?.cancel(); throw Error('delivery-rejected') }
      const result: unknown = await response.json()
      if (!result || typeof result !== 'object' || !('id' in result) || typeof result.id !== 'string' || !result.id) throw Error('unconfirmed-delivery')
    } catch { throw Error('Gmail no confirmó el envío. Revisa la autorización privada y reintenta desde coordinación; no se mostraron credenciales.') }
  }
  return { deliver, verify: async () => { try { await accessToken(); return true } catch { throw Error('No se pudo comprobar la autorización de Gmail.') } }, close: () => {} }
}

export const mailDelivery = (settings: MailSettings) => 'provider' in settings ? gmailDelivery(settings) : smtpDelivery(settings)
