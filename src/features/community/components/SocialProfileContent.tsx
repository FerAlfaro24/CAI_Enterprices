import { useEffect, useRef, useState } from 'react';
import type { SocialProfile } from '../../../../server/contracts';
import type { CommunityConnection } from '../connection';
import { learningApi } from '../../local-access/api';
import { BadgeArtwork } from '../achievements/BadgeArtwork';
import { useCommunityDialogs } from '../dialogContext';
import s from '../achievements/learning.module.css';
export function SocialProfileContent({ memberId, connection, onClose }: {
    memberId: string;
    connection: CommunityConnection;
    onClose: () => void;
}) {
    const [data, setData] = useState<SocialProfile | null>(null), [tab, setTab] = useState<'posts' | 'achievements' | 'badges'>('posts'), [loading, setLoading] = useState(true), [error, setError] = useState(''), sequence = useRef(0);
    const { setDetail } = useCommunityDialogs();
    const read = async (before = 0) => {
        const version = ++sequence.current;
        setLoading(true);
        setError('');
        try {
            const result = await learningApi.profile(memberId, before);
            if (version === sequence.current)
                setData(old => before && old ? { ...result, posts: [...old.posts, ...result.posts] } : result);
        }
        catch (error) {
            if (version === sequence.current) {
                setData(null);
                connection.handleFailure(error);
                setError((error as Error).message);
            }
        }
        finally {
            if (version === sequence.current)
                setLoading(false);
        }
    };
    useEffect(() => { const generation = sequence; let active = true; const version = ++sequence.current; void learningApi.profile(memberId).then(result => { if (active && sequence.current === version) {
        setData(result);
        setError('');
    } }).catch(error => { if (active && sequence.current === version) {
        setData(null);
        setError((error as Error).message);
    } }).finally(() => { if (active && sequence.current === version)
        setLoading(false); }); return () => { active = false; generation.current++; }; }, [memberId]);
    const posts = data?.posts.filter(post => tab !== 'achievements' || post.learningId !== undefined) ?? [];
    return <section aria-label={memberId === connection.user.publicId ? 'Mi perfil compartido' : 'Actividad compartida del compañero'}><h3>{memberId === connection.user.publicId ? 'Así se ve tu colección compartida' : 'Su recorrido en CAI'}</h3><p className={s.help}>Aquí aparecen sus publicaciones y logros compartidos e insignias. Los registros privados permanecen privados.</p><div className={s.socialTabs} role="group" aria-label="Colección del perfil">{([['posts', 'Publicaciones'], ['achievements', 'Logros'], ['badges', 'Insignias']] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</div>
 {error && <p role="alert">{error}<button type="button" onClick={() => { void read(); }}>Volver a cargar perfil</button></p>}{loading && <p role="status">Cargando colección…</p>}
 {tab === 'badges' ? <div className={s.socialBadges}>{data?.badges.map(grant => <article key={grant.id}><BadgeArtwork badgeId={grant.badge.id} symbol={grant.badge.symbol}/><h3>{grant.badge.title}</h3><small>{new Date(grant.awardedAt).toLocaleDateString('es-MX')}</small></article>)}{!loading && data && !data.badges.length && <p>Aún no hay insignias obtenidas.</p>}</div> : <div className={s.socialList}>{posts.map(post => <article className={s.socialPost} key={post.id}><h3>{post.title}</h3>{post.photos?.slice(0, 1).map(image => <img key={image.id} src={image.imagePath} alt={image.alt} loading="lazy"/>)}<p>{post.body.length > 220 ? post.body.slice(0, 220) + '…' : post.body}</p><button type="button" onClick={() => { onClose(); setDetail({ postId: post.id, comments: true }); }}>Ver publicación y comentarios</button></article>)}{!loading && data && !posts.length && <p>{tab === 'achievements' ? 'No hay logros compartidos en esta página.' : 'Todavía no hay publicaciones compartidas.'}</p>}{data?.nextCursor && <button type="button" disabled={loading} onClick={() => { void read(data.nextCursor!); }}>Ver actividad anterior</button>}</div>}
 </section>;
}
