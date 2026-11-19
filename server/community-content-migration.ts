import type { DatabaseSync } from 'node:sqlite'

/** Rebuild per SQLite's documented procedure; preserves IDs and all child references. */
export function migrateCommunityContent(db: DatabaseSync) {
  if (db.prepare('SELECT version FROM migrations WHERE version=18').get()) return
  const sequence = Number(db.prepare("SELECT seq FROM sqlite_sequence WHERE name='publications'").get()?.seq ?? 0)
  db.exec('PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE;')
  try {
    db.exec(`CREATE TABLE publications_next (
      id INTEGER PRIMARY KEY AUTOINCREMENT, author_id INTEGER REFERENCES requests(id),
      idempotency_key TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('achievement','experience')),
      program TEXT NOT NULL, group_name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente','publicada','rechazada','retirada')),
      reason TEXT, created_at TEXT NOT NULL, published_at TEXT, revision INTEGER NOT NULL DEFAULT 1,
      comments_open INTEGER NOT NULL DEFAULT 1 CHECK(comments_open IN (0,1)), badge_grant_id INTEGER REFERENCES badge_grants(id),
      admin_author_id INTEGER REFERENCES admin_users(id), audience TEXT NOT NULL DEFAULT 'group' CHECK(audience IN ('group','community')),
      kind TEXT NOT NULL DEFAULT 'story' CHECK(kind IN ('story','notice','album')),
      show_in_gallery INTEGER NOT NULL DEFAULT 0 CHECK(show_in_gallery IN (0,1)),
      highlighted INTEGER NOT NULL DEFAULT 0 CHECK(highlighted IN (0,1)), expires_at TEXT, content_fingerprint TEXT,
      CHECK((author_id IS NOT NULL AND admin_author_id IS NULL AND audience='group' AND kind='story') OR (author_id IS NULL AND admin_author_id IS NOT NULL)),
      UNIQUE(author_id,idempotency_key)
    );
    INSERT INTO publications_next(id,author_id,idempotency_key,title,body,category,program,group_name,status,reason,created_at,published_at,revision,comments_open,badge_grant_id)
      SELECT id,author_id,idempotency_key,title,body,category,program,group_name,status,reason,created_at,published_at,revision,comments_open,badge_grant_id FROM publications;
    DROP TABLE publications;
    ALTER TABLE publications_next RENAME TO publications;
    CREATE INDEX publications_feed ON publications(status,program,group_name,published_at);
    CREATE INDEX publications_author ON publications(author_id,id DESC);
    CREATE UNIQUE INDEX publication_badge_grant ON publications(badge_grant_id) WHERE badge_grant_id IS NOT NULL AND status IN ('pendiente','publicada');
    CREATE UNIQUE INDEX institutional_post_key ON publications(idempotency_key) WHERE admin_author_id IS NOT NULL;
    ALTER TABLE gallery_images ADD COLUMN draft INTEGER NOT NULL DEFAULT 0 CHECK(draft IN (0,1));
    CREATE TABLE publication_images (
      publication_id INTEGER NOT NULL REFERENCES publications(id), image_id TEXT NOT NULL UNIQUE REFERENCES gallery_images(id),
      position INTEGER NOT NULL CHECK(position BETWEEN 0 AND 11), PRIMARY KEY(publication_id,position)
    );`)
    db.prepare("UPDATE sqlite_sequence SET seq=MAX(seq,?) WHERE name='publications'").run(sequence)
    if (db.prepare('PRAGMA foreign_key_check').all().length) throw Error('La migración no conservó las referencias del contenido.')
    db.exec("INSERT INTO migrations VALUES (18,strftime('%Y-%m-%dT%H:%M:%fZ','now')); COMMIT;")
  } catch (error) { db.exec('ROLLBACK'); throw error }
  finally { db.exec('PRAGMA foreign_keys=ON') }
}
