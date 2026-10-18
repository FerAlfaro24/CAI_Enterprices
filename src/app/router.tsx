import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from '../layouts/AdminLayout'
import { AppLayout } from '../layouts/AppLayout'
import { LandingLayout } from '../layouts/LandingLayout'
import { AdminPage } from '../pages/AdminPage'
import { AdminPostsPage } from '../pages/AdminPostsPage'
import { AdminRequestsPage } from '../pages/AdminRequestsPage'
import { AdminSettingsPage } from '../pages/AdminSettingsPage'
import { AdminStudentsPage } from '../pages/AdminStudentsPage'
import { CommunityPage } from '../pages/CommunityPage'
import { InstitutionalPage } from '../pages/InstitutionalPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { SignupPage } from '../pages/SignupPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<LandingLayout />}>
        <Route index element={<InstitutionalPage />} />
      </Route>
      <Route path="registro" element={<SignupPage />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminPage />} />
        <Route path="solicitudes" element={<AdminRequestsPage />} />
        <Route path="publicaciones" element={<AdminPostsPage />} />
        <Route path="alumnos" element={<AdminStudentsPage />} />
        <Route path="configuracion" element={<AdminSettingsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="community" element={<CommunityPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
