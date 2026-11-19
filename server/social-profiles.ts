import type { Database } from './database.ts';
import type { BadgeSpec, SocialProfile, StudentUser, Submission } from './contracts.ts';
import { publications } from './publications.ts';
import { HttpError } from './validation.ts';
export function socialProfiles(db: Database) {
    return (user: StudentUser, id: string, before = 0): SocialProfile => {
        const own = db.prepare("SELECT r.payload FROM requests r JOIN students s ON s.request_id=r.id WHERE r.id=? AND r.status='aprobada' AND s.status='activo'").get(Number(user.id.slice(4)));
        if (!own)
            throw new HttpError(401, 'Tu acceso terminó.');
        const viewer = JSON.parse(String(own.payload)) as Submission;
        const target = id === 'cai-team' ? null : db.prepare("SELECT r.id,r.payload FROM public_profiles x JOIN requests r ON r.id=x.request_id JOIN students s ON s.request_id=r.id WHERE x.public_id=? AND r.status='aprobada' AND s.status='activo'").get(id);
        if (id !== 'cai-team' && !target)
            throw new HttpError(404, 'Este perfil no está disponible.');
        const profile = target ? JSON.parse(String(target.payload)) as Submission : null;
        if (profile && (profile.group === 'Por asignar' || profile.group !== viewer.group || profile.program !== viewer.program) && Number(target!.id) !== Number(user.id.slice(4)))
            throw new HttpError(404, 'Este perfil no está disponible para tu grupo.');
        const posts = publications(db).feed(user).filter(post => post.author.id === id && (!before || Number(post.id.slice(4)) < before)).sort((a, b) => Number(b.id.slice(4)) - Number(a.id.slice(4))).slice(0, 21);
        const grants = target ? db.prepare("SELECT id,badge_json,awarded_at FROM badge_grants WHERE student_id=? AND status='active' ORDER BY id DESC").all(Number(target.id)) : [];
        return { member: { id, displayName: profile?.displayName ?? 'Equipo CAI', avatarColor: profile?.avatarColor ?? '#1f56d6' }, posts: posts.slice(0, 20), nextCursor: posts.length > 20 ? Number(posts[19]!.id.slice(4)) : null, badges: grants.map(row => ({ id: 'BDG-' + String(row.id).padStart(4, '0'), badge: JSON.parse(String(row.badge_json)) as BadgeSpec, awardedAt: String(row.awarded_at) })) };
    };
}
