import { PlaceholderPage } from '../components/PlaceholderPage'

export function CommunityPage() {
  return (
    <PlaceholderPage
      area="Área de alumnos · Simulación"
      title="Comunidad"
      description="Espacio provisional para la futura comunidad privada de alumnos de CAI. Esta demostración es accesible sin credenciales."
    >
      <h2 className="text-lg font-semibold text-slate-950">
        Comunidad en preparación
      </h2>
      <p className="mt-3 leading-relaxed text-slate-700">
        En una siguiente etapa del prototipo se mostrarán publicaciones, logros y
        perfiles ficticios. Por ahora, esta pantalla permite comprobar la
        navegación.
      </p>
      <p className="mt-3 leading-relaxed text-slate-700">
        No hay cuentas, sesiones ni almacenamiento de información de alumnos.
      </p>
    </PlaceholderPage>
  )
}
