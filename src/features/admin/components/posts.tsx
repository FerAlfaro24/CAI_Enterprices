import { useEffect, useId, useRef, useState } from 'react'
import { cx } from '../../landing/utils'
import s from '../admin.module.css'
import { rejectReasons, type Post } from '../data/mockData'
import { formatDate, useAdmin } from '../state'
import { Avatar, Icon, StatusBadge, TypeTag, Switch } from './ui'

/** Marcador gráfico: el prototipo no muestra fotografías de alumnos. */
function MediaPlaceholder({ caption }: { caption: string }) {
  return (
    <div className={s.media} role="img" aria-label={caption}>
      <Icon name="image" size={28} />
      <span>{caption}</span>
    </div>
  )
}

export function PostCard({ post, onReview }: { post: Post; onReview: () => void }) {
  const { dispatch, announce, connection } = useAdmin()
  return (
    <article className={cx(s.card, s.post)}>
      <div className={s['post-meta']}>
        <TypeTag type={post.type} />
        <StatusBadge status={post.status} />
      </div>
      <h2 className={s['post-title']}>{post.title}</h2>
      <p className={s['post-body']}>{post.body}</p>
      {post.media && <MediaPlaceholder caption={post.media.caption} />}
      {post.checks && post.status === 'pendiente' && (
        <p className={s['post-flag']}><Icon name="alert" size={16} />Requiere verificación</p>
      )}
      {post.status === 'rechazada' && post.rejectReason && (
        <p className={s['post-reason']}>Motivo: {post.rejectReason}</p>
      )}
      <div className={s['post-author']}>
        <Avatar name={post.author} small />
        <div>
          <strong>{post.author}</strong>
          <span>{post.program} · {formatDate(post.submittedAt)}</span>
        </div>
        {post.authorIsMinor && <span className={cx(s.tag, s['tag--minor'])}>Menor</span>}
      </div>
      <div className={s['post-actions']}>
        <button type="button" className={cx(s.btn, s['btn--ghost'], s['btn--sm'])} onClick={onReview}>
          <Icon name="eye" size={16} />Revisar<span className={s['sr-only']}> «{post.title}»</span>
        </button>
        {!connection && post.status === 'pendiente' && !post.checks && (
          <button type="button" className={cx(s.btn, s['btn--approve'], s['btn--sm'])} onClick={() => {
            dispatch({ type: 'moderate', id: post.id, status: 'publicada' })
            announce(`Publicación «${post.title}» publicada.`)
          }}>
            <Icon name="check" size={16} />Publicar<span className={s['sr-only']}> «{post.title}»</span>
          </button>
        )}
      </div>
    </article>
  )
}

