import { useEffect, useId, useRef, useState } from 'react'
import type { LearningAchievement, LearningCategory, LearningDraft } from '../../../../server/contracts'
import { learningLimits } from '../../../../shared/learning'
import type { CommunityConnection } from '../connection'
import { learningApi } from '../../local-access/api'
import { useCommunityDialog } from '../useCommunityDialog'
import { useCommunityDialogs } from '../dialogContext'
import { MotionButton } from '../components/CommunityMotion'
import s from './learning.module.css'

const activities = {
  reading: { symbol: '📚', title: 'Lectura', hint: 'Un cuento, un capítulo, un artículo. Cada página cuenta.', name: 'Nombre del libro o lectura', work: 'The Little Prince', example: 'Entendí cómo describir a un personaje y aprendí a usar “kind” para hablar de alguien amable.', expression: 'Por ejemplo: once upon a time', color: 'mint' },
  screen: { symbol: '🎬', title: 'Cine y series', hint: 'Una escena o un episodio. Escucha con otros oídos.', name: 'Nombre de la película o serie', work: 'Friends · episodio 1', example: 'Aprendí una forma de pedir ayuda. Repetí la escena para practicar cómo se pronuncia.', expression: 'Por ejemplo: give me a hand', color: 'peach' },
  music: { symbol: '🎵', title: 'Música', hint: 'Tu canción favorita también puede enseñarte algo.', name: 'Nombre de la canción', work: 'Here Comes the Sun', example: 'Reconocí una frase que no entendía y practiqué su pronunciación escuchando la canción.', expression: 'Por ejemplo: take your time', color: 'purple' },
} as const
const status = { none: 'Solo para mí', pending: 'En revisión', approved: 'Validado por CAI', changes: 'Necesita un ajuste' }
function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('No pudimos leer la imagen.'))
    reader.readAsDataURL(file)
  })
}

