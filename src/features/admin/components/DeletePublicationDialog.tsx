import { useId,useRef,useState } from 'react'
import { useAdminModal } from '../useAdminModal'
import { Icon } from './ui'
import s from '../admin.module.css'

/** Eliminación lógica: el expediente conserva motivo y autor de la medida. */
export function DeletePublicationDialog({title,onClose,onDelete}:{title:string;onClose:()=>void;onDelete:(reason:string)=>Promise<boolean>}) {
 const ref=useAdminModal(),id=useId(),writing=useRef(false)
 const [reason,setReason]=useState(''),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
 return <dialog ref={ref} className={`${s.dialog} ${s['local-dialog']}`} aria-labelledby={id+'-heading'} onCancel={event=>{event.preventDefault();if(!busy)onClose()}}>
  <header className={s['dialog-head']}><div><h2 id={id+'-heading'}>Eliminar publicación</h2><p>{title}</p></div><button type="button" className={s['icon-btn']} aria-label="Cancelar eliminación" disabled={busy} onClick={onClose}><Icon name="close"/></button></header>
  <form onSubmit={event=>{event.preventDefault();if(writing.current||!confirmed)return;writing.current=true;setBusy(true);setError('');void onDelete(reason.trim()).then(ok=>{if(ok)onClose();else setError('No se confirmó la eliminación. Revisa el mensaje de administración y actualiza antes de volver a intentarlo.')}).catch(()=>setError('No se pudo confirmar la eliminación. Actualiza para comprobar su estado.')).finally(()=>{writing.current=false;setBusy(false)})}}>
   <div className={s['dialog-body']}><p>Dejará de verse en Inicio, el carrusel, Galería y los perfiles. Conservaremos el registro y el motivo para coordinación. Esta acción no se puede deshacer.</p>
    <label className={s.field}>Motivo privado de eliminación<textarea required minLength={5} maxLength={240} rows={3} value={reason} disabled={busy} onChange={event=>setReason(event.target.value)}/></label>
    <label className={s.confirm}><input type="checkbox" checked={confirmed} disabled={busy} onChange={event=>setConfirmed(event.target.checked)}/>Confirmo que quiero eliminar esta publicación de la comunidad.</label>{error&&<p role="alert" className={s.alert}>{error}</p>}
   </div><footer className={s['dialog-foot']}><button type="button" className={s.btn} disabled={busy} onClick={onClose}>Cancelar</button><button type="submit" className={`${s.btn} ${s['btn--reject']}`} disabled={busy||!confirmed}>{busy?'Eliminando…':'Eliminar de la comunidad'}</button></footer>
  </form>
 </dialog>
}
