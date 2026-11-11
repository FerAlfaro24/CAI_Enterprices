import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from '../layouts/AdminLayout'
import { AppLayout } from '../layouts/AppLayout'
import { LandingLayout } from '../layouts/LandingLayout'
import { CommunityLayout } from '../layouts/CommunityLayout'
import { AdminPage } from '../pages/AdminPage'
import { AdminPostsPage } from '../pages/AdminPostsPage'
import { AdminRequestsPage } from '../pages/AdminRequestsPage'
import { AdminSettingsPage } from '../pages/AdminSettingsPage'
import { AdminStudentsPage } from '../pages/AdminStudentsPage'
import { CommunityPage } from '../pages/CommunityPage'
import { InstitutionalPage } from '../pages/InstitutionalPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { LoginPage } from '../pages/LoginPage'
import { SignupPage } from '../pages/SignupPage'
import { LocalAccessApp } from '../features/local-access/LocalAccessApp'
import { ActivateAccountPage } from '../features/local-access/ActivateAccountPage'
import { StudentArea } from '../features/local-access/StudentArea'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<LandingLayout />}>
        <Route index element={<InstitutionalPage />} />
      </Route>
      <Route path="login" element={<LoginPage />} />
      <Route path="registro" element={<SignupPage />} />
      <Route path="registro-local" element={<SignupPage local />} />
      <Route path="gestion/*" element={<LocalAccessApp />} />
      <Route path="activar" element={<ActivateAccountPage />} />
      <Route path="alumnos" element={<StudentArea />} />
      <Route element={<CommunityLayout />}>
        <Route path="community" element={<CommunityPage />} />
      </Route>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminPage />} />
        <Route path="solicitudes" element={<AdminRequestsPage />} />
        <Route path="publicaciones" element={<AdminPostsPage />} />
        <Route path="alumnos" element={<AdminStudentsPage />} />
        <Route path="configuracion" element={<AdminSettingsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
