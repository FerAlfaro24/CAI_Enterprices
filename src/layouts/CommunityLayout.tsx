import { Outlet } from 'react-router'
import { CommunityProvider } from '../features/community/CommunityProvider'
import { CommunityShell } from '../features/community/components/CommunityShell'

export function CommunityLayout() {
  return <CommunityProvider><CommunityShell><Outlet /></CommunityShell></CommunityProvider>
}
