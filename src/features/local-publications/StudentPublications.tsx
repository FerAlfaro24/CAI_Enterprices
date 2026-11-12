import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { publicationCategories, publicationLimits } from '../../../server/contracts'
import { ApiError, studentApi, type OwnPost, type PublicationDraft, type PublishedPost, type StudentUser } from '../local-access/api'
import { PublicationCard, PublicationStatusLabel } from './PublicationCard'
import s from '../admin/admin.module.css'
import p from './publications.module.css'

export function StudentPublications({ user, onAccessLost }: { user: StudentUser; onAccessLost: () => void }) {
  const [posts, setPosts] = useState<PublishedPost[]>([])
  const [mine, setMine] = useState<OwnPost[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [selected, setSelected] = useState<OwnPost | null>(null)
  const generation = useRef(0)
  const handleError = useCallback((error: unknown) => {
    if (error instanceof ApiError && error.status === 401) { setPosts([]); setMine([]); setSelected(null); onAccessLost() }
    return error instanceof Error ? error.message : 'No pudimos cargar las publicaciones.'
  }, [onAccessLost])
  const refresh = useCallback(() => {
    const current = ++generation.current
    return studentApi.posts().then((data) => {
      if (generation.current !== current) return
      setPosts(data.posts); setMine(data.mine); setLoaded(true); setError('')
    }).catch((error: unknown) => { if (generation.current === current) setError(handleError(error)) })
  }, [handleError])
  useEffect(() => {
    void refresh()
    const sequence = generation
    const visible = () => { if (document.visibilityState === 'visible') void refresh() }
    const interval = window.setInterval(visible, 15_000)
    document.addEventListener('visibilitychange', visible)
    return () => { sequence.current++; window.clearInterval(interval); document.removeEventListener('visibilitychange', visible) }
  }, [refresh])
  const send = async (draft: PublicationDraft, key: string) => {
    if (busy) return false
    setBusy(true); setError(''); setNotice('')
    try {
      await studentApi.createPost(draft, key)
      setNotice('Publicación enviada. CAI la revisará antes de compartirla con tu grupo.')
      await refresh()
      return true
    } catch (error) { setError(handleError(error)); return false }
    finally { setBusy(false) }
  }
  const withdraw = async () => {
    if (!selected || busy) return
    setBusy(true); setError(''); setNotice('')
    try {
      await studentApi.withdrawPost(selected)
      setSelected(null); setNotice('Publicación retirada. Ya no se muestra en tu grupo.')
      await refresh()
    } catch (error) {
      setError(handleError(error))
      if (error instanceof ApiError && error.status === 409) { setSelected(null); await refresh(); setError(error.message) }
    } finally { setBusy(false) }
  }
  return <div className={p.stack}>
    <div className={p.actions}><p className={s['card-sub']}>Comparte tus avances con tu programa y grupo. CAI revisa cada publicación antes de mostrarla.</p><button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={() => { void refresh() }}>Actualizar publicaciones</button></div>
    {notice && <p role="status" className={`${s.alert} ${s['alert--ok']}`}>{notice}</p>}
    {error && <div role="alert" className={s.alert}>{error} <button type="button" className={`${s.btn} ${s['btn--ghost']}`} onClick={() => { void refresh() }}>Volver a cargar</button></div>}
    {user.group === 'Por asignar' ? <p className={s.alert}>CAI debe asignarte un grupo antes de que puedas enviar y leer publicaciones del grupo.</p> : <PublicationComposer busy={busy} onSend={send} />}
    <section className={s.card} aria-labelledby="own-publications-title">
      <div className={s['card-head']}><div><h2 id="own-publications-title" className={s['card-title']}>Mis publicaciones</h2><p className={s['card-sub']}>Consulta la revisión o retira una publicación. Solo tú y coordinación ven los motivos de rechazo.</p></div></div>
      {!loaded && !error && <p className={s.empty} role="status">Cargando tus publicaciones…</p>}
      {loaded && !mine.length && <p className={s.empty}>Todavía no has enviado publicaciones.</p>}
      <ul className={p.mine}>{mine.map((post) => <li key={post.id} className={p.own}>
        <div className={p.meta}><PublicationStatusLabel status={post.status} /><span className={p.hint}>{publicationCategories[post.category]}</span></div>
        <details><summary>{post.title}</summary><p className={p.body}>{post.body}</p></details>
        {post.reason && <p className={s.alert}>Motivo del rechazo: {post.reason}</p>}
        {post.status !== 'retirada' && <div className={p.actions}><button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={() => setSelected(post)}>Retirar publicación<span className={s['sr-only']}>: {post.title}</span></button></div>}
      </li>)}</ul>
    </section>
    <section aria-labelledby="group-publications-title" className={p.stack}>
      <div><h2 id="group-publications-title" className={s['card-title']}>Publicaciones de mi grupo</h2><p className={s['card-sub']}>{user.program} · {user.group}</p></div>
      {loaded && !posts.length && <p className={s.empty}>Las publicaciones aparecerán aquí cuando CAI las apruebe.</p>}
      {posts.map((post) => <PublicationCard key={post.id} post={post} />)}
    </section>
    {selected && <WithdrawDialog post={selected} busy={busy} onClose={() => setSelected(null)} onConfirm={() => { void withdraw() }} />}
  </div>
}

function PublicationComposer({ busy, onSend }: { busy: boolean; onSend: (draft: PublicationDraft, key: string) => Promise<boolean> }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<PublicationDraft['category']>('achievement')
  const [error, setError] = useState('')
  const key = useRef(crypto.randomUUID())
  const titleField = useRef<HTMLInputElement>(null)
  const bodyField = useRef<HTMLTextAreaElement>(null)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return
    if (title.trim().length < publicationLimits.titleMin) { setError('Escribe un título de al menos 4 caracteres.'); titleField.current?.focus(); return }
    if (body.trim().length < publicationLimits.bodyMin) { setError('Cuéntanos tu avance o experiencia con al menos 10 caracteres.'); bodyField.current?.focus(); return }
    setError('')
    if (await onSend({ title: title.trim(), body: body.trim(), category }, key.current)) {
      setTitle(''); setBody(''); key.current = crypto.randomUUID()
    }
  }
  return <section className={s.card} aria-labelledby="compose-publication-title">
    <div className={s['card-head']}><div><h2 id="compose-publication-title" className={s['card-title']}>Comparte un avance</h2><p className={s['card-sub']}>Cuenta algo que lograste o viviste aprendiendo inglés.</p></div></div>
    <form className={p.form} aria-label="Enviar publicación" aria-busy={busy} noValidate onSubmit={(event) => { void submit(event) }}>
      <div className={p.field}><label htmlFor="publication-category">Tipo de publicación</label><select id="publication-category" value={category} disabled={busy} onChange={(event) => setCategory(event.target.value as PublicationDraft['category'])}>{Object.entries(publicationCategories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
      <div className={p.field}><label htmlFor="publication-title">Título</label><input ref={titleField} id="publication-title" maxLength={publicationLimits.titleMax} value={title} disabled={busy} onChange={(event) => { setTitle(event.target.value); setError('') }} aria-describedby="publication-title-hint" /><span id="publication-title-hint" className={p.hint}>{title.length}/{publicationLimits.titleMax} caracteres</span></div>
      <div className={p.field}><label htmlFor="publication-body">Tu historia</label><textarea ref={bodyField} id="publication-body" rows={5} maxLength={publicationLimits.bodyMax} value={body} disabled={busy} onChange={(event) => { setBody(event.target.value); setError('') }} aria-describedby="publication-body-hint" /><span id="publication-body-hint" className={p.hint}>{body.length}/{publicationLimits.bodyMax} caracteres · Evita teléfonos, direcciones y datos personales de otras personas.</span></div>
      {error && <p role="alert">{error}</p>}
      <div className={p.actions}><button type="submit" className={`${s.btn} ${s['btn--primary']}`} disabled={busy}>{busy ? 'Enviando…' : 'Enviar a revisión'}</button><span className={p.hint}>Se compartirá cuando CAI la apruebe.</span></div>
    </form>
  </section>
}

function WithdrawDialog({ post, busy, onClose, onConfirm }: { post: OwnPost; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal() }, [])
  return <dialog ref={ref} className={`${s.dialog} ${s['local-dialog']}`} aria-labelledby="withdraw-publication-title" onClose={onClose} onCancel={(event) => { event.preventDefault(); if (!busy) onClose() }}>
    <div className={s['dialog-head']}><h2 id="withdraw-publication-title">¿Retirar esta publicación?</h2></div>
    <div className={s['dialog-body']}><strong className={p.body}>{post.title}</strong><p>Dejará de mostrarse al grupo. Se conservará en tu historial como retirada y coordinación no podrá volver a publicarla.</p></div>
    <div className={s['dialog-foot']}><button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={onClose}>Cancelar</button><button type="button" className={`${s.btn} ${s['btn--reject']}`} disabled={busy} onClick={onConfirm}>Sí, retirar publicación</button></div>
  </dialog>
}
