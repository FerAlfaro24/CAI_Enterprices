import type { Database } from './database.ts'
import type { GalleryItem, StudentUser } from './contracts.ts'

export const livePublication = `p.status='publicada' AND (p.expires_at IS NULL OR p.expires_at>strftime('%Y-%m-%dT%H:%M:%fZ','now')) AND
  (p.admin_author_id IS NOT NULL OR EXISTS (SELECT 1 FROM requests r JOIN students s ON s.request_id=r.id
   WHERE r.id=p.author_id AND r.status='aprobada' AND s.status='activo' AND (p.audience='community' OR (json_extract(r.payload,'$.program')=p.program AND json_extract(r.payload,'$.group')=p.group_name))))`
export const publicationAudience = `(p.audience='community' OR (p.program=? AND p.group_name=? AND p.group_name<>'Por asignar'))`
export const imageAudience = `(g.audience='community' OR (g.program=? AND g.group_name=? AND g.group_name<>'Por asignar'))`
export function galleryItem(row: Record<string, unknown>): GalleryItem {
  return {id:String(row.id),title:String(row.title),description:String(row.description),category:row.category as GalleryItem['category'],alt:String(row.alt),width:Number(row.width),height:Number(row.height),byteSize:Number(row.byte_size),createdAt:String(row.created_at),imagePath:`/api/local/gallery/${row.id}/image`,...(row.post_id?{publication:{id:`PUB-${String(row.post_id).padStart(4,'0')}`,title:String(row.post_title),description:String(row.post_body),createdAt:String(row.post_date)}}:{})}
}
export function publicationPhotos(db: Database, post: number): GalleryItem[] {
  return db.prepare('SELECT g.* FROM publication_images x JOIN gallery_images g ON g.id=x.image_id WHERE x.publication_id=? AND g.withdrawn_at IS NULL ORDER BY x.position').all(post).map(galleryItem).concat(db.prepare('SELECT i.*,a.title,a.practice,a.created_at FROM learning_images i JOIN learning_achievements a ON a.id=i.achievement_id WHERE a.publication_id=? ORDER BY i.position').all(post).map(row=>({id:String(row.id),title:String(row.title),description:String(row.practice),category:'achievements' as const,alt:'Imagen de '+String(row.title),width:Number(row.width),height:Number(row.height),byteSize:0,createdAt:String(row.created_at),imagePath:`/api/local/learning-images/${row.id}`})))
}
export function imageVisible(db:Database,id:string,user:StudentUser) {
  return Boolean(db.prepare(`SELECT 1 FROM gallery_images g LEFT JOIN publication_images x ON x.image_id=g.id LEFT JOIN publications p ON p.id=x.publication_id
    WHERE g.id=? AND g.withdrawn_at IS NULL AND ${imageAudience} AND
    ((x.publication_id IS NULL AND g.draft=0) OR (${livePublication} AND ${publicationAudience}))`).get(id,user.program,user.group,user.program,user.group))
}
