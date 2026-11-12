import { transaction, type Database } from './database.ts'
import { ageAt, HttpError, record } from './validation.ts'
import { queueNotice } from './notices.ts'
import { publicProfileId } from './public-profiles.ts'
import { publicationCategories, publicationLimits, type OwnPost, type PublicationDecision, type PublicationDraft, type PublicationStatus, type PublishedPost, type ReviewPost, type StudentUser, type Submission } from './contracts.ts'

type Row = {
  id: number; author_id: number; title: string; body: string; category: PublicationDraft['category']; status: PublicationStatus
  program: string; group_name: string; created_at: string; published_at: string | null; reason: string | null; revision: number
  payload: string; student_status: string | null; request_status: string
}
const select = `SELECT p.*, r.payload, r.status AS request_status, s.status AS student_status FROM publications p
  JOIN requests r ON r.id = p.author_id LEFT JOIN students s ON s.request_id = p.author_id`
const folio = (id: number) => `PUB-${String(id).padStart(4, '0')}`
function idOf(id: string, prefix: string) {
  if (!new RegExp(`^${prefix}-\\d{4,}$`).test(id) || !Number.isSafeInteger(Number(id.slice(4)))) throw new HttpError(404, 'No se encontró la publicación.')
  return Number(id.slice(4))
}
function field(value: unknown, label: string, min: number, max: number) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max || [...value].some((char) => char.charCodeAt(0) < 32 && ![9, 10, 13].includes(char.charCodeAt(0)))) throw new HttpError(400, `Revisa ${label}: debe tener entre ${min} y ${max} caracteres.`)
  return value.trim()
}
export function validatePublication(value: unknown): PublicationDraft {
  const data = record(value)
  if (Object.keys(data).some((key) => !['title', 'body', 'category'].includes(key))) throw new HttpError(400, 'La publicación contiene datos no admitidos.')
  if (typeof data.category !== 'string' || !Object.hasOwn(publicationCategories, data.category)) throw new HttpError(400, 'Elige Logro o Experiencia.')
  return { title: field(data.title, 'el título', publicationLimits.titleMin, publicationLimits.titleMax),
    body: field(data.body, 'el texto', publicationLimits.bodyMin, publicationLimits.bodyMax), category: data.category as PublicationDraft['category'] }
}
function publicPost(db: Database, row: Row): PublishedPost {
  const profile = JSON.parse(row.payload) as Submission
  return { id: folio(row.id), title: row.title, body: row.body, category: row.category,
    author: { id: publicProfileId(db, row.author_id), displayName: profile.displayName, avatarColor: profile.avatarColor }, createdAt: row.created_at, publishedAt: row.published_at }
}

