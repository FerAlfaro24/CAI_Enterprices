import type { DatabaseSync } from 'node:sqlite'

export function migrateAccountEmail(db: DatabaseSync) {
  if (db.prepare('SELECT version FROM migrations WHERE version=23').get()) return
  db.exec(`BEGIN IMMEDIATE;
    CREATE TABLE account_emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER NOT NULL REFERENCES requests(id),
      kind TEXT NOT NULL CHECK(kind IN ('activation','recovery','google-approved')),
      state TEXT NOT NULL CHECK(state IN ('pending','sending','accepted','failed','cancelled')),
      email_version TEXT NOT NULL, request_revision INTEGER NOT NULL, student_revision INTEGER NOT NULL,
      password_version TEXT, google_subject TEXT, restriction_version INTEGER NOT NULL,
      actor_id INTEGER REFERENCES admin_users(id), revision INTEGER NOT NULL DEFAULT 1,
      attempts INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
      accepted_at INTEGER, error_code TEXT
    );
    CREATE INDEX account_email_latest ON account_emails(request_id,kind,id DESC);
    INSERT INTO migrations VALUES (23,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
    COMMIT;`)
}
