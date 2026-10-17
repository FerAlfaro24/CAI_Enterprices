import { PlaceholderPage } from '../components/PlaceholderPage'

export function AdminPage() {
  return (
    <PlaceholderPage
      area="Área de administración · Simulación"
      title="Administración"
      description="Espacio provisional para el futuro panel de administración de CAI. El acceso está abierto únicamente para recorrer la demostración."
    >
      <h2 className="text-lg font-semibold text-slate-950">
        Panel en preparación
      </h2>
      <p className="mt-3 leading-relaxed text-slate-700">
        Aquí se prepararán las vistas de solicitudes de acceso y moderación de
        publicaciones con datos ficticios.
      </p>
      <p className="mt-3 leading-relaxed text-slate-700">
        Esta pantalla no otorga permisos ni permite gestionar usuarios reales.
      </p>
    </PlaceholderPage>
  )
}
