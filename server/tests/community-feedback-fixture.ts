/** Synthetic inbox + answer key for the focused browser verifier. Never used by the app. */
import type { Database } from '../database.ts'
import type { StudentUser } from '../contracts.ts'
import { challengesRepository } from '../challenges.ts'
import { queueNotice } from '../notices.ts'

export function seedCommunityFeedback(db: Database, user: StudentUser) {
  const owner = Number(user.id.slice(4))
  const create = (subject: string, read = false) => {
    queueNotice(db, owner, subject, 'Mensaje ficticio de pruebas del historial.')
    const id = Number(db.prepare('SELECT MAX(id) AS id FROM local_notices').get()!.id)
    if (read) db.prepare('UPDATE local_notices SET student_seen_at=? WHERE id=?').run(new Date().toISOString(), id)
    return id
  }
  const ordinary = create('Nueva insignia de prueba')
  const history = [1, 2, 3].map(index => create(`Historial de prueba ${index}`, true))
  const answers = challengesRepository(db).snapshot(user).items.map(question => {
    const row = db.prepare('SELECT content_json FROM daily_challenges WHERE id=?').get(Number(question.id.slice(2)))!
    return (JSON.parse(String(row.content_json)) as { correctIndex: number }).correctIndex
  })
  return { ordinary, history, answers }
}
