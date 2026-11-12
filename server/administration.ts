import type { CatalogGroup, CommunityControls, PublicCatalog } from './contracts.ts'
import { transaction, type Database } from './database.ts'
import { HttpError, record, revisionOf } from './validation.ts'

function label(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length < 2 || value.trim().length > 100 || [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) throw new HttpError(400, `Revisa ${field}: usa de 2 a 100 caracteres.`)
  return value.trim()
}

export function administrationAudit(db: Database, actor: number, kind: string, details: unknown) {
  db.prepare('INSERT INTO administration_audit(actor_id,kind,details,created_at) VALUES (?,?,?,?)').run(actor, kind, JSON.stringify(details), new Date().toISOString())
}

export function administration(db: Database) {
  const settings = (): CommunityControls => {
    const row = db.prepare('SELECT * FROM community_controls WHERE id = 1').get()!
    return { registrationOpen: row.registration_open === 1, submissionsOpen: row.submissions_open === 1, revision: Number(row.revision) }
  }
  const groups = (): CatalogGroup[] => db.prepare('SELECT * FROM course_groups ORDER BY program, name').all().map(row => ({ id: Number(row.id), program: String(row.program), name: String(row.name), active: row.active === 1, revision: Number(row.revision) }))
  return {
    settings, groups,
    publicCatalog(): PublicCatalog {
      const { registrationOpen, submissionsOpen } = settings()
      return { groups: groups().filter(group => group.active).map(({ id, program, name }) => ({ id, program, name })), settings: { registrationOpen, submissionsOpen } }
    },
    updateSettings(value: unknown, actor: number) {
      const data = record(value), revision = revisionOf(data.revision)
      if (Object.keys(data).some(key => !['revision', 'registrationOpen', 'submissionsOpen'].includes(key)) || typeof data.registrationOpen !== 'boolean' || typeof data.submissionsOpen !== 'boolean') throw new HttpError(400, 'Revisa los ajustes de solicitudes y publicaciones.')
      transaction(db, () => {
        if (settings().revision !== revision) throw new HttpError(409, 'La configuración cambió en otra ventana. Actualiza antes de guardar.')
        db.prepare('UPDATE community_controls SET registration_open = ?, submissions_open = ?, revision = revision + 1 WHERE id = 1').run(Number(data.registrationOpen), Number(data.submissionsOpen))
        administrationAudit(db, actor, 'settings.updated', { registrationOpen: data.registrationOpen, submissionsOpen: data.submissionsOpen })
      })
    },
    createGroup(value: unknown, actor: number) {
      const data = record(value)
      if (Object.keys(data).some(key => !['program', 'name'].includes(key))) throw new HttpError(400, 'El grupo contiene datos no admitidos.')
      const program = label(data.program, 'el programa'), name = label(data.name, 'el grupo')
      if (name === 'Por asignar') throw new HttpError(400, 'Usa un nombre de grupo u horario; Por asignar se reserva para alumnos sin grupo.')
      return transaction(db, () => {
        if (db.prepare('SELECT id FROM course_groups WHERE lower(program) = lower(?) AND lower(name) = lower(?)').get(program, name)) throw new HttpError(409, 'Ese grupo ya existe. Puedes reactivarlo si está archivado.')
        const id = Number(db.prepare('INSERT INTO course_groups(program,name) VALUES (?,?)').run(program, name).lastInsertRowid)
        administrationAudit(db, actor, 'group.created', { id, program, name })
        return id
      })
    },
    updateGroup(id: number, value: unknown, actor: number) {
      const data = record(value), revision = revisionOf(data.revision)
      if (Object.keys(data).some(key => !['revision', 'active'].includes(key)) || typeof data.active !== 'boolean') throw new HttpError(400, 'Revisa el estado del grupo.')
      transaction(db, () => {
        const group = groups().find(group => group.id === id)
        if (!group) throw new HttpError(404, 'No se encontró el grupo.')
        if (group.revision !== revision) throw new HttpError(409, 'El grupo cambió en otra ventana. Actualiza antes de guardar.')
        if (group.active === data.active) throw new HttpError(409, 'El grupo ya tiene ese estado.')
        db.prepare('UPDATE course_groups SET active = ?, revision = revision + 1 WHERE id = ?').run(Number(data.active), id)
        administrationAudit(db, actor, 'group.updated', { id, active: data.active })
      })
    },
  }
}
