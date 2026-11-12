import { Component, Suspense, type ReactNode } from 'react'
import { useLocation } from 'react-router'
import s from './route-status.module.css'

/** Un fallo al descargar o representar una pantalla no deja una página en blanco. */
class PageErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }

  componentDidUpdate(previous: Readonly<{ children: ReactNode; resetKey: string }>) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false })
  }

  render() {
    if (this.state.failed) return <main className={s.status}>
      <h1>No pudimos abrir esta página</h1>
      <p role="alert">Comprueba la conexión y vuelve a cargar. Si continúa, avisa a coordinación.</p>
      <button type="button" onClick={() => window.location.reload()}>Volver a cargar</button>
      <a href="/">Volver al sitio</a>
    </main>
    return this.props.children
  }
}

export function RouteContent({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation()
  return <PageErrorBoundary resetKey={pathname + search}>
    <Suspense fallback={<main className={s.status}><p role="status">Cargando página…</p></main>}>{children}</Suspense>
  </PageErrorBoundary>
}
