import type { DatabaseSync } from 'node:sqlite'
import { isImportantNotice } from '../shared/notice-policy.ts'

export function migrateNoticeHistory(db:DatabaseSync) {
  if(db.prepare('SELECT version FROM migrations WHERE version=20').get())return
  db.exec('BEGIN IMMEDIATE')
  try {
    db.exec(`ALTER TABLE local_notices ADD COLUMN important INTEGER NOT NULL DEFAULT 0 CHECK(important IN (0,1));
      ALTER TABLE local_notices ADD COLUMN student_dismissed_at TEXT;
      CREATE INDEX student_notice_inbox ON local_notices(request_id,student_dismissed_at,id DESC);`)
    const update=db.prepare('UPDATE local_notices SET important=1 WHERE id=?')
    for(const row of db.prepare('SELECT id,kind,subject FROM local_notices').all())if(isImportantNotice(String(row.kind),String(row.subject)))update.run(Number(row.id))
    db.exec("INSERT INTO migrations VALUES (20,strftime('%Y-%m-%dT%H:%M:%fZ','now')); COMMIT;")
  } catch(error){db.exec('ROLLBACK');throw error}
}
