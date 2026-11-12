/** Proveedor falso EXCLUSIVO de las pruebas del navegador. Nunca lo usa server/index.ts. */
import { createApplication } from '../app.ts'
import { hashPassword } from '../auth.ts'
import type { GoogleIdentity } from '../google-auth.ts'

if (process.env.NODE_ENV !== 'test') throw new Error('Este servidor ficticio solo se inicia con NODE_ENV=test.')
const { server, db } = createApplication(':memory:', {
  clientId: '123456-browserfixture.apps.googleusercontent.com',
  verify: async (credential) => {
    if (!credential.startsWith('fixture:')) throw new Error('Credencial de prueba no válida')
    return JSON.parse(credential.slice(8)) as GoogleIdentity
  },
})
db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('google-admin@example.test','Coordinación ficticia',?,'admin')").run(await hashPassword('Frase ficticia de pruebas Google 2026'))
server.listen(3102, '127.0.0.1', () => console.log('Servidor de pruebas Google en 127.0.0.1:3102. Base temporal en memoria; proveedor ficticio.'))
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => server.close())
