import { Outlet } from 'react-router'
import { CommunityShell } from '../features/community/components/CommunityShell'

export function CommunityLayout() {
  return <CommunityShell><Outlet /></CommunityShell>
}
