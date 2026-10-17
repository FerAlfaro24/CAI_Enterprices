import { PlaceholderPage } from '../components/PlaceholderPage'

export function InstitutionalPage() {
  return (
    <PlaceholderPage
      area="Área pública"
      title="Centro de Asesorías Integrales"
      description="CAI es un centro de enseñanza de inglés. Esta página será el punto de entrada para conocer su propuesta educativa."
    >
      <h2 className="text-lg font-semibold text-slate-950">
        Presentación institucional en preparación
      </h2>
      <p className="mt-3 leading-relaxed text-slate-700">
        Aquí se incorporarán los programas, la metodología y los medios de
        contacto cuando el cliente valide la información.
      </p>
      <p className="mt-3 leading-relaxed text-slate-700">
        Utiliza la navegación temporal para recorrer las tres áreas del
        prototipo.
      </p>
    </PlaceholderPage>
  )
}
