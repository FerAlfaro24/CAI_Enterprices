import { Link } from 'react-router'
import { PlaceholderPage } from '../components/PlaceholderPage'

export function NotFoundPage() {
  return (
    <PlaceholderPage
      area="Error 404"
      title="Página no encontrada"
      description="La dirección solicitada no forma parte del prototipo."
    >
      <Link
        to="/"
        className="inline-flex min-h-11 items-center font-medium text-slate-900 underline underline-offset-4"
      >
        Volver al inicio
      </Link>
    </PlaceholderPage>
  )
}