export function LearningEditor({ item, category, connection, onClose }: {
  item: LearningAchievement | null; category: LearningCategory; connection: CommunityConnection; onClose: () => void
}) {
  const ref = useCommunityDialog(), id = useId()
  const [draft, setDraft] = useState<LearningDraft>(item ? {
    category: item.category, title: item.title, practice: item.practice, expression: item.expression,
    example: item.example, state: item.state, images: item.images.map(image => ({ id: image.id })),
  } : { category, title: '', practice: '', expression: '', example: '', state: 'draft', images: [] })
  const [error, setError] = useState(''), [reading, setReading] = useState(false)
  const request = useRef({ fingerprint: '', key: crypto.randomUUID() }), alive = useRef(true), processing = useRef(false)
  useEffect(() => { alive.current = true; return () => { alive.current = false } }, [])
  const activity = activities[draft.category], busy = connection.busy || reading
  const source = (image: LearningDraft['images'][number]) => 'data' in image ? image.data : item?.images.find(value => value.id === image.id)?.imagePath
  const files = async (list: FileList | null) => {
    if (!list || processing.current || connection.busy) return
    const selected = Array.from(list)
    if (draft.images.length + selected.length > 3 || selected.some(file => !['image/jpeg', 'image/png'].includes(file.type) || file.size > 3 * 1024 * 1024)) {
      setError('Puedes añadir hasta tres imágenes JPEG o PNG de 3 MB cada una.'); return
    }
    processing.current = true; setReading(true); setError('')
    try {
      const images = await Promise.all(selected.map(readFile))
      if (alive.current) setDraft(old => ({ ...old, images: [...old.images, ...images.map(data => ({ data }))] }))
    } catch (error) { if (alive.current) setError((error as Error).message) }
    finally { processing.current = false; if (alive.current) setReading(false) }
  }
  const save = async (state: 'draft' | 'completed') => {
    if (connection.busy || processing.current) return
    if (!draft.title.trim() || (state === 'completed' && !draft.practice.trim())) {
      setError(state === 'draft' ? 'Escribe el nombre para reconocer tu borrador.' : 'Escribe el nombre de la obra y qué aprendiste. Las palabras o frases y las imágenes son opcionales.')
      return
    }
    processing.current = true; setError('')
    const value = { ...draft, state }, fingerprint = JSON.stringify(value)
    if (request.current.fingerprint !== fingerprint) request.current = { fingerprint, key: crypto.randomUUID() }
    try { if (await connection.saveAchievement(item?.id ?? null, value, request.current.key, item?.revision)) onClose() }
    finally { processing.current = false }
  }
  return <dialog ref={ref} className={s.editor} aria-labelledby={id + '-heading'} onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <header className={s.editorTop}><span>TU APRENDIZAJE, A TU MANERA</span><button type="button" aria-label="Cerrar registro de logro" disabled={busy} onClick={onClose}>✕</button></header>
    <form className={s.editorBody} aria-label="Registrar logro" onSubmit={event => { event.preventDefault(); void save('completed') }}>
      <h2 id={id + '-heading'}>{item ? 'Tu logro' : 'Cuéntanos qué descubriste'}</h2>
      <p className={s.help}>El nombre va primero. Tu experiencia, debajo. Lo guardas en privado y después decides si quieres compartirlo.</p>
      <fieldset disabled={busy}>
        <div className={s.compactChoices} role="group" aria-label="Tipo de logro">{Object.entries(activities).map(([key, value]) => <button type="button" key={key} aria-pressed={draft.category === key} onClick={() => setDraft(old => ({ ...old, category: key as LearningCategory }))}><span aria-hidden="true">{value.symbol}</span> {value.title}</button>)}</div>
        <label htmlFor={id + '-title'}>{activity.name}</label>
        <input id={id + '-title'} required minLength={1} maxLength={learningLimits.titleMax} value={draft.title} placeholder={activity.work} aria-describedby={id + '-name-help'} onChange={event => setDraft({ ...draft, title: event.target.value })}/>
        <p className={s.fieldHelp} id={id + '-name-help'}>Solo el nombre; por ejemplo, {activity.work}. <span>{draft.title.length}/{learningLimits.titleMax}</span></p>
        <label htmlFor={id + '-practice'}>¿Qué aprendiste?</label>
        <textarea id={id + '-practice'} required minLength={1} rows={5} maxLength={learningLimits.practiceMax} value={draft.practice} placeholder={activity.example} aria-describedby={id + '-practice-help'} onChange={event => setDraft({ ...draft, practice: event.target.value })}/>
        <p className={s.fieldHelp} id={id + '-practice-help'}>Cuéntalo con tus palabras, en español o en inglés. <span>{draft.practice.length}/{learningLimits.practiceMax}</span></p>
        <label htmlFor={id + '-expression'}>Palabras o frases que aprendiste <small>Opcional</small></label>
        <textarea id={id + '-expression'} rows={2} maxLength={learningLimits.expressionMax} value={draft.expression} placeholder={activity.expression} aria-describedby={id + '-expression-help'} onChange={event => setDraft({ ...draft, expression: event.target.value })}/>
        <p className={s.fieldHelp} id={id + '-expression-help'}>Puedes dejarlo vacío. <span>{draft.expression.length}/{learningLimits.expressionMax}</span></p>
        {item?.example && <details><summary>Ejemplo que guardaste anteriormente (opcional)</summary><label htmlFor={id + '-example'}>Tu ejemplo anterior</label><textarea id={id + '-example'} rows={2} maxLength={learningLimits.legacyExampleMax} value={draft.example} onChange={event => setDraft({ ...draft, example: event.target.value })}/></details>}
        <label htmlFor={id + '-images'}>Imágenes de tu experiencia <small>Opcional · hasta 3 JPEG/PNG · 3 MB cada una</small></label>
        <input id={id + '-images'} type="file" accept="image/jpeg,image/png" multiple onChange={event => { void files(event.target.files); event.target.value = '' }}/>
        <p className={s.help}>Una portada, un cartel o una foto de tu actividad. Añade imágenes que puedas compartir.</p>
        <div className={s.attachments}>{draft.images.map((image, index) => <figure key={index}><img src={source(image)} alt={'Imagen adjunta ' + (index + 1)}/><button type="button" onClick={() => setDraft({ ...draft, images: draft.images.filter((_, i) => i !== index) })} aria-label={'Quitar imagen ' + (index + 1)}>Quitar</button></figure>)}</div>
      </fieldset>
      {reading && <p role="status">Preparando imágenes…</p>}{(error || connection.error) && <p role="alert" className={s.error}>{error || connection.error}</p>}
      <p className={s.help}>Guardar no publica nada. Desde tu colección podrás enviarlo para publicar con revisión de CAI, o pedir validación sin compartirlo.</p>
      <footer className={s.editorActions}><button type="button" disabled={busy} onClick={() => { void save('draft') }}>Guardar borrador</button><MotionButton className={s.primary} type="submit" disabled={busy}>{connection.busy ? 'Guardando…' : 'Guardar logro en privado'}</MotionButton></footer>
    </form>
  </dialog>
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
 <div className={s.collection}>{items.map(item => { const activity = activities[item.category], pending = item.review === 'pending', editable = !pending && !item.validatedAt && (!item.publication || ['rechazada', 'retirada'].includes(item.publication.status)), shared = item.publication?.status === 'publicada', postPending = item.publication?.status === 'pendiente'; return <article key={item.id} className={s.learningCard}><div className={s.cardTop}><span>{activity.symbol} {activity.title}</span><span className={s.state}>{item.state === 'draft' ? 'Borrador' : status[item.review]}</span></div>{item.images.length > 0 && <div className={s.photoRow}>{item.images.map(image => <img key={image.id} src={image.imagePath} alt={'Imagen de ' + item.title} loading="lazy"/>)}</div>}<h3>{item.title}</h3><p>{item.practice || 'Tu experiencia está empezando.'}</p>{(item.expression || item.example) && <blockquote>{item.expression}{item.example && <small>{item.example}</small>}</blockquote>}<p className={s.help}>{shared ? 'Compartido con la comunidad' : postPending ? 'Publicación en revisión' : pending ? 'Validación privada: no se publicará' : 'Solo tú puedes ver este logro aquí.'}</p>{item.reason && <p className={s.feedback}><b>Coordinación:</b> {item.reason}</p>}<div className={s.cardActions}>{editable && <button type="button" onClick={() => setEditor({ item, category: item.category })}>Editar logro</button>}{item.state === 'completed' && !pending && !postPending && !shared && <><button type="button" className={s.primary} disabled={connection.busy || !connection.submissionsOpen} onClick={() => { void run(connection.submitAchievement(item, true)); }}>Enviar para publicar</button>{!item.validatedAt && <button type="button" disabled={connection.busy} onClick={() => { void run(connection.submitAchievement(item, false)); }}>Validar sin publicar</button>}</>}{pending && <button type="button" disabled={connection.busy} onClick={() => { void run(connection.cancelAchievement(item)); }}>Retirar solicitud</button>}{shared && <><button type="button" onClick={() => setDetail({ postId: item.publication!.id, comments: false })}>Ver publicación</button><button type="button" disabled={connection.busy} onClick={() => { void run(connection.withdrawAchievement(item.publication!)); }}>Dejar de compartir</button></>}{postPending && !pending && <button type="button" disabled={connection.busy} onClick={() => { void run(connection.withdrawAchievement(item.publication!)); }}>Retirar publicación</button>}</div></article>; })}</div>
 {(cursor === undefined ? connection.achievements.nextCursor : cursor) && <button type="button" disabled={loading} onClick={() => { void more(); }}>Ver logros anteriores</button>}{error && <p role="alert">{error}</p>}{editor && <LearningEditor key={editor.item?.id ?? editor.category} {...editor} connection={connection} onClose={() => { setEditor(null); setOlder([]); setCursor(undefined); }}/>}</div>;
}
