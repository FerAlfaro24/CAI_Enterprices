import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { transaction, type Database } from './database.ts';
import { HttpError, record, revisionOf } from './validation.ts';
import { administration } from './administration.ts';
import { publications, validatePublication } from './publications.ts';
import { livePublication, publicationAudience } from './community-media.ts';
import { queueNotice } from './notices.ts';
import type { LearningAchievement, LearningDraft, LearningPage, LearningReview, PublicationStatus, StudentUser, Submission } from './contracts.ts';
type Row = {
    id: number;
    student_id: number;
    create_key: string;
    fingerprint: string;
    category: LearningDraft['category'];
    title: string;
    practice: string;
    expression: string;
    example: string;
    state: LearningDraft['state'];
    review: LearningAchievement['review'];
    reason: string | null;
    revision: number;
    created_at: string;
    validated_at: string | null;
    publication_id: number | null;
};
const fields = ['category', 'title', 'practice', 'expression', 'example', 'state', 'images'];
const at = () => new Date().toISOString();
const pubId = (id: number) => `PUB-${String(id).padStart(4, '0')}`;
function field(value: unknown, max: number) {
    if (typeof value !== 'string' || value.trim().length > max || /[\p{Cc}\p{Cf}]/u.test(value.replace(/[\n\r\t]/g, '')))
        throw new HttpError(400, 'Revisa el texto del logro y su longitud.');
    return value.trim();
}
export function learningRepository(db: Database) {
    let processing = 0;
    const row = (id: number) => { const value = db.prepare('SELECT * FROM learning_achievements WHERE id=?').get(id) as Row | undefined; if (!value)
        throw new HttpError(404, 'No se encontró el logro.'); return value; };
    const active = (user: StudentUser) => {
        const id = Number(user.id.slice(4)), value = db.prepare("SELECT r.payload FROM requests r JOIN students s ON s.request_id=r.id WHERE r.id=? AND r.status='aprobada' AND s.status='activo'").get(id);
        if (!value)
            throw new HttpError(401, 'Tu acceso ya no está disponible.');
        return { id, profile: JSON.parse(String(value.payload)) as Submission };
    };
    const own = (user: StudentUser, id: number) => { const owner = active(user), item = row(id); if (item.student_id !== owner.id)
        throw new HttpError(404, 'No se encontró el logro.'); return item; };
    const view = (item: Row): LearningAchievement => {
        const post = item.publication_id ? db.prepare('SELECT status,revision FROM publications WHERE id=?').get(item.publication_id) : null;
        return { id: item.id, category: item.category, title: item.title, practice: item.practice, expression: item.expression, example: item.example, state: item.state, review: item.review, reason: item.reason, revision: item.revision, createdAt: item.created_at, validatedAt: item.validated_at,
            images: db.prepare('SELECT id,width,height FROM learning_images WHERE achievement_id=? ORDER BY position').all(item.id).map(image => ({ id: String(image.id), width: Number(image.width), height: Number(image.height), imagePath: `/api/local/learning-images/${image.id}` })),
            publication: post ? { id: pubId(item.publication_id!), status: post.status as PublicationStatus, revision: Number(post.revision) } : null };
    };
    const audit = (id: number, action: string, actor: string, reason: string | null = null) => db.prepare('INSERT INTO learning_audit(achievement_id,action,actor,reason,created_at) VALUES (?,?,?,?,?)').run(id, action, actor, reason, at());
    const page = (rows: Row[]): LearningPage => ({ items: rows.slice(0, 20).map(view), nextCursor: rows.length > 20 ? rows[19]!.id : null });
    return {
        pendingCount() { return Number(db.prepare("SELECT COUNT(*) AS n FROM learning_achievements a JOIN requests r ON r.id=a.student_id JOIN students s ON s.request_id=r.id WHERE a.review='pending' AND r.status='aprobada' AND s.status='activo' AND (a.publication_id IS NULL OR EXISTS(SELECT 1 FROM publications p WHERE p.id=a.publication_id AND p.status='pendiente'))").get()!.n) },
        mine(user: StudentUser, before = 0) { const owner = active(user); return page(db.prepare('SELECT * FROM learning_achievements WHERE student_id=? AND (?=0 OR id<?) ORDER BY id DESC LIMIT 21').all(owner.id, before, before) as Row[]); },
        async save(user: StudentUser, id: number | null, value: unknown, key: string, session: () => boolean) {
            const data = record(value), revision = id ? revisionOf(data.revision) : null;
            if (Object.keys(data).some(k => ![...fields, ...(id ? ['revision'] : [])].includes(k)) || !/^[a-f0-9-]{36}$/i.test(key))
                throw new HttpError(400, 'Revisa los campos del logro.');
            if (!['reading', 'screen', 'music'].includes(String(data.category)) || !['draft', 'completed'].includes(String(data.state)) || !Array.isArray(data.images) || data.images.length > 3)
                throw new HttpError(400, 'Elige una actividad y hasta tres imágenes.');
            const draft = { category: String(data.category), title: field(data.title, 100), practice: field(data.practice, 600), expression: field(data.expression, 160), example: field(data.example, 300), state: String(data.state) };
            if (!draft.title || (draft.state === 'completed' && (draft.title.length < 4 || draft.practice.length < 20 || draft.expression.length < 2 || draft.example.length < 5)))
                throw new HttpError(400, 'Para completar: título, al menos 20 caracteres de práctica, una expresión y un ejemplo de cinco caracteres.');
            const owner = active(user);
            if (id)
                own(user, id);
            const fingerprint = createHash('sha256').update(JSON.stringify([draft, data.images])).digest('hex');
            const replay = () => id ? db.prepare('SELECT * FROM learning_achievements WHERE id=? AND student_id=? AND revision=? AND fingerprint=?').get(id, owner.id, revision! + 1, fingerprint) as Row | undefined : db.prepare('SELECT * FROM learning_achievements WHERE student_id=? AND create_key=?').get(owner.id, key) as Row | undefined;
            const previous = replay();
            if (previous) {
                if (previous.fingerprint !== fingerprint)
                    throw new HttpError(409, 'Este guardado ya se recibió con otros datos.');
                return view(previous);
            }
            if (processing >= 2)
                throw new HttpError(429, 'Hay imágenes procesándose; vuelve a intentar en unos segundos.');
            processing++;
            try {
                const images: {
                    id: string;
                    bytes: Buffer;
                    width: number;
                    height: number;
                }[] = [];
                for (const input of data.images) {
                    const image = record(input);
                    if (Object.keys(image).length !== 1)
                        throw new HttpError(400, 'Revisa las imágenes del logro.');
                    if (typeof image.id === 'string') {
                        const stored = id ? db.prepare('SELECT * FROM learning_images WHERE id=? AND achievement_id=?').get(image.id, id) : undefined;
                        if (!stored)
                            throw new HttpError(400, 'La imagen debe pertenecer a este logro.');
                        images.push({ id: String(stored.id), bytes: Buffer.from(stored.bytes as Uint8Array), width: Number(stored.width), height: Number(stored.height) });
                    }
                    else {
                        if (typeof image.data !== 'string' || image.data.length > 4194400)
                            throw new HttpError(400, 'Usa JPEG o PNG de hasta 3 MB.');
                        const match = image.data.match(/^data:image\/(?:jpeg|png);base64,([A-Za-z0-9+/]+={0,2})$/);
                        if (!match)
                            throw new HttpError(400, 'Usa JPEG o PNG de hasta 3 MB.');
                        const bytes = Buffer.from(match[1]!, 'base64');
                        if (!bytes.length || bytes.length > 3 * 1024 * 1024 || bytes.toString('base64') !== match[1])
                            throw new HttpError(400, 'La imagen está incompleta o supera 3 MB.');
                        const source = sharp(bytes, { limitInputPixels: 12000000, failOn: 'warning', animated: false });
                        const metadata = await source.metadata().catch(() => { throw new HttpError(400, 'No pudimos leer esta imagen.'); });
                        if (!['jpeg', 'png'].includes(metadata.format ?? '') || (metadata.pages ?? 1) !== 1)
                            throw new HttpError(400, 'Usa una imagen JPEG o PNG estática.');
                        const result = await source.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).timeout({ seconds: 8 }).toBuffer({ resolveWithObject: true }).catch(() => { throw new HttpError(400, 'No pudimos procesar esta imagen.'); });
                        images.push({ id: randomUUID(), bytes: result.data, width: result.info.width, height: result.info.height });
                    }
                }
                if (new Set(images.map(image => image.id)).size !== images.length)
                    throw new HttpError(400, 'No repitas la misma imagen.');
                return transaction(db, () => {
                    if (!session())
                        throw new HttpError(401, 'Tu sesión terminó mientras se guardaba el logro.');
                    active(user);
                    const repeated = replay();
                    if (repeated) {
                        if (repeated.fingerprint !== fingerprint)
                            throw new HttpError(409, 'El guardado ya tiene otros datos.');
                        return view(repeated);
                    }
                    if (id) {
                        const current = own(user, id);
                        if (current.revision !== revision || current.review === 'pending' || current.validated_at)
                            throw new HttpError(409, 'El logro cambió o está en revisión. Carga su estado actual antes de editar.');
                    }
                    if (!id && Number(db.prepare('SELECT COUNT(*) AS n FROM learning_achievements WHERE student_id=?').get(owner.id)!.n) >= 1000)
                        throw new HttpError(409, 'Alcanzaste el límite de logros de esta instalación.');
                    const used = Number(db.prepare('SELECT COALESCE(SUM(length(bytes)),0) AS n FROM learning_images WHERE achievement_id!=?').get(id ?? 0)!.n);
                    const ownBytes = Number(db.prepare('SELECT COALESCE(SUM(length(i.bytes)),0) AS n FROM learning_images i JOIN learning_achievements a ON a.id=i.achievement_id WHERE a.student_id=? AND a.id!=?').get(owner.id, id ?? 0)!.n);
                    const size = images.reduce((n, image) => n + image.bytes.length, 0);
                    if (used + size > 128 * 1024 * 1024 || ownBytes + size > 30 * 1024 * 1024)
                        throw new HttpError(409, 'Se alcanzó la capacidad de imágenes. Consulta con coordinación.');
                    const values = [draft.category, draft.title, draft.practice, draft.expression, draft.example, draft.state, fingerprint, at()];
                    const savedId = id ?? Number(db.prepare('INSERT INTO learning_achievements(category,title,practice,expression,example,state,fingerprint,updated_at,student_id,create_key,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(...values, owner.id, key, at()).lastInsertRowid);
                    if (id)
                        db.prepare("UPDATE learning_achievements SET category=?,title=?,practice=?,expression=?,example=?,state=?,fingerprint=?,updated_at=?,review='none',reason=NULL,publication_id=NULL,revision=revision+1 WHERE id=?").run(...values, id);
                    db.prepare('DELETE FROM learning_images WHERE achievement_id=?').run(savedId);
                    images.forEach((image, index) => db.prepare('INSERT INTO learning_images VALUES (?,?,?,?,?,?)').run(image.id, savedId, index, image.bytes, image.width, image.height));
                    audit(savedId, 'saved', user.id);
                    return view(row(savedId));
                });
            }
            finally {
                processing--;
            }
        },
        submit(user: StudentUser, id: number, value: unknown) {
            const data = record(value), revision = revisionOf(data.revision);
            if (Object.keys(data).some(k => !['revision', 'share', 'confirmed'].includes(k)) || typeof data.share !== 'boolean' || data.confirmed !== true)
                throw new HttpError(400, 'Confirma si quieres validar en privado o publicar.');
            return transaction(db, () => {
                const item = own(user, id), owner = active(user);
                const post = item.publication_id ? db.prepare('SELECT status FROM publications WHERE id=?').get(item.publication_id) : null;
                const previousAction = db.prepare('SELECT action FROM learning_audit WHERE achievement_id=? ORDER BY id DESC LIMIT 1').get(id)?.action;
                if (item.revision === revision + 1 && previousAction === (data.share ? 'publication_requested' : 'validation_requested') && ((!data.share && item.review === 'pending' && !post) || (data.share && post?.status === 'pendiente')))
                    return view(item);
                if (item.revision !== revision || item.state !== 'completed' || item.review === 'pending')
                    throw new HttpError(409, 'Completa el logro y carga su estado actual antes de enviarlo.');
                if (data.share) {
                    if (!administration(db).settings().submissionsOpen)
                        throw new HttpError(409, 'CAI pausó los nuevos envíos de publicaciones.');
                    if (post && ['pendiente', 'publicada'].includes(String(post.status)))
                        throw new HttpError(409, 'Este logro ya está compartido o en revisión.');
                    const draft = validatePublication({ title: item.title, category: 'achievement', body: `${item.practice}\n\nLo que aprendí: ${item.expression}\nMi ejemplo: ${item.example}` });
                    const publication = Number(db.prepare("INSERT INTO publications(audience,author_id,idempotency_key,title,body,category,program,group_name,created_at) VALUES ('community',?,?,?,?,?,?,?,?)").run(owner.id, randomUUID(), draft.title, draft.body, 'achievement', owner.profile.program, owner.profile.group, at()).lastInsertRowid);
                    db.prepare("INSERT INTO publication_audit(publication_id,student_id,action,created_at) VALUES (?,?,'publication.submitted',?)").run(publication, owner.id, at());
                    db.prepare('UPDATE learning_achievements SET publication_id=? WHERE id=?').run(publication, id);
                }
                else if (item.validated_at)
                    throw new HttpError(409, 'Este logro ya fue validado; puedes conservarlo privado o compartirlo.');
                db.prepare("UPDATE learning_achievements SET review=CASE WHEN validated_at IS NULL THEN 'pending' ELSE 'approved' END,reason=NULL,revision=revision+1 WHERE id=?").run(id);
                audit(id, data.share ? 'publication_requested' : 'validation_requested', user.id);
                return view(row(id));
            });
        },
        cancel(user: StudentUser, id: number, value: unknown) {
            const data = record(value), revision = revisionOf(data.revision);
            if (Object.keys(data).some(k => k !== 'revision'))
                throw new HttpError(400, 'Revisa la retirada.');
            // Withdrawal shares the canonical publication operation; private validation has its own CAS.
            const item = own(user, id);
            if (item.revision !== revision || item.review !== 'pending')
                throw new HttpError(409, 'La revisión cambió; actualiza antes de retirar.');
            if (item.publication_id) {
                const post = db.prepare('SELECT revision,status FROM publications WHERE id=?').get(item.publication_id)!;
                if (post.status === 'pendiente')
                    publications(db).withdraw(user, pubId(item.publication_id), Number(post.revision));
            }
            return transaction(db, () => { const current = own(user, id); if (current.revision !== revision)
                throw new HttpError(409, 'El logro cambió.'); db.prepare("UPDATE learning_achievements SET review='none',publication_id=NULL,revision=revision+1 WHERE id=?").run(id); audit(id, 'review_withdrawn', user.id); return view(row(id)); });
        },
        reviews(before = 0) { const values = db.prepare("SELECT a.* FROM learning_achievements a JOIN requests r ON r.id=a.student_id JOIN students s ON s.request_id=r.id WHERE a.review='pending' AND r.status='aprobada' AND s.status='activo' AND (a.publication_id IS NULL OR EXISTS(SELECT 1 FROM publications p WHERE p.id=a.publication_id AND p.status='pendiente')) AND (?=0 OR a.id<?) ORDER BY a.id DESC LIMIT 21").all(before, before) as Row[]; return { items: values.slice(0, 20).map(item => { const profile = JSON.parse(String(db.prepare('SELECT payload FROM requests WHERE id=?').get(item.student_id)!.payload)) as Submission; return { ...view(item), studentName: profile.firstName + ' ' + profile.lastName, studentId: `CAI-${String(item.student_id).padStart(4, '0')}` } satisfies LearningReview; }), nextCursor: values.length > 20 ? values[19]!.id : null }; },
        decide(id: number, value: unknown, admin: number) {
            const data = record(value), revision = revisionOf(data.revision), reason = field(data.reason, 280);
            if (Object.keys(data).some(k => !['revision', 'decision', 'reason', 'confirmed'].includes(k)) || !['approve', 'reject'].includes(String(data.decision)) || data.confirmed !== true || reason.length < 8)
                throw new HttpError(400, 'Elige una decisión, escribe un motivo y confirma la revisión.');
            const item = row(id);
            if (item.revision !== revision || item.review !== 'pending')
                throw new HttpError(409, 'Esta revisión cambió. Actualiza antes de decidir.');
            const account = db.prepare("SELECT 1 FROM requests r JOIN students s ON s.request_id=r.id WHERE r.id=? AND r.status='aprobada' AND s.status='activo'").get(item.student_id);
            if (!account)
                throw new HttpError(409, 'El alumno debe tener acceso activo.');
            if (item.publication_id) {
                const post = db.prepare('SELECT revision FROM publications WHERE id=?').get(item.publication_id)!;
                publications(db).decide(pubId(item.publication_id), Number(post.revision), data.decision as 'approve' | 'reject', admin, reason, true);
                return view(row(id));
            }
            return transaction(db, () => {
                db.prepare('UPDATE learning_achievements SET review=?,reason=?,validated_at=?,revision=revision+1 WHERE id=?').run(data.decision === 'approve' ? 'approved' : 'changes', reason, data.decision === 'approve' ? at() : null, id);
                audit(id, String(data.decision), 'ADMIN-' + admin, reason);
                queueNotice(db, item.student_id, 'Tu logro tiene novedades', 'CAI revisó tu logro. Consulta Logros para ver el resultado y el motivo privado.', 'learning-review');
                return view(row(id));
            });
        },
        image(id: string, user: StudentUser | null, admin: boolean) {
            const image = db.prepare('SELECT i.*,a.student_id,a.review,a.validated_at,a.publication_id FROM learning_images i JOIN learning_achievements a ON a.id=i.achievement_id WHERE i.id=?').get(id);
            if (!image)
                throw new HttpError(404, 'La imagen no está disponible.');
            const owner = user ? active(user) : null;
            const privateReview = admin && (image.review === 'pending' || image.review === 'changes' || image.validated_at !== null);
            let shared = false;
            if (owner && image.publication_id) {
                const profile = owner.profile;
                shared = Boolean(db.prepare(`SELECT 1 FROM publications p WHERE p.id=? AND ${livePublication} AND ${publicationAudience}`).get(Number(image.publication_id), profile.program, profile.group));
            }
            if (owner?.id !== image.student_id && !privateReview && !shared)
                throw new HttpError(404, 'La imagen no está disponible.');
            return Buffer.from(image.bytes as Uint8Array);
        },
    };
}