export function PostDialog({ post, onClose }: { post: Post | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  const { dispatch, announce, connection } = useAdmin()
  const [reason, setReason] = useState('')
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState(false)
  const reasonsId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (post && !dialog.open) dialog.showModal()
    if (!post && dialog.open) dialog.close()
  }, [post])

  const close = () => {
    if (connection?.busy) return
    setReason('')
    setChecked(false)
    setError(false)
    onClose()
  }

  const moderate = async (status: 'publicada' | 'rechazada') => {
    if (!post) return
    if (status === 'rechazada' && !reason) { setError(true); return }
    if (connection) {
      if (await connection.moderate(post.id, status === 'publicada' ? 'approve' : 'reject', status === 'rechazada' ? reason : undefined, checked)) close()
      return
    }
    dispatch({ type: 'moderate', id: post.id, status, reason: status === 'rechazada' ? reason : undefined })
    announce(`Publicación «${post.title}» ${status}.`)
    close()
  }

  const raw = connection?.posts.find(item => item.id === post?.id)
  const needsCheck = Boolean(connection || post?.checks) && !checked
  const cannotPublish = Boolean(connection && !raw?.authorActive)

  return (
    <dialog
      ref={ref}
      className={cx(s.dialog, s['dialog--wide'])}
      aria-labelledby="post-dialog-title"
      onClose={close}
      onCancel={(event) => { event.preventDefault(); close() }}
      onClick={(event) => { if (event.target === event.currentTarget) close() }}
    >
      {post && (
        <>
          <div className={s['dialog-head']}>
            <Avatar name={post.author} />
            <div>
              <h2 id="post-dialog-title">{post.title}</h2>
              <p>{post.author} · {post.program} · {formatDate(post.submittedAt)}</p>
            </div>
            <button type="button" className={s['icon-btn']} onClick={close} aria-label="Cerrar revisión">
              <Icon name="close" />
            </button>
          </div>
          <div className={s['dialog-body']}>
            <div className={s['post-meta']}>
              <TypeTag type={post.type} />
              <StatusBadge status={post.status} />
              {post.authorIsMinor && <span className={cx(s.tag, s['tag--minor'])}>Autor menor de edad</span>}
            </div>
            {raw && <p>Grupo: {raw.group}</p>}
            {raw&&raw.status!=='retirada'&&<Switch label="Recibir comentarios en esta historia" description="Pausar detiene nuevos comentarios. Conserva los publicados y permite retirar los propios." checked={raw.commentsOpen!==false} disabled={connection?.busy} onChange={open=>{void connection?.setCommentsOpen(raw,open)}}/>}
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{post.body}</p>
            {cannotPublish && <p className={s.alert}>El autor debe tener acceso activo y conservar el programa y grupo del envío para publicarlo.</p>}
            {connection?.error && <p className={s.alert} role="alert">{connection.error}</p>}
            {post.media && <MediaPlaceholder caption={post.media.caption} />}

            {post.status === 'pendiente' && (connection || post.checks) && (
              <div className={s.alert}>
                <ul className={s['check-list']}>{post.checks?.map((check) => <li key={check}>{check}</li>)}</ul>
                <label className={s.confirm}>
                  <input type="checkbox" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
                  Lo verifiqué y se puede publicar
                </label>
              </div>
            )}

            {post.status === 'pendiente' && (
              <fieldset className={s.reasons} aria-describedby={error ? `${reasonsId}-error` : undefined}>
                <legend>Motivo en caso de rechazo</legend>
                {rejectReasons.map((option) => (
                  <label key={option}>
                    <input type="radio" name="reject-reason" value={option} checked={reason === option} onChange={() => { setReason(option); setError(false) }} />
                    {option}
                  </label>
                ))}
                {error && <p id={`${reasonsId}-error`} className={s['field-error']} role="alert">Elige un motivo para rechazar la publicación.</p>}
              </fieldset>
            )}

            {post.status === 'rechazada' && post.rejectReason && (
              <p className={s.alert}>Rechazada por: {post.rejectReason}. {connection ? 'El alumno puede consultar este motivo en Mis publicaciones.' : 'El alumno vería este motivo en su perfil (simulado).'}</p>
            )}
            {post.status === 'publicada' && (
              <p className={cx(s.alert, s['alert--ok'])}>{connection ? 'Publicada para el grupo autorizado en CAI Community, mientras el autor conserve su acceso y asignación.' : 'Publicada en la demo de este panel. No se envía al feed de CAI Community.'}</p>
            )}
          </div>
          <div className={s['dialog-foot']}>
            {post.status === 'pendiente' ? (
              <>
                <button type="button" className={cx(s.btn, s['btn--reject'])} disabled={connection?.busy} onClick={() => { void moderate('rechazada') }}>
                  <Icon name="x" size={16} />Rechazar
                </button>
                <button
                  type="button"
                  className={cx(s.btn, s['btn--approve'])}
                  onClick={() => { void moderate('publicada') }}
                  disabled={needsCheck || cannotPublish || connection?.busy}
                  style={needsCheck ? { opacity: .45, cursor: 'not-allowed' } : undefined}
                >
                  <Icon name="check" size={16} />Publicar
                </button>
              </>
            ) : post.status === 'retirada' ? <p>El autor retiró esta publicación. No se puede volver a publicar.</p> : (
              <button type="button" className={cx(s.btn, s['btn--ghost'])} disabled={connection?.busy} onClick={() => {
                if (connection) { void connection.moderate(post.id, 'undo').then(ok => { if (ok) close() }); return }
                dispatch({ type: 'unmoderate', id: post.id })
                announce(`Publicación «${post.title}» devuelta a revisión.`)
                close()
              }}>
                <Icon name="undo" size={16} />Devolver a revisión
              </button>
            )}
          </div>
        </>
      )}
    </dialog>
  )
}
