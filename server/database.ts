import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { accessRequests, students } from '../src/features/admin/data/mockData.ts'

/** Migraciones locales versionadas. Nunca borrar/recrear una base existente para actualizarla. */
export function openDatabase(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new DatabaseSync(path)
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;')
  try { return migrateDatabase(db) }
  catch (error) { db.close(); throw error }
}

export function migrateDatabase(db: DatabaseSync) {
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
  if (!db.prepare('SELECT version FROM migrations WHERE version = 2').get()) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE student_accounts (
        request_id INTEGER PRIMARY KEY REFERENCES requests(id), password_hash TEXT NOT NULL, activated_at TEXT NOT NULL
      );
      CREATE TABLE student_invitations (
        request_id INTEGER PRIMARY KEY REFERENCES requests(id), token_hash TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL, created_by INTEGER NOT NULL REFERENCES admin_users(id)
      );
      CREATE TABLE student_sessions (
        token_hash TEXT PRIMARY KEY, request_id INTEGER NOT NULL REFERENCES requests(id), expires_at INTEGER NOT NULL
      );
      CREATE INDEX student_sessions_owner ON student_sessions(request_id);
      CREATE INDEX student_sessions_expiry ON student_sessions(expires_at);
      INSERT INTO migrations(version, applied_at) VALUES (2, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      COMMIT;`)
  }
  if (!db.prepare('SELECT version FROM migrations WHERE version = 3').get()) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE google_identities (
        subject TEXT PRIMARY KEY, email TEXT NOT NULL,
        request_id INTEGER UNIQUE REFERENCES requests(id), created_at TEXT NOT NULL
      );
      CREATE TABLE google_sessions (
        token_hash TEXT PRIMARY KEY, subject TEXT NOT NULL REFERENCES google_identities(subject), expires_at INTEGER NOT NULL
      );
      CREATE TABLE google_challenges (token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
      CREATE INDEX google_sessions_expiry ON google_sessions(expires_at);
      INSERT INTO migrations(version, applied_at) VALUES (3, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      COMMIT;`)
  }
  if (!db.prepare('SELECT version FROM migrations WHERE version = 4').get()) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE publications (
        id INTEGER PRIMARY KEY AUTOINCREMENT, author_id INTEGER NOT NULL REFERENCES requests(id),
        idempotency_key TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
        category TEXT NOT NULL CHECK(category IN ('achievement','experience')),
        program TEXT NOT NULL, group_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente','publicada','rechazada','retirada')),
        reason TEXT, created_at TEXT NOT NULL, published_at TEXT, revision INTEGER NOT NULL DEFAULT 1,
        UNIQUE(author_id, idempotency_key)
      );
      CREATE INDEX publications_feed ON publications(status, program, group_name, published_at);
      CREATE INDEX publications_author ON publications(author_id, id DESC);
      CREATE TABLE publication_audit (
        id INTEGER PRIMARY KEY, publication_id INTEGER NOT NULL REFERENCES publications(id),
        admin_id INTEGER REFERENCES admin_users(id), student_id INTEGER REFERENCES requests(id),
        action TEXT NOT NULL, created_at TEXT NOT NULL
      );
      INSERT INTO migrations(version, applied_at) VALUES (4, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      COMMIT;`)
  }
  if (!db.prepare('SELECT version FROM migrations WHERE version = 5').get()) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE local_notices (
        id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER NOT NULL REFERENCES requests(id),
        subject TEXT NOT NULL, message TEXT NOT NULL, kind TEXT NOT NULL, created_at TEXT NOT NULL,
        acknowledged INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE password_resets (
        request_id INTEGER PRIMARY KEY REFERENCES student_accounts(request_id), token_hash TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL, password_version TEXT NOT NULL
      );
      INSERT INTO migrations VALUES (5, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      COMMIT;`)
  }
  if (!db.prepare('SELECT version FROM migrations WHERE version = 6').get()) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE public_profiles (
        request_id INTEGER PRIMARY KEY REFERENCES requests(id), public_id TEXT NOT NULL UNIQUE
      );
      INSERT INTO migrations VALUES (6, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      COMMIT;`)
  }
  if (!db.prepare('SELECT version FROM migrations WHERE version = 7').get()) {
    transaction(db, () => {
      db.exec(`CREATE TABLE course_groups (
        id INTEGER PRIMARY KEY, program TEXT NOT NULL, name TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1 CHECK(active IN (0,1)), revision INTEGER NOT NULL DEFAULT 1,
        UNIQUE(program, name)
      );
      CREATE TABLE community_controls (
        id INTEGER PRIMARY KEY CHECK(id = 1), registration_open INTEGER NOT NULL CHECK(registration_open IN (0,1)),
        submissions_open INTEGER NOT NULL CHECK(submissions_open IN (0,1)), revision INTEGER NOT NULL DEFAULT 1
      );
      INSERT INTO community_controls VALUES (1,1,1,1);
      CREATE TABLE administration_audit (
        id INTEGER PRIMARY KEY, actor_id INTEGER NOT NULL REFERENCES admin_users(id), kind TEXT NOT NULL,
        details TEXT NOT NULL, created_at TEXT NOT NULL
      );`)
      const insert = db.prepare('INSERT OR IGNORE INTO course_groups(program,name) VALUES (?,?)')
      const programs = [...new Set([...students, ...accessRequests].map(item => item.program))]
      for (const program of programs) {
        const groups = [...new Set(students.filter(student => student.program === program).map(student => student.group))]
        for (const name of groups.length ? groups : ['Por asignar']) insert.run(program, name)
      }
      // Conservar también las asignaciones guardadas antes de disponer de catálogo editable.
      for (const row of db.prepare('SELECT payload FROM requests').all()) {
        let profile: unknown
        try { profile = JSON.parse(String(row.payload)) } catch { continue }
        if (profile && typeof profile === 'object' && 'program' in profile && 'group' in profile && typeof profile.program === 'string' && typeof profile.group === 'string') insert.run(profile.program, profile.group)
      }
      db.prepare("INSERT INTO migrations VALUES (7, strftime('%Y-%m-%dT%H:%M:%fZ','now'))").run()
    })
  }
  if (!db.prepare('SELECT version FROM migrations WHERE version = 8').get()) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE contact_inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT, idempotency_key TEXT NOT NULL UNIQUE, payload TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'nueva' CHECK(status IN ('nueva','seguimiento','atendida')),
        note TEXT NOT NULL DEFAULT '', revision INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
      );
      ALTER TABLE local_notices ADD COLUMN student_seen_at TEXT;
      INSERT INTO migrations VALUES (8, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      COMMIT;`)
  }
  if (!db.prepare('SELECT version FROM migrations WHERE version = 9').get()) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE gallery_images (
        id TEXT PRIMARY KEY, idempotency_key TEXT NOT NULL UNIQUE, fingerprint TEXT NOT NULL,
        title TEXT NOT NULL, description TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('activities','achievements','events','backstage')),
        alt TEXT NOT NULL, program TEXT NOT NULL, group_name TEXT NOT NULL, authorization_reference TEXT NOT NULL,
        created_by INTEGER NOT NULL REFERENCES admin_users(id), created_at TEXT NOT NULL,
        bytes BLOB NOT NULL, width INTEGER NOT NULL, height INTEGER NOT NULL, byte_size INTEGER NOT NULL,
        withdrawn_at TEXT, revision INTEGER NOT NULL DEFAULT 1
      );
      CREATE INDEX gallery_audience ON gallery_images(program,group_name,withdrawn_at,created_at);
      INSERT INTO migrations VALUES (9, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
      COMMIT;`)
  }
  if (!db.prepare('SELECT version FROM migrations WHERE version = 10').get()) {
    db.exec(`BEGIN IMMEDIATE;
      CREATE TABLE admin_password_resets (
        user_id INTEGER PRIMARY KEY REFERENCES admin_users(id), requested_at INTEGER NOT NULL,
        password_version TEXT NOT NULL, email_version TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('pending','sending','delivered','failed','cancelled')),
        token_hash TEXT UNIQUE, expires_at INTEGER
      );
      INSERT INTO migrations VALUES (10, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
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
