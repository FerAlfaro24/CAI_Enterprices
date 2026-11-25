import { BrowserRouter } from 'react-router'
import { AppRoutes } from './router'
import { ThemeProvider } from './ThemeProvider'
import { RouteContent } from './RouteContent'
import { lazy, Suspense } from 'react'

const PresentationTools = import.meta.env.MODE === 'presentation' ? lazy(() => import('../features/presentation/PresentationTools').then(module => ({ default: module.PresentationTools }))) : null

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <RouteContent>
          <AppRoutes />
        </RouteContent>
        {PresentationTools && <Suspense fallback={null}><PresentationTools /></Suspense>}
      </ThemeProvider>
    </BrowserRouter>
  )
}
