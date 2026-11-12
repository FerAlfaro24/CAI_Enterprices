import { BrowserRouter } from 'react-router'
import { AppRoutes } from './router'
import { ThemeProvider } from './ThemeProvider'
import { RouteContent } from './RouteContent'

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <RouteContent>
          <AppRoutes />
        </RouteContent>
      </ThemeProvider>
    </BrowserRouter>
  )
}
