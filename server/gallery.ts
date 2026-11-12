import sharp, { type OutputInfo } from 'sharp'
import { createHash, randomUUID } from 'node:crypto'
import { administration, administrationAudit } from './administration.ts'
import { transaction, type Database } from './database.ts'
import { galleryCategories, galleryLimits, type GalleryItem, type GalleryReview, type GalleryUpload, type StudentUser } from './contracts.ts'
import { HttpError, record, revisionOf } from './validation.ts'

type Row = {
  id: string; title: string; description: string; category: GalleryItem['category']; alt: string; program: string; group_name: string
  authorization_reference: string; revision: number; withdrawn_at: string | null; created_at: string; width: number; height: number; byte_size: number; fingerprint: string
}
const columns = 'id,title,description,category,alt,program,group_name,authorization_reference,revision,withdrawn_at,created_at,width,height,byte_size,fingerprint'
const dto = (row: Row): GalleryItem => ({ id: row.id, title: row.title, description: row.description, category: row.category, alt: row.alt, width: row.width, height: row.height, byteSize: row.byte_size, createdAt: row.created_at, imagePath: `/api/local/gallery/${row.id}/image` })
const review = (row: Row): GalleryReview => ({ ...dto(row), program: row.program, group: row.group_name, authorizationReference: row.authorization_reference, revision: row.revision, status: row.withdrawn_at ? 'retirada' : 'publicada' })
function text(value: unknown, name: string, min: number, max: number) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max || [...value].some(char => char.charCodeAt(0) < 32)) throw new HttpError(400, `Revisa ${name}: de ${min} a ${max} caracteres.`)
  return value.trim()
}
function draft(value: unknown) {
  const data = record(value)
  if (Object.keys(data).some(key => !['title','description','category','alt','program','group','authorizationReference','confirmed','imageBase64'].includes(key))) throw new HttpError(400, 'La imagen contiene datos no admitidos.')
  if (data.confirmed !== true) throw new HttpError(400, 'Confirma que revisaste la imagen, sus permisos y el grupo destinatario.')
  if (typeof data.category !== 'string' || !Object.hasOwn(galleryCategories, data.category)) throw new HttpError(400, 'Elige una categoría de galería.')
  if (typeof data.imageBase64 !== 'string' || !data.imageBase64.length || data.imageBase64.length % 4 !== 0 || data.imageBase64.length > Math.ceil(galleryLimits.uploadBytes / 3) * 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data.imageBase64)) throw new HttpError(400, 'El archivo debe ser JPEG o PNG de hasta 3 MB.')
  const bytes = Buffer.from(data.imageBase64, 'base64')
  if (!bytes.length || bytes.length > galleryLimits.uploadBytes || bytes.toString('base64') !== data.imageBase64) throw new HttpError(400, 'No se pudo leer el archivo. El límite es 3 MB.')
  const metadata = { title: text(data.title,'el título',4,100), description: text(data.description,'la descripción',10,500), category: data.category as GalleryUpload['category'], alt: text(data.alt,'el texto alternativo',5,240), program: text(data.program,'el programa',2,100), group: text(data.group,'el grupo',2,100), authorizationReference: text(data.authorizationReference,'la referencia de autorización',8,240) }
  const fingerprint = createHash('sha256').update(JSON.stringify(metadata)).update(bytes).digest('hex')
  return { metadata, bytes, fingerprint }
}

