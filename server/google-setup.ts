import { mkdirSync, writeFileSync } from 'node:fs'
import { validClientId } from './google-auth.ts'

if (process.env.NODE_ENV === 'production') throw Error('google:setup configura pruebas locales. En producción usa GOOGLE_CLIENT_ID bajo control de CAI.')
const clientId = process.argv[2]?.trim() ?? ''
if (!validClientId(clientId)) throw new Error('Usa: npm run google:setup -- TU_ID.apps.googleusercontent.com (el ID de cliente web, sin contraseña ni secreto).')
mkdirSync('.local', { recursive: true })
writeFileSync('.local/google.json', JSON.stringify({ clientId }, null, 2) + '\n')
console.log('Identificador guardado solo en este equipo. Reinicia el servicio local para habilitar el botón de Google.')
