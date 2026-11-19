import { useRef, useState } from 'react'
import { ApiError, galleryApi } from '../../local-access/api'
import s from '../admin.module.css'

export function OfficialMediaLoader({ onSaved, onAccessLost }: { onSaved: () => Promise<void>; onAccessLost: () => void }) {
  const writing = useRef(false)
  const [confirmed, setConfirmed] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [error, setError] = useState('')
  const load = async () => {
    if (writing.current || !confirmed) return
    writing.current = true; setBusy(true); setError(''); setNotice('')
    try {
      const result = await galleryApi.importOfficial()
      setNotice(`${result.added} fotos añadidas. ${result.retained} ya estaban registradas. Las fotos retiradas no se vuelven a publicar.`)
      setConfirmed(false); await onSaved()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) onAccessLost()
      setError(error instanceof Error ? error.message : 'No pudimos completar la carga. Puedes reintentar sin duplicar fotos.')
    } finally { writing.current = false; setBusy(false) }
  }
  return <section className={s.card} aria-labelledby="official-media-title">
    <div className={s['card-head']}><div><h2 id="official-media-title" className={s['card-title']}>Fotos oficiales de CAI</h2><p className={s['card-sub']}>Seis recuerdos de cumpleaños y convivencias, preparados y autorizados para la comunidad. Puedes retirar cada foto desde la lista. Repetir la carga no crea duplicados.</p></div></div>
    <label className={s.confirm}><input type="checkbox" checked={confirmed} disabled={busy} onChange={event => setConfirmed(event.target.checked)} />Compartir las seis fotos con todos los alumnos aprobados</label>
    <button type="button" className={`${s.btn} ${s['btn--primary']}`} disabled={busy || !confirmed} onClick={() => { void load() }}>{busy ? 'Cargando fotos…' : 'Cargar fotos oficiales'}</button>
    {error && <p className={s.alert} role="alert">{error}</p>}{notice && <p className={`${s.alert} ${s['alert--ok']}`} role="status">{notice}</p>}
  </section>
}
