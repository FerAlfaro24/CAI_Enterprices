import { useEffect, useRef, useState } from 'react';
import { learningApi } from '../../local-access/api';
import type { LearningReview } from '../../../../server/contracts';
import s from '../admin.module.css';
function ReviewCard({ item, onSaved, onFailure }: {
    item: LearningReview;
    onSaved: () => Promise<void>;
    onFailure: (error: unknown) => void;
}) {
    const [reason, setReason] = useState(''), [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(''), sending = useRef(false);
    const decide = async (decision: 'approve' | 'reject') => {
        if (sending.current)
            return;
        if (!confirmed || reason.trim().length < 8) {
            setError('Escribe un motivo de al menos ocho caracteres y confirma que revisaste el logro.');
            return;
        }
        sending.current = true;
        setBusy(true);
        setError('');
        try {
            await learningApi.decide(item, decision, reason);
            await onSaved();
        }
        catch (error) {
            onFailure(error);
            setError((error as Error).message);
        }
        finally {
            sending.current = false;
            setBusy(false);
        }
    };
    return <article className={s.card} aria-label={'Revisar logro ' + item.id}><h3 className={s['card-title']}>{item.title}</h3><p>{item.studentName} · {item.studentId}</p><p><strong>{item.publication ? 'Solicita publicar con su grupo' : 'Validación privada; no publicar'}</strong></p><p style={{ whiteSpace: 'pre-wrap' }}>{item.practice}</p><blockquote>{item.expression}<p>{item.example}</p></blockquote><div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{item.images.map(image => <a key={image.id} href={image.imagePath} target="_blank" rel="noreferrer"><img src={image.imagePath} alt={'Evidencia de ' + item.title} style={{ width: 150, height: 140, objectFit: 'contain', borderRadius: 12 }}/></a>)}</div><label className={s.field}>Motivo privado para el alumno<textarea value={reason} onChange={event => setReason(event.target.value)} maxLength={240} rows={2} disabled={busy}/></label><label className={s.confirm}><input type="checkbox" checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)}/>Revisé el aprendizaje, las imágenes y la privacidad.</label>{error && <p role="alert" className={s.alert}>{error}</p>}<div className={s['head-actions']}><button type="button" className={`${s.btn} ${s['btn--primary']}`} disabled={busy} onClick={() => { void decide('approve'); }}>{item.publication ? 'Validar y publicar' : 'Validar en privado'}</button><button type="button" className={s.btn} disabled={busy} onClick={() => { void decide('reject'); }}>Pedir un ajuste</button></div></article>;
}
export function LearningReviews({ onFailure, onSaved }: {
    onSaved: () => Promise<void>;
    onFailure: (error: unknown) => void;
}) {
    const [items, setItems] = useState<LearningReview[]>([]), [next, setNext] = useState<number | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), sequence = useRef(0);
    const load = async (before = 0) => { const version = ++sequence.current; setLoading(true); try {
        const page = await learningApi.reviews(before);
        if (version === sequence.current) {
            setItems(old => before ? [...old, ...page.items] : page.items);
            setNext(page.nextCursor);
            setError('');
        }
    }
    catch (error) {
        if (version === sequence.current) {
            setItems([]);
            onFailure(error);
            setError((error as Error).message);
        }
    }
    finally {
        if (version === sequence.current)
            setLoading(false);
    } };
    useEffect(() => { const generation = sequence; let active = true; void learningApi.reviews().then(page => { if (active) {
        setItems(page.items);
        setNext(page.nextCursor);
    } }).catch(error => { if (active)
        setError((error as Error).message); }).finally(() => { if (active)
        setLoading(false); }); return () => { active = false; generation.current++; }; }, []);
    return <section aria-label="Revisión de logros"><div className={s['page-head']}><div><h2>Logros por revisar</h2><p>Valida el aprendizaje. Solo publica cuando el alumno lo haya solicitado.</p></div><button type="button" className={s.btn} disabled={loading} onClick={() => { void load(); }}>Actualizar logros</button></div>{error && <p role="alert" className={s.alert}>{error}</p>}{loading && <p role="status">Cargando logros…</p>}{!loading && !items.length && !error && <p className={s.card}>Todo al día. No hay logros pendientes.</p>}<div className={s['post-grid']}>{items.map(item => <ReviewCard key={item.id + ':' + item.revision} item={item} onSaved={async () => { await load(); await onSaved(); }} onFailure={onFailure}/>)}</div>{next && <button className={s.btn} disabled={loading} type="button" onClick={() => { void load(next); }}>Ver logros anteriores</button>}</section>;
}
