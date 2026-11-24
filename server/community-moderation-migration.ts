import type { DatabaseSync } from 'node:sqlite'

export function migrateCommunityModeration(db:DatabaseSync) {
 if(db.prepare('SELECT 1 FROM migrations WHERE version=22').get())return
 db.exec(`BEGIN IMMEDIATE;
  CREATE TABLE student_restrictions (
   id INTEGER PRIMARY KEY AUTOINCREMENT,student_id INTEGER NOT NULL REFERENCES requests(id),admin_id INTEGER NOT NULL REFERENCES admin_users(id),
   reason TEXT NOT NULL,created_at TEXT NOT NULL,expires_at INTEGER,ended_at TEXT,ended_by INTEGER REFERENCES admin_users(id),end_reason TEXT,
   revision INTEGER NOT NULL DEFAULT 1,CHECK(expires_at IS NULL OR expires_at>0)
  );
  CREATE UNIQUE INDEX student_restriction_current ON student_restrictions(student_id) WHERE ended_at IS NULL;
  CREATE TABLE community_moderation_actions (
   request_key TEXT PRIMARY KEY,admin_id INTEGER NOT NULL REFERENCES admin_users(id),student_id INTEGER NOT NULL REFERENCES requests(id),
   comment_id INTEGER REFERENCES post_comments(id),fingerprint TEXT NOT NULL,result_json TEXT NOT NULL,created_at TEXT NOT NULL
  );
  INSERT INTO migrations VALUES (22,strftime('%Y-%m-%dT%H:%M:%fZ','now')); COMMIT;`)
}
