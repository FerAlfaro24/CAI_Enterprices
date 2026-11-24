import type { Database } from './database.ts'

/** Aplicado al acceso, no al estado manual de inscripción ni al contenido histórico. */
export const unrestrictedStudent = (id:string) => `NOT EXISTS (SELECT 1 FROM student_restrictions restriction WHERE restriction.student_id=${id} AND restriction.ended_at IS NULL AND (restriction.expires_at IS NULL OR restriction.expires_at>CAST((julianday('now')-2440587.5)*86400000 AS INTEGER)))`
export function currentRestriction(db:Database,id:number) {
 return db.prepare('SELECT * FROM student_restrictions WHERE student_id=? AND ended_at IS NULL AND (expires_at IS NULL OR expires_at>?)').get(id,Date.now())
}
