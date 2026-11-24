import assert from 'node:assert/strict';
import test from 'node:test';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import sharp from 'sharp';
import { createApplication } from '../app.ts';
import { hashPassword } from '../auth.ts';
import { accessRepository } from '../access-repository.ts';
import { studentAccounts } from '../student-accounts.ts';
import { validateSubmission } from '../validation.ts';
import { learningRepository } from '../learning.ts';
import { publicProfileId } from '../public-profiles.ts';
import { badgesRepository } from '../badges.ts';
import { publications } from '../publications.ts';
import { backupLocalDatabase } from '../backup.ts';
import { verifyLocalBackup } from '../verify-backup.ts';
import { openDatabase } from '../database.ts';
import { badgeDefinitions } from '../../shared/badges.ts';
import type { LearningAchievement, LearningDraft, StudentUser, SocialProfile } from '../contracts.ts';
test('Logros personales, imágenes privadas, revisión, insignias progresivas y perfil social', async (t) => {
    const root = resolve('.local/tests');
    await mkdir(root, { recursive: true });
    const dir = await mkdtemp(join(root, 'learning-api-')), path = join(dir, 'fixture.sqlite'), app = createApplication(path);
    app.server.listen(0, '127.0.0.1');
    await once(app.server, 'listening');
    const address = app.server.address();
    assert.ok(address && typeof address === 'object');
    const base = 'http://127.0.0.1:' + address.port;
    t.after(() => new Promise<void>((resolve, reject) => app.server.close(error => error ? reject(error) : resolve())));
    const password = 'Pruebas ficticias de aprendizaje 2026', hash = await hashPassword(password), admin = Number(app.db.prepare("INSERT INTO admin_users(email,name,password_hash,role) VALUES ('admin@example.test','CAI',?,'admin')").run(hash).lastInsertRowid);
    const users: Record<string, StudentUser> = {}, cookies: Record<string, string> = {};
    for (const name of ['alice', 'bob', 'outside']) {
        const receipt = accessRepository(app.db).submit(validateSubmission({ firstName: 'Alumno', lastName: 'Ficticio', birthDate: '2000-01-01', email: name + '@example.test', filledBy: 'alumno', program: 'Business English', group: name === 'outside' ? 'Viernes · 18:00' : 'Mar y jue · 19:30', displayName: name + ' F.', avatarColor: '#1f56d6', visibility: 'privado', message: '', guardianConsent: false, acceptRules: true, acceptPrivacy: true }), randomUUID());
        accessRepository(app.db).decide(receipt.id, 1, 'approve', admin);
        app.db.prepare('INSERT INTO student_accounts VALUES (?,?,?)').run(Number(receipt.id.slice(4)), hash, new Date().toISOString());
        users[name] = (await studentAccounts(app.db).login(name + '@example.test', password))!;
    }
    const call = (route: string, method = 'GET', data?: unknown, who = 'alice', key?: string, origin = base) => fetch(base + '/api/local' + route, { method, headers: { Origin: origin, Cookie: cookies[who] ?? '', ...(data === undefined ? {} : { 'Content-Type': 'application/json' }), ...(key ? { 'Idempotency-Key': key } : {}) }, body: data === undefined ? undefined : JSON.stringify(data) });
    for (const name of ['admin', 'alice', 'bob', 'outside']) {
        const r = await call(name === 'admin' ? '/auth/login' : '/student/login', 'POST', { email: name + '@example.test', password }, 'anonymous');
        assert.equal(r.status, 200);
        cookies[name] = r.headers.getSetCookie().at(-1)!.split(';')[0]!;
    }
    const repo = learningRepository(app.db), alice = users.alice!, aliceId = Number(alice.id.slice(4)), publicId = publicProfileId(app.db, aliceId);
    const png = await sharp({ create: { width: 24, height: 20, channels: 3, background: '#1f56d6' } }).png().toBuffer(), dataUrl = 'data:image/png;base64,' + png.toString('base64');
    const draft: LearningDraft = { category: 'reading', title: 'Mi cuento en inglés', practice: 'Leí una historia y practiqué una expresión para pedir ayuda.', expression: 'give me a hand', example: 'Can you give me a hand with my homework?', state: 'completed', images: [{ data: dataUrl }] };
    let item: LearningAchievement, shared: LearningAchievement;
    const mine = async () => (await (await call('/student/achievements')).json()) as {
        items: LearningAchievement[];
        nextCursor: number | null;
    };
    const current = (id: number) => repo.mine(alice).items.find(item => item.id === id)!;
    const submit = (value: LearningAchievement, share = false) => call(`/student/achievements/${value.id}/submit`, 'POST', { revision: value.revision, share, confirmed: true });
    const review = (value: LearningAchievement, decision = 'approve') => call(`/achievements/${value.id}/review`, 'POST', { revision: value.revision, decision, reason: 'Comprobé el ejemplo y el aprendizaje; motivo privado.', confirmed: true }, 'admin');
    await t.test('autenticación, catálogo progresivo y cierre de solicitudes nuevas', async () => {
        assert.equal((await call('/student/achievements', 'GET', undefined, 'anonymous')).status, 401);
        assert.equal((await call('/achievements/reviews')).status, 401);
        assert.equal(badgeDefinitions.length, 21);
        assert.equal(new Set(badgeDefinitions.map(item => item.id)).size, 21);
        const response = await call('/student/badge-requests', 'POST', { badgeId: 'book-buddy', description: 'Leí una historia que quiero registrar como logro.' }, 'alice', randomUUID());
        assert.equal(response.status, 410);
    });
    await t.test('guardado de borrador y completado no publica ni solicita revisión', async () => {
        const r = await call('/student/achievements', 'POST', { ...draft, state: 'draft' }, 'alice', randomUUID());
        assert.equal(r.status, 201);
        item = (await r.json() as {
            item: LearningAchievement;
        }).item;
        assert.equal(item.review, 'none');
        assert.equal(item.publication, null);
        assert.equal((await (await call('/achievements/reviews', 'GET', undefined, 'admin')).json() as {
            items: unknown[];
        }).items.length, 0);
        const update = await call('/student/achievements/' + item.id, 'PATCH', { ...draft, images: item.images.map(image => ({ id: image.id })), revision: item.revision }, 'alice', randomUUID());
        assert.equal(update.status, 200);
        item = (await update.json() as {
            item: LearningAchievement;
        }).item;
        assert.equal(item.state, 'completed');
        assert.equal((await (await call('/student/posts', 'GET', undefined, 'bob')).json() as {
            posts: unknown[];
        }).posts.length, 0);
    });
    await t.test('imágenes privadas: dueño sí; compañeros y coordinación no enviada, no', async () => {
        const image = item.images[0]!.imagePath.slice('/api/local'.length);
        for (const [who, expected] of [['alice', 200], ['bob', 404], ['outside', 404], ['admin', 404], ['anonymous', 401]] as const)
            assert.equal((await call(image, 'GET', undefined, who)).status, expected);
        const response = await call(image);
        assert.match(response.headers.get('cache-control')!, /no-store/);
        const meta = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
        assert.equal(meta.format, 'webp');
        assert.equal(meta.exif, undefined);
    });
    await t.test('rechaza inyección de propietario, imágenes ajenas, SVG, corrupción y límites', async () => {
        for (const data of [{ ...draft, studentId: users.bob!.id }, { ...draft, images: [{ id: item.images[0]!.id }] }, { ...draft, images: [{ data: 'data:image/svg+xml;base64,PHN2Zy8+' }] }, { ...draft, images: [{ data: 'data:image/png;base64,YWJj' }] }, { ...draft, images: Array(4).fill({ data: dataUrl }) }, { ...draft, title: 'x', practice: 'corto' }])
            assert.equal((await call('/student/achievements', 'POST', data, 'bob', randomUUID())).status, 400);
        await assert.rejects(repo.save(alice, null, draft, randomUUID(), () => false), { status: 401 });
        const large = { ...draft, images: [{ data: 'data:image/png;base64,' + Buffer.alloc(3 * 1024 * 1024 + 1).toString('base64') }] };
        assert.equal((await call('/student/achievements', 'POST', large, 'alice', randomUUID())).status, 400);
    });
    await t.test('reintentos idempotentes y revisión optimista sin sobrescritura ajena', async () => {
        const key = randomUUID(), r = await call('/student/achievements', 'POST', { ...draft, title: 'Otro cuento' }, 'alice', key);
        assert.equal(r.status, 201);
        const first = (await r.json() as {
            item: LearningAchievement;
        }).item;
        assert.equal((await call('/student/achievements', 'POST', { ...draft, title: 'Otro cuento' }, 'alice', key)).status, 201);
        assert.equal((await call('/student/achievements', 'POST', { ...draft, title: 'Texto distinto' }, 'alice', key)).status, 409);
        const edit = { ...draft, title: 'Otra versión', images: [], revision: first.revision }, editKey = randomUUID();
        assert.equal((await call('/student/achievements/' + first.id, 'PATCH', edit, 'alice', editKey)).status, 200);
        assert.equal((await call('/student/achievements/' + first.id, 'PATCH', edit, 'alice', editKey)).status, 200);
        assert.equal((await call('/student/achievements/' + first.id, 'PATCH', { ...edit, title: 'Sobre escritura' }, 'alice', randomUUID())).status, 409);
        assert.equal((await call('/student/achievements/' + first.id, 'PATCH', edit, 'bob', randomUUID())).status, 404);
    });
    await t.test('validación privada, corrección y reenvío sin publicación', async () => {
        assert.equal((await submit(item)).status, 200);
        assert.equal((await (await call('/badge-counts', 'GET', undefined, 'admin')).json() as {counts:{pending:number}}).counts.pending, 1);
        item = current(item.id);
        assert.equal((await call(item.images[0]!.imagePath.slice(10), 'GET', undefined, 'admin')).status, 200);
        assert.equal((await review(item, 'reject')).status, 200);
        item = current(item.id);
        assert.equal(item.review, 'changes');
        const r = await call('/student/achievements/' + item.id, 'PATCH', { ...draft, images: item.images.map(image => ({ id: image.id })), revision: item.revision }, 'alice', randomUUID());
        assert.equal(r.status, 200);
        item = (await r.json() as {
            item: LearningAchievement;
        }).item;
        assert.equal((await submit(item)).status, 200);
        item = current(item.id);
        assert.equal((await review(item)).status, 200);
        item = current(item.id);
        assert.equal(item.review, 'approved');
        assert.ok(item.validatedAt);
        assert.equal(item.publication, null);
        assert.equal((await call('/student/achievements/' + item.id, 'PATCH', { ...draft, revision: item.revision }, 'alice', randomUUID())).status, 409);
    });
    await t.test('validación opcional; tres experiencias distintas obtienen insignia sin pedirla', async () => {
        for (const title of ['Segundo cuento', 'Tercer cuento']) {
            const created = await repo.save(alice, null, { ...draft, title, images: [] }, randomUUID(), () => true);
            const sent = repo.submit(alice, created.id, { revision: created.revision, share: false, confirmed: true });
            repo.decide(sent.id, { revision: sent.revision, decision: 'approve', reason: 'Aprendizaje verificado en privado.', confirmed: true }, admin);
        }
        const badges = badgesRepository(app.db), snapshot = badges.snapshot(alice);
        assert.ok(snapshot.grants.some(grant => grant.badge.id === 'book-buddy'));
        assert.equal(snapshot.catalog.find(badge => badge.id === 'book-silver')!.progress, 3);
        const count = app.db.prepare('SELECT COUNT(*) AS n FROM badge_grants').get()!.n;
        badges.snapshot(alice);
        assert.equal(app.db.prepare('SELECT COUNT(*) AS n FROM badge_grants').get()!.n, count);
        const duplicate = await repo.save(alice, null, { ...draft, images: [] }, randomUUID(), () => true), sent = repo.submit(alice, duplicate.id, { revision: duplicate.revision, share: false, confirmed: true });
        repo.decide(sent.id, { revision: sent.revision, decision: 'approve', reason: 'Repetición no suma otra obra distinta.', confirmed: true }, admin);
        assert.equal(badges.snapshot(alice).catalog.find(badge => badge.id === 'book-silver')!.progress, 3);
    });
    await t.test('perfil solo comparte insignias: no filtra logros privados, motivos o totales', async () => {
        const response = await call('/student/members/' + publicId, 'GET', undefined, 'bob');
        assert.equal(response.status, 200);
        const profile = await response.json() as SocialProfile;
        assert.equal(profile.posts.length, 0);
        assert.ok(profile.badges.some(grant => grant.badge.id === 'book-buddy'));
        assert.ok(!JSON.stringify(profile).includes(draft.practice));
        assert.ok(!JSON.stringify(profile).includes('Comprobé el ejemplo y el aprendizaje; motivo privado.'));
        assert.ok(!JSON.stringify(profile).includes('@'));
        assert.equal((await call('/student/members/' + publicId, 'GET', undefined, 'outside')).status, 200);
    });
    await t.test('publicación voluntaria comparte las imágenes solo después de aprobar', async () => {
        assert.equal((await submit(item, true)).status, 200);
        shared = current(item.id);
        assert.ok(shared.publication);
        const before = (await (await call('/student/posts', 'GET', undefined, 'bob')).json()) as {
            posts: unknown[];
        };
        assert.equal(before.posts.length, 0);
        assert.equal((await call(shared.images[0]!.imagePath.slice(10), 'GET', undefined, 'bob')).status, 404);
        const response = await call('/posts/' + shared.publication!.id + '/approve', 'POST', { revision: shared.publication!.revision, confirmed: true }, 'admin');
        assert.equal(response.status, 200);
        shared = current(item.id);
        const profile = await (await call('/student/members/' + publicId, 'GET', undefined, 'bob')).json() as SocialProfile;
        assert.equal(profile.posts[0]!.learningId, item.id);
        assert.equal(profile.posts[0]!.photos!.length, 1);
        assert.equal((await call(shared.images[0]!.imagePath.slice(10), 'GET', undefined, 'bob')).status, 200);
        assert.equal((await call(shared.images[0]!.imagePath.slice(10), 'GET', undefined, 'outside')).status, 200);
        assert.equal((await (await call('/student/gallery', 'GET', undefined, 'bob')).json() as {
            images: unknown[];
        }).images.length, 0);
    });
    await t.test('retirada y pausa no borran validación ni vuelven a publicar', async () => {
        const value = shared.publication!;
        assert.equal((await call('/student/posts/' + value.id + '/withdraw', 'POST', { revision: value.revision })).status, 200);
        assert.equal((await call(shared.images[0]!.imagePath.slice(10), 'GET', undefined, 'bob')).status, 404);
        item = current(item.id);
        assert.ok(item.validatedAt);
        assert.equal(item.review, 'approved');
        assert.equal((await (await call('/student/members/' + publicId, 'GET', undefined, 'bob')).json() as SocialProfile).posts.length, 0);
        assert.ok(badgesRepository(app.db).snapshot(alice).grants.some(grant => grant.badge.id === 'book-buddy'));
    });
    await t.test('revisión pública integrada valida el logro, sin doble concesión ni estados contradictorios', async () => {
        const created = await repo.save(alice, null, { ...draft, title: 'Una película nueva', category: 'screen', images: [] }, randomUUID(), () => true);
        let sent = repo.submit(alice, created.id, { revision: created.revision, share: true, confirmed: true });
        assert.equal((await review(sent)).status, 200);
        sent = current(sent.id);
        assert.ok(sent.validatedAt);
        assert.equal(sent.reason, 'Comprobé el ejemplo y el aprendizaje; motivo privado.');
        assert.equal(sent.publication!.status, 'publicada');
        assert.equal((await review(sent)).status, 409);
    });
    await t.test('retirar revisión privada permite editar sin dejar acceso a coordinación', async () => {
        let created = await repo.save(alice, null, { ...draft, title: 'Mi siguiente lectura' }, randomUUID(), () => true);
        created = repo.submit(alice, created.id, { revision: created.revision, share: false, confirmed: true });
        assert.equal((await call('/student/achievements/' + created.id + '/cancel', 'POST', { revision: created.revision })).status, 200);
        created = current(created.id);
        assert.equal(created.review, 'none');
        assert.equal((await call(created.images[0]!.imagePath.slice(10), 'GET', undefined, 'admin')).status, 404);
    });
    await t.test('reglas de plata y oro, obras duplicadas y publicaciones originales aprobadas', async () => {
        for (let index = 0; index < 25; index++) {
            const value = await repo.save(alice, null, { ...draft, title: 'Canción distinta ' + index, category: 'music', images: [] }, randomUUID(), () => true);
            const sent = repo.submit(alice, value.id, { revision: value.revision, share: false, confirmed: true });
            repo.decide(sent.id, { revision: sent.revision, decision: 'approve', reason: 'Verificado en la fixture de aprendizaje.', confirmed: true }, admin);
        }
        const snapshot = badgesRepository(app.db).snapshot(alice);
        for (const id of ['music-catcher', 'music-silver', 'music-gold'])
            assert.ok(snapshot.grants.some(grant => grant.badge.id === id));
        const posts = publications(app.db);
        for (let index = 0; index < 5; index++) {
            const post = posts.create(alice, { title: 'Publicación original ' + index, body: 'Aprendí una expresión distinta en la práctica de hoy ' + index, category: 'experience' }, randomUUID());
            posts.decide(post.id, post.revision, 'approve', admin, undefined, true);
        }
        assert.ok(badgesRepository(app.db).snapshot(alice).grants.some(grant => grant.badge.id === 'stories-5'));
    });
    await t.test('paginación propia y social no duplican ni exponen otra cuenta', async () => {
        const first = await mine();
        assert.equal(first.items.length, 20);
        assert.ok(first.nextCursor);
        const second = await (await call('/student/achievements?before=' + first.nextCursor)).json() as {
            items: LearningAchievement[];
        };
        assert.ok(second.items.length > 0);
        assert.ok(second.items.every(item => item.id < first.nextCursor!));
        assert.equal((await (await call('/student/achievements', 'GET', undefined, 'bob')).json() as {
            items: unknown[];
        }).items.length, 0);
        assert.equal((await call('/student/achievements?before=NaN')).status, 400);
        assert.equal((await call('/student/achievements', 'POST', draft, 'alice', randomUUID(), 'https://otro.example')).status, 403);
    });
    await t.test('reintentos no cambian la intención privada/pública; edición tras rechazo y días de práctica', async () => {
        const saved = await repo.save(alice, null, { ...draft, title: 'Revisión con intención explícita', images: [] }, randomUUID(), () => true), value = { revision: saved.revision, share: true, confirmed: true };
        const pending = repo.submit(alice, saved.id, value);
        assert.equal(repo.submit(alice, saved.id, value).id, saved.id);
        assert.throws(() => repo.submit(alice, saved.id, { ...value, share: false }), { status: 409 });
        repo.decide(pending.id, { revision: pending.revision, decision: 'reject', reason: 'Explica un poco más tu ejemplo personal.', confirmed: true }, admin);
        const rejected = current(saved.id), updated = await repo.save(alice, saved.id, { ...draft, title: 'Revisión corregida', images: [], revision: rejected.revision }, randomUUID(), () => true);
        assert.equal(updated.publication, null);
        assert.equal(updated.review, 'none');
        const { challengesRepository } = await import('../challenges.ts');
        for (let day = 1; day <= 7; day++) {
            const challenges = challengesRepository(app.db, () => new Date(`2026-11-${String(day).padStart(2, '0')}T18:00:00Z`));
            for (const question of challenges.snapshot(users.bob!).items)
                challenges.answer(users.bob!, question.id, { revision: question.revision, answerIndex: 0 }, randomUUID());
        }
        const snapshot = badgesRepository(app.db).snapshot(users.bob!);
        assert.ok(snapshot.grants.some(grant => grant.badge.id === 'practice-7'));
        assert.equal(snapshot.catalog.find(badge => badge.id === 'practice-30')!.progress, 7);
    });
    await t.test('copia consistente incluye logros, imágenes e historial; reinicio sin inventar concesiones', async () => {
        const backup = await backupLocalDatabase(path, join(dir, 'backup'));
        assert.equal((await verifyLocalBackup(backup)).schema, 22);
        const db = openDatabase(backup);
        try {
            assert.equal(db.prepare('SELECT COUNT(*) AS n FROM learning_achievements').get()!.n, app.db.prepare('SELECT COUNT(*) AS n FROM learning_achievements').get()!.n);
            assert.deepEqual(db.prepare('SELECT * FROM learning_images ORDER BY id').all(), app.db.prepare('SELECT * FROM learning_images ORDER BY id').all());
            assert.equal(db.prepare('PRAGMA foreign_key_check').all().length, 0);
        }
        finally {
            db.close();
        }
    });
    console.log('Fixture de aprendizaje conservada en ' + dir);
});
