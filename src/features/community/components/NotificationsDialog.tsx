import { useId } from 'react'
import { useCommunityDialog } from '../useCommunityDialog'
import { CommunityIcon } from './ui'
import { StudentNotices } from './StudentNotices'
import s from '../community.module.css'

export function NotificationsDialog({ onClose }: { onClose: () => void }) {
  const dialog = useCommunityDialog(), id = useId()
  return <dialog ref={dialog} className={s.profileDialog} aria-labelledby={`${id}-title`} onCancel={event => { event.preventDefault(); onClose() }}>
    <div className={s.dialogHeading}><div><span className={s.eyebrow}>TU BANDEJA PERSONAL</span><h2 id={`${id}-title`}>Mis notificaciones</h2></div><button type="button" className={s.iconButton} onClick={onClose} aria-label="Cerrar notificaciones"><CommunityIcon name="close" /></button></div>
    <StudentNotices />
  </dialog>
}