/** Guarda solo la versión procesada: sin rutas públicas, originales ni metadatos EXIF. */
export function galleryRepository(db: Database) {
  let inFlight = 0
  const current = (id: string) => db.prepare(`SELECT ${columns} FROM gallery_images WHERE id = ?`).get(id) as Row | undefined
  const existing = (key: string, fingerprint: string) => {
    const row = db.prepare(`SELECT ${columns} FROM gallery_images WHERE idempotency_key = ?`).get(key) as Row | undefined
    if (row && row.fingerprint !== fingerprint) throw new HttpError(409, 'Ese envío ya se recibió con otra imagen o datos. Actualiza antes de continuar.')
    return row
  }
  return {
    async create(value: unknown, key: string, actor: () => number | null): Promise<GalleryReview> {
      if (!actor()) throw new HttpError(401, 'Vuelve a entrar a administración.')
      const { metadata, bytes, fingerprint } = draft(value)
      const found = existing(key, fingerprint)
      if (found) return review(found)
      if (inFlight >= 2) throw new HttpError(429, 'Hay imágenes procesándose. Espera unos segundos y vuelve a intentar.')
      inFlight++
      try {
        let output: { data: Buffer; info: OutputInfo }
        // Decodificar realmente el formato y recodificar; nunca servir el archivo recibido.
        const image = sharp(bytes, { failOn: 'warning', limitInputPixels: galleryLimits.inputPixels, animated: false })
        const info = await image.metadata().catch(() => { throw new HttpError(400, 'El archivo no es una imagen JPEG o PNG válida.') })
        if (!['jpeg','png'].includes(info.format ?? '') || (info.pages ?? 1) !== 1) throw new HttpError(400, 'Solo se admiten JPEG y PNG estáticos, hasta 12 millones de píxeles.')
        try { output = await image.rotate().resize({ width: galleryLimits.outputSide, height: galleryLimits.outputSide, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).timeout({ seconds: 8 }).toBuffer({ resolveWithObject: true }) }
        catch { throw new HttpError(400, 'No pudimos procesar la imagen. Revisa que esté completa y dentro de los límites.') }
        return transaction(db, () => {
          const admin = actor()
          if (!admin) throw new HttpError(401, 'Tu sesión terminó mientras se procesaba la imagen. Vuelve a entrar.')
          const repeated = existing(key, fingerprint)
          if (repeated) return review(repeated)
          if (metadata.group === 'Por asignar' || !administration(db).groups().some(group => group.active && group.program === metadata.program && group.name === metadata.group)) throw new HttpError(400, 'Elige un programa y grupo activo del catálogo.')
          const used = Number(db.prepare('SELECT COALESCE(SUM(byte_size),0) AS n FROM gallery_images').get()!.n)
          if (used + output.data.length > galleryLimits.totalBytes) throw new HttpError(409, 'Se alcanzó el límite de almacenamiento local de imágenes. Consulta la configuración de entrega antes de añadir más.')
          const id = randomUUID(), created = new Date().toISOString()
          db.prepare('INSERT INTO gallery_images(id,idempotency_key,fingerprint,title,description,category,alt,program,group_name,authorization_reference,created_by,created_at,bytes,width,height,byte_size) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,key,fingerprint,metadata.title,metadata.description,metadata.category,metadata.alt,metadata.program,metadata.group,metadata.authorizationReference,admin,created,output.data,output.info.width,output.info.height,output.data.length)
          administrationAudit(db,admin,'gallery.published',{id,program:metadata.program,group:metadata.group})
          return review(current(id)!)
        })
      } finally { inFlight-- }
    },
    list(): GalleryReview[] { return (db.prepare(`SELECT ${columns} FROM gallery_images ORDER BY created_at DESC,id DESC`).all() as Row[]).map(review) },
    forStudent(user: StudentUser): GalleryItem[] {
      if (user.group === 'Por asignar') return []
      return (db.prepare(`SELECT ${columns} FROM gallery_images WHERE withdrawn_at IS NULL AND program = ? AND group_name = ? ORDER BY created_at DESC,id DESC`).all(user.program,user.group) as Row[]).map(dto)
    },
    image(id: string, user: StudentUser | null, admin: boolean) {
      const row = current(id)
      if (!row || row.withdrawn_at || (!admin && (!user || user.group === 'Por asignar' || row.program !== user.program || row.group_name !== user.group))) throw new HttpError(404, 'No se encontró la imagen o no está disponible para tu grupo.')
      return (db.prepare('SELECT bytes FROM gallery_images WHERE id = ?').get(id) as { bytes: Uint8Array }).bytes
    },
    withdraw(id: string, value: unknown, admin: number) {
      const data = record(value), revision = revisionOf(data.revision)
      if (Object.keys(data).some(key => !['revision','confirmed'].includes(key)) || data.confirmed !== true) throw new HttpError(400, 'Confirma la retirada de la imagen.')
      transaction(db, () => {
        const row = current(id)
        if (!row) throw new HttpError(404, 'No se encontró la imagen.')
        if (row.revision !== revision || row.withdrawn_at) throw new HttpError(409, 'La imagen cambió o ya fue retirada. Actualiza la galería.')
        db.prepare('UPDATE gallery_images SET withdrawn_at = ?, revision = revision + 1 WHERE id = ?').run(new Date().toISOString(),id)
        administrationAudit(db,admin,'gallery.withdrawn',{id})
      })
    },
  }
}
