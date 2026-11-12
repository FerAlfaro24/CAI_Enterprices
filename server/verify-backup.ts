import { DatabaseSync } from 'node:sqlite'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { galleryLimits } from './contracts.ts'

/** Verifica una copia sin migrarla, restaurarla ni escribir sobre ella. No devuelve datos personales. */
export async function verifyLocalBackup(path: string) {
  const db = new DatabaseSync(path, { readOnly: true })
  try {
    const checks = db.prepare('PRAGMA quick_check').all()
    if (checks.length !== 1 || checks[0]?.quick_check !== 'ok') throw new Error('La copia no superó la comprobación de integridad de SQLite.')
    if (db.prepare('PRAGMA foreign_key_check').all().length) throw new Error('La copia contiene referencias incompletas.')
    const version = Number(db.prepare('SELECT MAX(version) AS n FROM migrations').get()!.n)
    if (![9,10].includes(version)) throw new Error('La versión de esta copia no corresponde a un esquema local compatible. No se modificó ni migró.')
    const counts = {
      requests: Number(db.prepare('SELECT COUNT(*) AS n FROM requests').get()!.n),
      students: Number(db.prepare('SELECT COUNT(*) AS n FROM students').get()!.n),
      accounts: Number(db.prepare('SELECT COUNT(*) AS n FROM student_accounts').get()!.n),
      posts: Number(db.prepare('SELECT COUNT(*) AS n FROM publications').get()!.n),
      images: 0,
    }
    for (const row of db.prepare('SELECT bytes,width,height,byte_size FROM gallery_images').iterate()) {
      const bytes = row.bytes as Uint8Array
      if (bytes.length !== Number(row.byte_size)) throw new Error('Una imagen de la copia está incompleta.')
      const image = sharp(bytes, { failOn: 'warning', limitInputPixels: galleryLimits.outputSide ** 2 })
      const metadata = await image.metadata()
      if (metadata.format !== 'webp' || metadata.width !== Number(row.width) || metadata.height !== Number(row.height)) throw new Error('Una imagen de la copia no coincide con su registro.')
      await image.timeout({ seconds: 8 }).stats()
      counts.images++
    }
    return { schema: version, ...counts }
  } finally { db.close() }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const path = process.argv[2]
    if (!path || resolve(path) === resolve('.local/cai.sqlite')) throw new Error('Indica la ruta de una copia de respaldo, no la base activa.')
    const result = await verifyLocalBackup(resolve(path))
    console.log('Copia comprobada en modo de solo lectura. No se restauraron ni modificaron datos.')
    console.log(JSON.stringify(result))
  } catch {
    console.error('No se pudo verificar la copia. Revisa la ruta, la integridad y la versión; conserva el original. No se restauraron datos.')
    process.exitCode = 1
  }
}
