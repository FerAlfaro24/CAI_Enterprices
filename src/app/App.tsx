import { BrowserRouter } from 'react-router'
import { DemoStoreProvider } from './DemoStoreProvider'
import { CommunityProvider } from '../features/community/CommunityProvider'
import { AppRoutes } from './router'
import { ThemeProvider } from './ThemeProvider'

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <DemoStoreProvider>
          <CommunityProvider>
            <AppRoutes />
          </CommunityProvider>
        </DemoStoreProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
