import { useSearchParams } from 'react-router'
import { Link } from 'react-router'
import s from '../features/admin/admin.module.css'
import { Switch } from '../features/admin/components/ui'
import { CatalogSettings } from '../features/admin/components/CatalogSettings'
import { AdminPasswordForm } from '../features/admin/components/AdminPasswordForm'
import { AdminTeamSettings } from '../features/admin/components/AdminTeamSettings'
import { useAdmin } from '../features/admin/state'

const sections = { participacion: 'Participación', grupos: 'Grupos', equipo: 'Equipo', seguridad: 'Mi seguridad' } as const
export function AdminSettingsPage() {
  const { connection } = useAdmin()
  const [params, setParams] = useSearchParams()
  const selected = params.get('seccion') ?? 'participacion'
  const section = Object.hasOwn(sections, selected) ? selected : 'participacion'
  const configuration = connection?.configuration
  return <>
    <div className={s['page-head']}><div><p className={s.eyebrow}>Organiza la comunidad</p><h1 className={s['page-title']}>Configuración</h1><p className={s['page-lead']}>Elige qué necesitas gestionar. Los cambios se guardan por apartado.</p></div></div>
    <div className={s.toolbar}><div className={s.tabs} role="group" aria-label="Apartados de configuración">{Object.entries(sections).map(([key, label]) => <button key={key} type="button" className={s.tab} aria-pressed={section === key} onClick={() => setParams({ seccion: key })}>{label}</button>)}</div></div>
    <div hidden={section !== 'participacion'}>
      <div className={s['settings-grid']}>
        {configuration && <section className={s.card} aria-labelledby="participation-title"><h2 id="participation-title" className={s['card-title']}>Participación de alumnos</h2><p className={s['card-sub']}>Una pausa detiene nuevos envíos; conserva las cuentas, el contenido existente y su revisión.</p>
          {([
            { key: 'registrationOpen', label: 'Recibir nuevas solicitudes', description: 'Pueden solicitar ingreso desde el registro. Las solicitudes recibidas siguen disponibles al pausar.' },
            { key: 'submissionsOpen', label: 'Recibir nuevas publicaciones', description: 'Los alumnos envían historias a revisión. Al pausar pueden seguir leyendo y retirar las suyas.' },
            { key: 'reactionsOpen', label: 'Permitir reacciones', description: 'Pueden reaccionar a las historias disponibles para su cuenta. Al pausar se conservan los contadores y pueden quitar su reacción.' },
            { key: 'commentsOpen', label: 'Recibir nuevos comentarios', description: 'Se revisan antes de mostrarse. Al pausar se conservan los existentes y pueden retirar los propios.' },
          ] as const).map(item => <Switch key={item.key} label={item.label} description={item.description} checked={configuration.settings[item.key]} disabled={connection.busy} onChange={value => { void connection.saveControls({ ...configuration.settings, [item.key]: value }) }} />)}
        </section>}
        <section className={s.card} aria-labelledby="protected-title"><h2 id="protected-title" className={s['card-title']}>Privacidad y revisión</h2><p className={s['card-sub']}>Reglas protegidas que se aplican siempre.</p><ul className={s['check-list']}><li>Las publicaciones y comentarios requieren aprobación.</li><li>Los menores necesitan autorización registrada del tutor.</li><li>Los expedientes y motivos de revisión son privados.</li><li>La comunidad muestra el nombre visible autorizado.</li></ul><p>Los alumnos pueden adjuntar hasta tres imágenes a sus logros. Coordinación puede publicar historias, avisos y álbumes con hasta doce fotografías.</p><Link className={s['card-link']} to="/admin/publicaciones?bandeja=cai">Publicar como Equipo CAI →</Link></section>
      </div>
    </div>
    <div hidden={section !== 'grupos'}><CatalogSettings /></div>
    <div hidden={section !== 'equipo'}><AdminTeamSettings /></div>
    <div hidden={section !== 'seguridad'}><AdminPasswordForm /></div>
  </>
}
