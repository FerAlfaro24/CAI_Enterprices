import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

/** Migraciones locales versionadas. Nunca borrar/recrear una base existente para actualizarla. */
export function openDatabase(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;')
  db.exec('CREATE TABLE IF NOT EXISTS migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)')
  const applied = db.prepare('SELECT version FROM migrations WHERE version = 1').get()
  if (!applied) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE admin_users (
        id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
        name TEXT NOT NULL, password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role = 'admin')
      );
      CREATE TABLE sessions (
        token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES admin_users(id), expires_at INTEGER NOT NULL
      );
      CREATE INDEX sessions_expiry ON sessions(expires_at);
      CREATE TABLE requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT, idempotency_key TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL COLLATE NOCASE, payload TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente','aprobada','rechazada')),
        created_at TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1
      );
      CREATE UNIQUE INDEX requests_active_email ON requests(email) WHERE status IN ('pendiente','aprobada');
      CREATE TABLE consent_confirmations (
        request_id INTEGER PRIMARY KEY REFERENCES requests(id), actor_id INTEGER NOT NULL REFERENCES admin_users(id),
        reference TEXT NOT NULL, confirmed_at TEXT NOT NULL
      );
      CREATE TABLE students (
        request_id INTEGER PRIMARY KEY REFERENCES requests(id), joined_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'activo' CHECK(status IN ('activo','suspendido')), revision INTEGER NOT NULL DEFAULT 1
      );
      CREATE TABLE audit_log (
        id INTEGER PRIMARY KEY, actor_id INTEGER REFERENCES admin_users(id), request_id INTEGER REFERENCES requests(id),
        action TEXT NOT NULL, created_at TEXT NOT NULL
      );
      INSERT INTO migrations(version, applied_at) VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      COMMIT;`)
  }
  return db
}

export type Database = ReturnType<typeof openDatabase>

export function transaction<T>(db: Database, operation: () => T): T {
  db.exec('BEGIN IMMEDIATE')
  try {
    const result = operation()
    db.exec('COMMIT')
    return result
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}
