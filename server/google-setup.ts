import { mkdirSync, writeFileSync } from 'node:fs'
import { validClientId } from './google-auth.ts'

const clientId = process.argv[2]?.trim() ?? ''
if (!validClientId(clientId)) throw new Error('Usa: npm run google:setup -- TU_ID.apps.googleusercontent.com (el ID de cliente web, sin contraseña ni secreto).')
mkdirSync('.local', { recursive: true })
writeFileSync('.local/google.json', JSON.stringify({ clientId }, null, 2) + '\n')
console.log('Identificador guardado solo en este equipo. Reinicia el servicio local para habilitar el botón de Google.')