export function publications(db: Database) {
  const ownPost = (row: Row): OwnPost => ({ ...publicPost(db, row), status: row.status, revision: row.revision, reason: row.reason })
  const audit = (id: number, action: string, admin: number | null, student: number | null) => db.prepare('INSERT INTO publication_audit(publication_id,admin_id,student_id,action,created_at) VALUES (?,?,?,?,?)').run(id, admin, student, action, new Date().toISOString())
  const activeProfile = (user: StudentUser) => {
    const row = db.prepare("SELECT r.payload FROM requests r JOIN students s ON s.request_id = r.id WHERE r.id = ? AND r.status = 'aprobada' AND s.status = 'activo'").get(idOf(user.id, 'CAI')) as { payload: string } | undefined
    if (!row) throw new HttpError(401, 'Tu acceso no está disponible. Consulta con CAI.')
    return JSON.parse(row.payload) as Submission
  }
  const available = (row: Row) => {
    const profile = JSON.parse(row.payload) as Submission
    return row.request_status === 'aprobada' && row.student_status === 'activo' && profile.group !== 'Por asignar' && profile.program === row.program && profile.group === row.group_name
  }
  return {
    create(user: StudentUser, draft: PublicationDraft, key: string): OwnPost {
      return transaction(db, () => {
        const profile = activeProfile(user)
        if (profile.group === 'Por asignar') throw new HttpError(409, 'CAI debe asignarte un grupo antes de que envíes publicaciones.')
        const author = idOf(user.id, 'CAI')
        const existing = db.prepare(`${select} WHERE p.author_id = ? AND p.idempotency_key = ?`).get(author, key) as Row | undefined
        if (existing) {
          if (existing.title !== draft.title || existing.body !== draft.body || existing.category !== draft.category) throw new HttpError(409, 'Este envío ya se recibió con otros datos. Actualiza tus publicaciones antes de continuar.')
          return ownPost(existing)
        }
        const result = db.prepare('INSERT INTO publications(author_id,idempotency_key,title,body,category,program,group_name,created_at) VALUES (?,?,?,?,?,?,?,?)').run(author, key, draft.title, draft.body, draft.category, profile.program, profile.group, new Date().toISOString())
        const id = Number(result.lastInsertRowid)
        audit(id, 'publication.submitted', null, author)
        return ownPost(db.prepare(`${select} WHERE p.id = ?`).get(id) as Row)
      })
    },
    feed(user: StudentUser): PublishedPost[] {
      const profile = activeProfile(user)
      if (profile.group === 'Por asignar') return []
      return (db.prepare(`${select} WHERE p.status = 'publicada' AND p.program = ? AND p.group_name = ? ORDER BY p.published_at DESC, p.id DESC`).all(profile.program, profile.group) as Row[]).filter(available).map(row => publicPost(db, row))
    },
    mine(user: StudentUser): OwnPost[] {
      activeProfile(user)
      return (db.prepare(`${select} WHERE p.author_id = ? ORDER BY p.id DESC`).all(idOf(user.id, 'CAI')) as Row[]).map(ownPost)
    },
    withdraw(user: StudentUser, id: string, revision: number) {
      transaction(db, () => {
        activeProfile(user)
        const author = idOf(user.id, 'CAI')
        const row = db.prepare(`${select} WHERE p.id = ? AND p.author_id = ?`).get(idOf(id, 'PUB'), author) as Row | undefined
        if (!row) throw new HttpError(404, 'No se encontró la publicación.')
        if (row.revision !== revision || row.status === 'retirada') throw new HttpError(409, 'La publicación cambió. Actualiza tus publicaciones antes de continuar.')
        db.prepare("UPDATE publications SET status = 'retirada', reason = NULL, published_at = NULL, revision = revision + 1 WHERE id = ?").run(row.id)
        audit(row.id, 'publication.withdrawn', null, author)
      })
    },
    review(): ReviewPost[] {
      return (db.prepare(`${select} ORDER BY p.id DESC`).all() as Row[]).map((row) => {
        const profile = JSON.parse(row.payload) as Submission
        return { ...ownPost(row), studentId: `CAI-${String(row.author_id).padStart(4, '0')}`, studentName: `${profile.firstName} ${profile.lastName}`,
          program: row.program, group: row.group_name, authorActive: available(row), authorIsMinor: ageAt(profile.birthDate) < 18 }
      })
    },
    decide(id: string, revision: number, decision: PublicationDecision, admin: number, reason?: unknown, confirmed?: unknown) {
      transaction(db, () => {
        const row = db.prepare(`${select} WHERE p.id = ?`).get(idOf(id, 'PUB')) as Row | undefined
        if (!row) throw new HttpError(404, 'No se encontró la publicación.')
        if (row.revision !== revision) throw new HttpError(409, 'Otra persona revisó esta publicación. Actualiza antes de decidir.')
        if (row.status === 'retirada') throw new HttpError(409, 'El alumno retiró esta publicación. No se puede volver a publicar.')
        if (decision === 'undo' ? row.status === 'pendiente' : row.status !== 'pendiente') throw new HttpError(409, 'El estado de la publicación cambió. Actualiza antes de decidir.')
        if (decision === 'approve') {
          if (!available(row)) throw new HttpError(409, 'El autor debe tener acceso activo y conservar el programa y grupo de esta publicación.')
          if (confirmed !== true) throw new HttpError(400, 'Confirma que revisaste el contenido y la privacidad antes de publicar.')
        }
        const explanation = decision === 'reject' ? field(reason, 'el motivo del rechazo', 5, 240) : null
        db.prepare('UPDATE publications SET status = ?, reason = ?, published_at = ?, revision = revision + 1 WHERE id = ?').run(decision === 'approve' ? 'publicada' : decision === 'reject' ? 'rechazada' : 'pendiente', explanation, decision === 'approve' ? new Date().toISOString() : null, row.id)
        audit(row.id, `publication.${decision}`, admin, null)
        queueNotice(db, row.author_id, 'Revisión de tu publicación', 'CAI actualizó la revisión de una publicación. Entra en Mis publicaciones para consultar su estado y las indicaciones.')
      })
    },
  }
}
