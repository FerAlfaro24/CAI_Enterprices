import { contactPrograms } from '../src/features/landing/data/content.ts'
import type { ContactInquiry, ContactReceipt, ContactStatus, ContactSubmission } from './contracts.ts'
import { transaction, type Database } from './database.ts'
import { administrationAudit } from './administration.ts'
import { HttpError, record, revisionOf } from './validation.ts'

type Row = { id: number; payload: string; status: ContactStatus; note: string; revision: number; created_at: string; updated_at: string }
const folio = (id: number) => `CON-${String(id).padStart(4, '0')}`
function text(value: unknown, min: number, max: number, label: string, multiline = false) {
  if (typeof value !== 'string') throw new HttpError(400, `Revisa ${label}.`)
  const invalidControl = [...value].some(char => {
    const code = char.charCodeAt(0)
    return code < 32 && (!multiline || ![9,10,13].includes(code))
  })
  if (value.trim().length < min || value.trim().length > max || invalidControl) throw new HttpError(400, `Revisa ${label}.`)
  return value.trim()
}
export function validateContact(value: unknown): ContactSubmission {
  const data = record(value)
  if (Object.keys(data).some(key => !['name', 'contact', 'program', 'consent'].includes(key))) throw new HttpError(400, 'La consulta contiene datos no admitidos.')
  const name = text(data.name, 2, 80, 'el nombre'), contact = text(data.contact, 5, 120, 'el correo o teléfono')
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
  const phone = /^[+\d\s().-]+$/.test(contact) && /^\d{10,15}$/.test(contact.replace(/\D/g, ''))
  if (!email && !phone) throw new HttpError(400, 'Escribe un correo válido o un teléfono de 10 a 15 dígitos.')
  if (typeof data.program !== 'string' || !contactPrograms.some(program => program.id === data.program)) throw new HttpError(400, 'Selecciona un programa de interés.')
  if (data.consent !== true) throw new HttpError(400, 'Confirma que CAI puede usar los datos para atender tu consulta.')
  return { name, contact, program: data.program, consent: true }
}
export function contactRepository(db: Database) {
  return {
    submit(submission: ContactSubmission, key: string): ContactReceipt {
      return transaction(db, () => {
        const payload = JSON.stringify(submission)
        const existing = db.prepare('SELECT id,payload,created_at FROM contact_inquiries WHERE idempotency_key = ?').get(key) as Row | undefined
        if (existing) {
          if (existing.payload !== payload) throw new HttpError(409, 'Ese envío ya se recibió con otros datos. Actualiza el formulario antes de continuar.')
          return { id: folio(existing.id), createdAt: existing.created_at }
        }
        const createdAt = new Date().toISOString()
        const id = Number(db.prepare('INSERT INTO contact_inquiries(idempotency_key,payload,created_at,updated_at) VALUES (?,?,?,?)').run(key, payload, createdAt, createdAt).lastInsertRowid)
        return { id: folio(id), createdAt }
      })
    },
    list(): ContactInquiry[] {
      return (db.prepare('SELECT * FROM contact_inquiries ORDER BY id DESC').all() as Row[]).map(row => ({ ...JSON.parse(row.payload) as ContactSubmission, id: folio(row.id), status: row.status, note: row.note, revision: row.revision, createdAt: row.created_at, updatedAt: row.updated_at }))
    },
    update(id: string, value: unknown, actor: number) {
      if (!/^CON-\d{4,}$/.test(id) || !Number.isSafeInteger(Number(id.slice(4)))) throw new HttpError(404, 'No se encontró la consulta.')
      const data = record(value), revision = revisionOf(data.revision)
      if (Object.keys(data).some(key => !['revision', 'status', 'note'].includes(key)) || typeof data.status !== 'string' || !['nueva', 'seguimiento', 'atendida'].includes(data.status)) throw new HttpError(400, 'Revisa el estado de la consulta.')
      const note = text(data.note, 0, 500, 'la nota interna', true)
      transaction(db, () => {
        const row = db.prepare('SELECT revision FROM contact_inquiries WHERE id = ?').get(Number(id.slice(4)))
        if (!row) throw new HttpError(404, 'No se encontró la consulta.')
        if (row.revision !== revision) throw new HttpError(409, 'La consulta cambió en otra ventana. Actualiza antes de guardar.')
        db.prepare('UPDATE contact_inquiries SET status = ?, note = ?, revision = revision + 1, updated_at = ? WHERE id = ?').run(String(data.status), note, new Date().toISOString(), Number(id.slice(4)))
        // La auditoría no duplica datos de contacto ni notas privadas.
        administrationAudit(db, actor, 'contact.updated', { id, status: data.status })
      })
    },
  }
}
