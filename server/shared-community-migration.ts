import type { DatabaseSync } from 'node:sqlite'

/** Sustituye la restricción de audiencia sin cambiar IDs, secuencias ni referencias hijas. */
export function migrateSharedCommunity(db: DatabaseSync) {
  if (db.prepare('SELECT 1 FROM migrations WHERE version=21').get()) return
  const definition=String(db.prepare("SELECT sql FROM sqlite_schema WHERE type='table' AND name='publications'").get()!.sql)
  const create=definition.replace(/^CREATE TABLE (?:"publications"|publications)/,'CREATE TABLE publications_shared_next').replace(" AND audience='group' AND kind='story'"," AND kind='story'")
  if(!create.startsWith('CREATE TABLE publications_shared_next'))throw Error('Esquema de publicaciones no reconocido.')
  const objects=db.prepare("SELECT sql FROM sqlite_schema WHERE tbl_name='publications' AND type IN ('index','trigger') AND sql IS NOT NULL").all()
  const sequence=Number(db.prepare("SELECT seq FROM sqlite_sequence WHERE name='publications'").get()?.seq??0)
  db.exec('PRAGMA foreign_keys=OFF; BEGIN IMMEDIATE;')
  try {
    db.exec(create)
    db.exec('INSERT INTO publications_shared_next SELECT * FROM publications; DROP TABLE publications; ALTER TABLE publications_shared_next RENAME TO publications;')
    for(const item of objects)db.exec(String(item.sql))
    db.prepare("UPDATE sqlite_sequence SET seq=MAX(seq,?) WHERE name='publications'").run(sequence)
    db.exec(`INSERT INTO publication_audit(publication_id,action,created_at)
      SELECT id,'publication.community_scope',strftime('%Y-%m-%dT%H:%M:%fZ','now')
      FROM publications WHERE admin_author_id IS NULL AND audience='group';
      UPDATE publications SET audience='community' WHERE admin_author_id IS NULL AND audience='group';`)
    if(db.prepare('PRAGMA foreign_key_check').all().length)throw Error('No se conservaron las referencias de comunidad.')
    db.exec("INSERT INTO migrations VALUES (21,strftime('%Y-%m-%dT%H:%M:%fZ','now')); COMMIT;")
  } catch(error) {db.exec('ROLLBACK');throw error}
  finally {db.exec('PRAGMA foreign_keys=ON')}
}
