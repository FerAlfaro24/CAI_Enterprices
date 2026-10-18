import { Route, Routes } from 'react-router'
import { AppLayout } from '../layouts/AppLayout'
import { LandingLayout } from '../layouts/LandingLayout'
import { CommunityLayout } from '../layouts/CommunityLayout'
import { AdminPage } from '../pages/AdminPage'
import { CommunityPage } from '../pages/CommunityPage'
import { InstitutionalPage } from '../pages/InstitutionalPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<LandingLayout />}>
        <Route index element={<InstitutionalPage />} />
      </Route>
      <Route element={<CommunityLayout />}>
        <Route path="community" element={<CommunityPage />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
