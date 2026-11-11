import { randomBytes } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { hashPassword } from './auth.ts'
import { openDatabase } from './database.ts'

const db = openDatabase(resolve('.local/cai.sqlite'))
try {
  if (db.prepare('SELECT id FROM admin_users LIMIT 1').get()) {
    console.log('El administrador local ya existe. Se conservan su cuenta y la base de datos.')
  } else {
    const email = 'coordinacion@cai.local'
    const password = randomBytes(18).toString('base64url')
    const hash = await hashPassword(password)
    writeFileSync(resolve('.local/acceso-inicial.txt'), `ACCESO EXCLUSIVO PARA PRUEBAS LOCALES DE CAI\n\nCorreo: ${email}\nContraseña: ${password}\n\nEste archivo es privado y está excluido de Git. No lo compartas ni lo uses en producción.\n`, { flag: 'wx', mode: 0o600 })
    db.prepare("INSERT INTO admin_users(email, name, password_hash, role) VALUES (?, ?, ?, 'admin')").run(email, 'Coordinación', hash)
    console.log('Administrador local creado. Los datos de acceso están en .local/acceso-inicial.txt (excluido de Git).')
  }
} finally { db.close() }
