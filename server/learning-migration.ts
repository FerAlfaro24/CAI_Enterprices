import type { DatabaseSync } from 'node:sqlite';
/** Additive migration: historical requests/grants/publications remain unchanged. */
export function migrateLearning(db: DatabaseSync) {
    if (db.prepare('SELECT version FROM migrations WHERE version=19').get())
        return;
    db.exec(`BEGIN IMMEDIATE;
    CREATE TABLE learning_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT, student_id INTEGER NOT NULL REFERENCES students(request_id),
      create_key TEXT NOT NULL, fingerprint TEXT NOT NULL, category TEXT NOT NULL CHECK(category IN ('reading','screen','music')),
      title TEXT NOT NULL, practice TEXT NOT NULL, expression TEXT NOT NULL, example TEXT NOT NULL,
      state TEXT NOT NULL CHECK(state IN ('draft','completed')),
      review TEXT NOT NULL DEFAULT 'none' CHECK(review IN ('none','pending','approved','changes')),
      reason TEXT, revision INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      validated_at TEXT, publication_id INTEGER UNIQUE REFERENCES publications(id),
      UNIQUE(student_id,create_key)
    );
    CREATE INDEX learning_owner ON learning_achievements(student_id,id DESC);
    CREATE INDEX learning_review ON learning_achievements(review,id DESC);
    CREATE TABLE learning_images (
      id TEXT PRIMARY KEY, achievement_id INTEGER NOT NULL REFERENCES learning_achievements(id),
      position INTEGER NOT NULL CHECK(position BETWEEN 0 AND 2), bytes BLOB NOT NULL,
      width INTEGER NOT NULL, height INTEGER NOT NULL, UNIQUE(achievement_id,position)
    );
    CREATE TABLE learning_audit (
      id INTEGER PRIMARY KEY, achievement_id INTEGER NOT NULL REFERENCES learning_achievements(id),
      action TEXT NOT NULL, actor TEXT NOT NULL, reason TEXT, created_at TEXT NOT NULL
    );
    INSERT INTO migrations VALUES (19,strftime('%Y-%m-%dT%H:%M:%fZ','now'));
    COMMIT;`);
}
