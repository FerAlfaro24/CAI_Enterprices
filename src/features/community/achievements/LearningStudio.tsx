import { useEffect, useId, useRef, useState } from 'react';
import type { LearningAchievement, LearningCategory, LearningDraft } from '../../../../server/contracts';
import type { CommunityConnection } from '../connection';
import { learningApi } from '../../local-access/api';
import { useCommunityDialog } from '../useCommunityDialog';
import { useCommunityDialogs } from '../dialogContext';
import { MotionButton } from '../components/CommunityMotion';
import s from './learning.module.css';
const activities = {
    reading: { symbol: '📚', title: 'Lectura', hint: 'Un cuento, un capítulo, un artículo. Cada página cuenta.', prompt: '¿Qué leíste y qué entendiste?', example: 'Leí un cuento corto sin traducir cada palabra. Entendí quién era el personaje y qué buscaba.', expression: 'Por ejemplo: once upon a time', color: 'mint' },
    screen: { symbol: '🎬', title: 'Cine y series', hint: 'Una escena o un episodio. Escucha con otros oídos.', prompt: '¿Qué viste y cómo practicaste?', example: 'Vi una escena con subtítulos en inglés y la repetí sin ellos. Practiqué cómo pedir ayuda.', expression: 'Por ejemplo: give me a hand', color: 'peach' },
    music: { symbol: '🎵', title: 'Música', hint: 'Tu canción favorita también puede enseñarte algo.', prompt: '¿Qué escuchaste y qué descubriste?', example: 'Escuché una canción y reconocí una expresión que no entendía. Después practiqué su pronunciación.', expression: 'Por ejemplo: take your time', color: 'purple' },
} as const;
const status = { none: 'Solo para mí', pending: 'En revisión', approved: 'Validado por CAI', changes: 'Necesita un ajuste' };
function readFile(file: File): Promise<string> { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('No pudimos leer la imagen.')); reader.readAsDataURL(file); }); }
export function LearningEditor({ item, category, connection, onClose }: {
    item: LearningAchievement | null;
    category: LearningCategory;
    connection: CommunityConnection;
    onClose: () => void;
}) {
    const ref = useCommunityDialog(), id = useId(), heading = useRef<HTMLHeadingElement>(null);
    const [draft, setDraft] = useState<LearningDraft>(item ? { category: item.category, title: item.title, practice: item.practice, expression: item.expression, example: item.example, state: item.state, images: item.images.map(image => ({ id: image.id })) } : { category, title: '', practice: '', expression: '', example: '', state: 'draft', images: [] });
    const [step, setStep] = useState(0), [error, setError] = useState(''), [reading, setReading] = useState(false);
    const request = useRef({ fingerprint: '', key: crypto.randomUUID() }), alive = useRef(true);
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    const activity = activities[draft.category];
    const source = (image: LearningDraft['images'][number]) => 'data' in image ? image.data : item?.images.find(value => value.id === image.id)?.imagePath;
    const move = (next: number) => { setError(''); setStep(next); requestAnimationFrame(() => heading.current?.focus()); };
    const next = () => { if (step === 1 && !draft.title.trim()) {
        setError('Ponle un título para reconocer tu logro.');
        return;
    } move(step + 1); };
    const files = async (list: FileList | null) => {
        if (!list)
            return;
        const selected = Array.from(list);
        if (draft.images.length + selected.length > 3 || selected.some(file => !['image/jpeg', 'image/png'].includes(file.type) || file.size > 3 * 1024 * 1024)) {
            setError('Puedes añadir hasta tres imágenes JPEG o PNG de 3 MB cada una.');
            return;
        }
        setReading(true);
        setError('');
        try {
            const images = await Promise.all(selected.map(readFile));
            if (alive.current)
                setDraft(old => ({ ...old, images: [...old.images, ...images.map(data => ({ data }))] }));
        }
        catch (error) {
            if (alive.current)
                setError((error as Error).message);
        }
        finally {
            if (alive.current)
                setReading(false);
        }
    };
    const save = async (state: 'draft' | 'completed') => {
        if (connection.busy || reading)
            return;
        if (!draft.title.trim() || (state === 'completed' && (draft.title.trim().length < 4 || draft.practice.trim().length < 20 || draft.expression.trim().length < 2 || draft.example.trim().length < 5))) {
            setError('Para completar, usa un título de cuatro caracteres, cuenta tu práctica (20 caracteres), añade una expresión y un ejemplo propio. También puedes guardar un borrador.');
            return;
        }
        const value = { ...draft, state }, fingerprint = JSON.stringify(value);
        if (request.current.fingerprint !== fingerprint)
            request.current = { fingerprint, key: crypto.randomUUID() };
        if (await connection.saveAchievement(item?.id ?? null, value, request.current.key, item?.revision))
            onClose();
    };
    return <dialog ref={ref} className={s.editor} aria-labelledby={id + '-heading'} onCancel={event => { event.preventDefault(); if (!connection.busy && !reading)
        onClose(); }}>
  <header className={s.editorTop}><span>REGISTRA TU LOGRO</span><button type="button" aria-label="Cerrar registro de logro" disabled={connection.busy || reading} onClick={onClose}>✕</button></header>
  <nav className={s.steps} aria-label="Pasos del logro">{['Actividad', 'Tu experiencia', 'Lo aprendido', 'Vista previa'].map((label, index) => <span key={label} aria-current={step === index ? 'step' : undefined}><b>{index + 1}</b>{label}</span>)}</nav>
  <div className={s.editorBody}><h2 ref={heading} tabIndex={-1} id={id + '-heading'}>{['¿Cómo practicaste tu inglés?', 'Ponle tu toque personal', '¿Qué te llevas contigo?', 'Así se verá tu logro'][step]}</h2>
  <fieldset disabled={connection.busy || reading}>
  {step === 0 && <><p>Elige algo que disfrutes. Puedes volver tantas veces como quieras.</p><div className={s.choices}>{Object.entries(activities).map(([key, value]) => <button type="button" key={key} aria-pressed={draft.category === key} onClick={() => setDraft(old => ({ ...old, category: key as LearningCategory }))}><span>{value.symbol}</span><strong>{value.title}</strong><small>{value.hint}</small></button>)}</div></>}
  {step === 1 && <><label htmlFor={id + '-title'}>¿Qué libro, película, episodio o canción elegiste?</label><input id={id + '-title'} value={draft.title} maxLength={100} onChange={event => setDraft({ ...draft, title: event.target.value })} placeholder="El nombre de tu descubrimiento"/><label htmlFor={id + '-images'}>Dale una imagen <small>Opcional · hasta 3 JPEG/PNG · 3 MB cada una</small></label><input id={id + '-images'} type="file" accept="image/jpeg,image/png" multiple onChange={event => { void files(event.target.files); event.target.value = ''; }}/><p className={s.help}>Una portada, un cartel o una foto de tu actividad. Añade imágenes que puedas compartir.</p><div className={s.attachments}>{draft.images.map((image, index) => <figure key={index}><img src={source(image)} alt={'Imagen adjunta ' + (index + 1)}/><button type="button" onClick={() => setDraft({ ...draft, images: draft.images.filter((_, i) => i !== index) })} aria-label={'Quitar imagen ' + (index + 1)}>Quitar</button></figure>)}</div></>}
  {step === 2 && <><p>Cuéntalo con tus palabras. Puedes explicarte en español y probar tu ejemplo en inglés.</p><label htmlFor={id + '-practice'}>{activity.prompt}</label><textarea id={id + '-practice'} rows={3} maxLength={600} value={draft.practice} placeholder={activity.example} onChange={event => setDraft({ ...draft, practice: event.target.value })}/><label htmlFor={id + '-expression'}>Una palabra o expresión que descubriste</label><input id={id + '-expression'} maxLength={160} value={draft.expression} placeholder={activity.expression} onChange={event => setDraft({ ...draft, expression: event.target.value })}/><label htmlFor={id + '-example'}>Ahora úsala en una frase tuya</label><textarea id={id + '-example'} rows={2} maxLength={300} value={draft.example} placeholder="Can you give me a hand with my homework?" onChange={event => setDraft({ ...draft, example: event.target.value })}/><p className={s.help}>Inténtalo a tu ritmo. No necesitas copiar párrafos ni letras completas.</p></>}
  {step === 3 && <article className={s.preview}><span>{activity.symbol} {activity.title}</span><h3>{draft.title || 'Tu próximo descubrimiento'}</h3><div className={s.attachments}>{draft.images.map((image, index) => <img key={index} src={source(image)} alt={'Imagen del logro ' + (index + 1)}/>)}</div><p>{draft.practice || 'Aquí irá lo que practicaste.'}</p><blockquote>{draft.expression || 'Tu expresión nueva'}<small>{draft.example || 'Tu ejemplo personal'}</small></blockquote><p className={s.help}>Se guardará solo para ti. Después podrás pedir validación privada o enviarlo para publicar.</p></article>}
  </fieldset>
  {reading && <p role="status">Preparando imágenes…</p>}{(error || connection.error) && <p role="alert" className={s.error}>{error || connection.error}</p>}
  <footer className={s.editorActions}>{step > 0 && <button type="button" disabled={connection.busy || reading} onClick={() => move(step - 1)}>Volver</button>}<button type="button" disabled={connection.busy || reading} onClick={() => { void save('draft'); }}>Guardar borrador</button>{step < 3 ? <MotionButton className={s.primary} disabled={connection.busy || reading} type="button" onClick={next}>Continuar</MotionButton> : <MotionButton className={s.primary} type="button" disabled={connection.busy || reading} onClick={() => { void save('completed'); }}>{connection.busy ? 'Guardando…' : 'Guardar mi logro'}</MotionButton>}</footer></div>
 </dialog>;
}
export function LearningStudio({ connection }: {
    connection: CommunityConnection;
}) {
    const [editor, setEditor] = useState<{
        item: LearningAchievement | null;
        category: LearningCategory;
    } | null>(null), [older, setOlder] = useState<LearningAchievement[]>([]), [cursor, setCursor] = useState<number | null | undefined>(undefined), [loading, setLoading] = useState(false), [error, setError] = useState('');
    const run = async (operation: Promise<boolean>) => { if (await operation) {
        setOlder([]);
        setCursor(undefined);
    } };
    const { setDetail } = useCommunityDialogs();
    const items = [...connection.achievements.items, ...older.filter(item => !connection.achievements.items.some(current => current.id === item.id))];
    const more = async () => { setLoading(true); setError(''); try {
        const page = await learningApi.mine(cursor === undefined ? connection.achievements.nextCursor ?? 0 : cursor ?? 0);
        setOlder(old => [...old, ...page.items]);
        setCursor(page.nextCursor);
    }
    catch (error) {
        connection.handleFailure(error);
        setError((error as Error).message);
    }
    finally {
        setLoading(false);
    } };
    return <div className={s.studio}><section className={s.start}><div><span className={s.kicker}>TU INGLÉS TAMBIÉN VIVE FUERA DEL AULA</span><h2>¿Qué descubriste hoy?</h2><p>Elige cómo practicar. Guarda tu experiencia para ti o compártela cuando quieras.</p></div><span className={s.bigSpark} aria-hidden="true">✦</span></section><div className={s.choices}>{Object.entries(activities).map(([category, activity]) => <MotionButton type="button" key={category} className={s[activity.color]} onClick={() => setEditor({ item: null, category: category as LearningCategory })}><span>{activity.symbol}</span><strong>{activity.title}</strong><small>{activity.hint}</small><b>Registrar logro</b></MotionButton>)}</div>
 <header className={s.collectionHeading}><div><h2>Tu historia de aprendizaje</h2><p>Un logro es lo que haces. Una insignia reconoce tu recorrido.</p></div></header>
 {!items.length && <div className={s.empty}><span aria-hidden="true">🌱</span><h3>Algo pequeño puede ser tu primer logro.</h3><p>Prueba con una escena, una página o una canción. Elige una tarjeta para empezar.</p></div>}
 <div className={s.collection}>{items.map(item => { const activity = activities[item.category], pending = item.review === 'pending', editable = !pending && !item.validatedAt && (!item.publication || ['rechazada', 'retirada'].includes(item.publication.status)), shared = item.publication?.status === 'publicada', postPending = item.publication?.status === 'pendiente'; return <article key={item.id} className={s.learningCard}><div className={s.cardTop}><span>{activity.symbol} {activity.title}</span><span className={s.state}>{item.state === 'draft' ? 'Borrador' : status[item.review]}</span></div>{item.images.length > 0 && <div className={s.photoRow}>{item.images.map(image => <img key={image.id} src={image.imagePath} alt={'Imagen de ' + item.title} loading="lazy"/>)}</div>}<h3>{item.title}</h3><p>{item.practice || 'Tu experiencia está empezando.'}</p>{item.expression && <blockquote>{item.expression}<small>{item.example}</small></blockquote>}<p className={s.help}>{shared ? 'Compartido con la comunidad' : postPending ? 'Publicación en revisión' : pending ? 'Validación privada: no se publicará' : 'Solo tú puedes ver este logro aquí.'}</p>{item.reason && <p className={s.feedback}><b>Coordinación:</b> {item.reason}</p>}<div className={s.cardActions}>{editable && <button type="button" onClick={() => setEditor({ item, category: item.category })}>Editar logro</button>}{item.state === 'completed' && !pending && !postPending && !shared && <><button type="button" className={s.primary} disabled={connection.busy || !connection.submissionsOpen} onClick={() => { void run(connection.submitAchievement(item, true)); }}>Enviar para publicar</button>{!item.validatedAt && <button type="button" disabled={connection.busy} onClick={() => { void run(connection.submitAchievement(item, false)); }}>Validar sin publicar</button>}</>}{pending && <button type="button" disabled={connection.busy} onClick={() => { void run(connection.cancelAchievement(item)); }}>Retirar solicitud</button>}{shared && <><button type="button" onClick={() => setDetail({ postId: item.publication!.id, comments: false })}>Ver publicación</button><button type="button" disabled={connection.busy} onClick={() => { void run(connection.withdrawAchievement(item.publication!)); }}>Dejar de compartir</button></>}{postPending && !pending && <button type="button" disabled={connection.busy} onClick={() => { void run(connection.withdrawAchievement(item.publication!)); }}>Retirar publicación</button>}</div></article>; })}</div>
 {(cursor === undefined ? connection.achievements.nextCursor : cursor) && <button type="button" disabled={loading} onClick={() => { void more(); }}>Ver logros anteriores</button>}{error && <p role="alert">{error}</p>}{editor && <LearningEditor key={editor.item?.id ?? editor.category} {...editor} connection={connection} onClose={() => { setEditor(null); setOlder([]); setCursor(undefined); }}/>}</div>;
}
