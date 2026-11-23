/** Synthetic tasks for the administrator acceptance walkthrough. */
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { writeFile } from 'node:fs/promises'
import sharp from 'sharp'
import type { Database } from '../database.ts'
import type { StudentUser } from '../contracts.ts'
import { accessRepository } from '../access-repository.ts'
import { validateSubmission } from '../validation.ts'
import { publications } from '../publications.ts'
import { learningRepository } from '../learning.ts'
import { commentsRepository } from '../comments.ts'
import { contactRepository } from '../contact.ts'
import { contactPrograms } from '../../src/features/landing/data/content.ts'

export async function seedAdminUsability(db: Database, user: StudentUser, admin: number, directory: string) {
  const access = accessRepository(db)
  const profile = { firstName: 'Ángela', lastName: 'Revisión', birthDate: '2000-01-01', filledBy: 'alumno', program: 'Business English', group: 'Viernes · 18:00', displayName: 'Ángela R.', avatarColor: '#1f56d6', visibility: 'privado', message: 'Solicitud ficticia para probar la administración.', guardianConsent: false, acceptRules: true, acceptPrivacy: true }
  const create = (name: string, email: string, extra = {}) => access.submit(validateSubmission({ ...profile, firstName: name, email, ...extra }), randomUUID()).id
  const approve = create('Ángela', 'qa-approve@example.test')
  const reject = create('Roberto', 'qa-reject@example.test')
  const minor = create('Mariana', 'qa-minor@example.test', { birthDate: `${new Date().getFullYear() - 14}-01-01`, guardianConsent: true, guardian: { name: 'Tutor Ficticio', relationship: 'Madre', contact: 'tutor@example.test' }, displayName: 'Mariana R.' })
  const activate = create('Paula', 'qa-activate@example.test')
  access.decide(activate, 1, 'approve', admin)
  const suspended = create('Samuel', 'qa-suspended@example.test')
  access.decide(suspended, 1, 'approve', admin)
  access.setStudentStatus(suspended, 1, 'suspendido', admin)
  const post = publications(db).create(user, { title: 'Historia pendiente para coordinación', body: 'Un texto ficticio de aprendizaje para revisar, aprobar y comprobar desde la comunidad.', category: 'experience' }, randomUUID())
  const imagePath = join(directory, 'admin-synthetic.png')
  const bytes = await sharp({ create: { width: 240, height: 160, channels: 3, background: '#1f56d6' } }).png().toBuffer()
  await writeFile(imagePath, bytes, { flag: 'wx' })
  const learning = learningRepository(db)
  const achievements = []
  for (const share of [false, true]) {
    const item = await learning.save(user, null, { category: 'reading', title: share ? 'Lectura con fotos para publicar' : 'Lectura privada para validar', practice: 'Leí un cuento en inglés y practiqué una expresión para pedir ayuda.', expression: 'give me a hand', example: 'Can you give me a hand with this book?', state: 'completed', images: [{ data: 'data:image/png;base64,' + bytes.toString('base64') }] }, randomUUID(), () => true)
    achievements.push(learning.submit(user, item.id, { revision: item.revision, share, confirmed: true }))
  }
  const official = publications(db).institutional().find(item => item.kind === 'album')!
  const comment = commentsRepository(db).create(user, official.id, { body: 'Comentario ficticio pendiente para comprobar la revisión.' }, randomUUID())
  const contact = contactRepository(db).submit({ name: 'Consulta ficticia de coordinación', contact: 'consulta@example.test', program: contactPrograms[0]!.id, consent: true }, randomUUID())
  return { approve, reject, minor, activate, suspended, post: post.id, achievements: achievements.map(item => ({ id: item.id, publication: item.publication })), comment: comment.id, contact: contact.id, imagePath }
}
