import { Route, Routes } from 'react-router'
import { AppLayout } from '../layouts/AppLayout'
import { AdminPage } from '../pages/AdminPage'
import { CommunityPage } from '../pages/CommunityPage'
import { InstitutionalPage } from '../pages/InstitutionalPage'
import { NotFoundPage } from '../pages/NotFoundPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<InstitutionalPage />} />
        <Route path="community" element={<CommunityPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
