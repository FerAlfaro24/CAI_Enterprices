import { useEffect, useRef, useState } from 'react'
import { noticeApi, type LocalNotice, type ActivationInvitation } from './api'
import s from '../admin/admin.module.css'

export function LocalNotices() {
  const [items, setItems] = useState<LocalNotice[]>([]), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<ActivationInvitation | null>(null)
  const load = () => noticeApi.list().then(({notices}) => { setItems(notices); setError('') }).catch((error: unknown) => setError(error instanceof Error ? error.message : 'No pudimos cargar los avisos.'))
  useEffect(() => { void load() }, [])
  const action = async (item: LocalNotice, open: boolean) => {
    if (busy) return
    setBusy(true); setError('')
    try { if (open) setPreview(await noticeApi.preview(item.id)); else { await noticeApi.acknowledge(item.id); await load() } }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo completar la operación.') }
    finally { setBusy(false) }
  }
  return <>
    <p className={s.alert}>Bandeja de pruebas locales. Estos avisos no se han enviado por correo. Los enlaces de recuperación son solo para comprobar el recorrido con cuentas ficticias; no prueban la identidad del destinatario.</p>
    <button className={`${s.btn} ${s['btn--ghost']}`} type="button" onClick={() => { void load() }}>Actualizar avisos</button>
    {error && <p className={s.alert} role="alert">{error}</p>}
    <ul className={`${s.queue} ${s['local-records']}`}>{items.map((item) => <li key={item.id}>
      <div className={s['queue-person']}><div><strong>{item.subject}</strong><span>{item.recipient}</span><span>{item.message}</span><span>{item.acknowledged ? 'Revisado · Sin envío de correo' : 'Por revisar · Sin envío de correo'}</span></div></div>
      {item.kind === 'recovery' && <button type="button" className={`${s.btn} ${s['btn--primary']}`} disabled={busy} onClick={() => { void action(item, true) }}>Preparar enlace de prueba<span className={s['sr-only']}> para {item.recipient}</span></button>}
      {!item.acknowledged && <button type="button" className={`${s.btn} ${s['btn--ghost']}`} disabled={busy} onClick={() => { void action(item, false) }}>Marcar revisado<span className={s['sr-only']}>: {item.subject}</span></button>}
    </li>)}</ul>
    {!items.length && <p className={s.empty}>No hay avisos locales todavía.</p>}
    {preview && <RecoveryPreview invitation={preview} onClose={() => setPreview(null)} />}
  </>
}
function RecoveryPreview({ invitation, onClose }: { invitation: ActivationInvitation; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => { ref.current?.showModal() }, [])
  return <dialog ref={ref} className={`${s.dialog} ${s['local-dialog']}`} aria-labelledby="recovery-preview-title" onClose={onClose} onCancel={onClose}>
    <div className={s['dialog-head']}><h2 id="recovery-preview-title">Enlace de recuperación de prueba</h2></div>
    <div className={s['dialog-body']}><p>Caduca en 15 minutos. Preparar otro invalida el anterior. No se envió por correo.</p>
      <div className={s['local-link-field']}><label htmlFor="recovery-preview-link">Enlace de recuperación</label><textarea id="recovery-preview-link" readOnly value={window.location.origin + invitation.path} /></div>
      <a className={`${s.btn} ${s['btn--primary']}`} href={invitation.path}>Probar recuperación</a>
    </div><div className={s['dialog-foot']}><button type="button" className={`${s.btn} ${s['btn--ghost']}`} onClick={onClose}>Cerrar</button></div>
  </dialog>
}
