import { BrowserRouter } from 'react-router'
import { DemoStoreProvider } from './DemoStoreProvider'
import { AppRoutes } from './router'

export function App() {
  return (
    <BrowserRouter>
      <DemoStoreProvider>
        <AppRoutes />
      </DemoStoreProvider>
    </BrowserRouter>
  )
}
