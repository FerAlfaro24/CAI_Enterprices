import s from '../features/admin/admin.module.css'
import { Avatar, Icon, Switch } from '../features/admin/components/ui'
import { CatalogSettings } from '../features/admin/components/CatalogSettings'
import { AdminPasswordForm } from '../features/admin/components/AdminPasswordForm'
import { AdminTeamSettings } from '../features/admin/components/AdminTeamSettings'
import { adminTeam } from '../features/admin/data/mockData'
import { displayName, useAdmin, type Settings } from '../features/admin/state'

type SettingItem = { key: keyof Settings; label: string; description: string; locked?: boolean }

const groups: { title: string; description: string; icon: 'shield' | 'chat'; items: SettingItem[] }[] = [
  {
    title: 'Privacidad de menores',
    description: 'Reglas aplicadas a alumnos menores de edad.',
    icon: 'shield',
    items: [
      { key: 'requireGuardianConsent', label: 'Exigir autorización del tutor', description: 'Un menor no puede ingresar a la comunidad sin la autorización registrada de su padre, madre o tutor.', locked: true },
      { key: 'minorsPrivateByDefault', label: 'Perfiles de menores privados', description: 'Su perfil y sus datos solo los ve la coordinación.' },
      { key: 'hideLastNames', label: 'Ocultar apellidos en la comunidad', description: 'Muestra el nombre y la inicial del apellido en el feed.' },
    ],
  },
  {
    title: 'Publicaciones e interacción',
    description: 'Cómo participan los alumnos en el feed.',
    icon: 'chat',
    items: [
      { key: 'reviewAllPosts', label: 'Revisar todas las publicaciones', description: 'Nada aparece en el feed sin la aprobación de la coordinación.', locked: true },
      { key: 'allowPhotos', label: 'Permitir fotografías', description: 'Los alumnos pueden adjuntar una imagen a su publicación.' },
      { key: 'allowReactions', label: 'Permitir reacciones', description: 'Felicitaciones rápidas en las publicaciones (pendiente de decisión con CAI).' },
      { key: 'allowComments', label: 'Permitir comentarios', description: 'Respuestas escritas en las publicaciones (pendiente de decisión con CAI).' },
    ],
  },
]

export function AdminSettingsPage() {
  const { state, dispatch, announce, connection } = useAdmin()
  const { settings } = state

  return (
    <>
      <div className={s['page-head']}>
        <div>
          <p className={s.eyebrow}>Ajustes de la comunidad</p>
          <h1 className={s['page-title']}>Configuración</h1>
          <p className={s['page-lead']}>
            {connection ? 'Grupos y controles guardados en este equipo. Las reglas protegidas y las funciones pendientes se identifican abajo.' : 'Reglas de privacidad y participación. Los cambios son de demostración y solo duran mientras la pestaña esté abierta.'}
          </p>
        </div>
      </div>

      <div className={s['settings-grid']}>
        {connection?.configuration && <section className={s.card} aria-labelledby="settings-activity"><div className={s['card-head']}><div><h2 id="settings-activity" className={s['card-title']}>Solicitudes y publicaciones</h2><p className={s['card-sub']}>Las pausas se aplican a los nuevos envíos. Conservan las cuentas, historias, lectura y moderación existentes.</p></div></div>{([{key:'registrationOpen',label:'Recibir nuevas solicitudes',description:'Permite enviar solicitudes desde el registro; pausar no cancela las ya recibidas.'},{key:'submissionsOpen',label:'Recibir nuevas publicaciones',description:'Permite que alumnos envíen historias a revisión; siguen pudiendo leer y retirar las existentes.'}] as const).map(item => <Switch key={item.key} label={item.label} description={item.description} checked={connection.configuration!.settings[item.key]} disabled={connection.busy} onChange={value => { void connection.saveControls({...connection.configuration!.settings,[item.key]:value}) }} />)}</section>}
        {groups.map((group) => (
          <section key={group.title} className={s.card} aria-labelledby={`settings-${group.icon}`}>
            <div className={s['card-head']}>
              <div className={s['card-title-row']}>
                <span className={s['kpi-icon']}><Icon name={group.icon} /></span>
                <div>
                  <h2 id={`settings-${group.icon}`} className={s['card-title']}>{group.title}</h2>
                  <p className={s['card-sub']}>{group.description}</p>
                </div>
              </div>
            </div>
            {group.items.map((item) => (
              <Switch
                key={item.key}
                label={connection && item.key === 'hideLastNames' ? 'Usar el nombre visible aprobado' : connection && item.key === 'minorsPrivateByDefault' ? 'Expedientes de menores privados' : item.label}
                description={connection && item.key === 'hideLastNames' ? 'Se usa el alias del registro. Los menores solo pueden usar nombre abreviado o iniciales.' : connection && item.key === 'minorsPrivateByDefault' ? 'Solo coordinación consulta el expediente. Su grupo recibe únicamente alias, avatar e historias revisadas.' : connection && ['allowPhotos','allowReactions','allowComments'].includes(item.key) ? 'Esta función está pendiente de integración; permanece desactivada.' : item.description}
                locked={connection ? true : item.locked}
                lockedLabel={connection && ['allowPhotos','allowReactions','allowComments'].includes(item.key) ? 'Pendiente' : 'Protegido'}
                checked={settings[item.key]}
                onChange={(value) => {
                  dispatch({ type: 'setting', key: item.key, value })
                  announce(`${item.label}: ${value ? 'activado' : 'desactivado'}.`)
                }}
              />
            ))}
          </section>
        ))}

        <CatalogSettings />
        <AdminPasswordForm />
        <section className={s.card} aria-labelledby="preview-title">
          <div className={s['card-head']}>
            <div>
              <h2 id="preview-title" className={s['card-title']}>Vista previa en la comunidad</h2>
              <p className={s['card-sub']}>Ejemplo ficticio de presentación; no corresponde a una publicación ni a una alumna real.</p>
            </div>
          </div>
          <div className={s.preview}>
            <div className={s['post-author']}>
              <Avatar name="Camila Herrera" small />
              <div>
                <strong>{displayName('Camila Herrera', settings.hideLastNames)}</strong>
                <span>Preparación TOEFL · hace 2 h</span>
              </div>
            </div>
            <p className={s['post-title']}>¡Aprobé el TOEFL con 102 puntos!</p>
            {settings.allowPhotos && (
              <div className={s.media} role="img" aria-label="Imagen ilustrativa"><Icon name="image" size={24} /><span>Imagen ilustrativa</span></div>
            )}
            <div className={s['preview-actions']}>
              {settings.allowReactions && <span>👏 Felicitar · 12</span>}
              {settings.allowComments && <span>💬 Comentar</span>}
              {!settings.allowReactions && !settings.allowComments && <span>Sin interacción: solo lectura</span>}
            </div>
          </div>
        </section>

        {connection ? <AdminTeamSettings/> : <section className={s.card} aria-labelledby="team-title">
          <div className={s['card-head']}>
            <div>
              <h2 id="team-title" className={s['card-title']}>Equipo administrador</h2>
              <p className={s['card-sub']}>Cuentas ficticias con acceso al panel.</p>
            </div>
          </div>
          <ul className={s.queue}>
            {adminTeam.map((member) => (
              <li key={member.name}>
                <div className={s['queue-person']}>
                  <Avatar name={member.name} />
                  <div>
                    <strong>{member.name}</strong>
                    <span>{member.role} · {member.scope}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className={s.footnote}>La creación de otros administradores no está habilitada en esta sección.</p>
        </section>}
      </div>
    </>
  )
}
