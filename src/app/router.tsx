import { Navigate, Route, Routes } from 'react-router'
import { AdminLayout } from '../layouts/AdminLayout'
import { AppLayout } from '../layouts/AppLayout'
import { LandingLayout } from '../layouts/LandingLayout'
import { CommunityLayout } from '../layouts/CommunityLayout'
import { AdminPage } from '../pages/AdminPage'
import { AdminRequestsPage } from '../pages/AdminRequestsPage'
import { AdminStudentsPage } from '../pages/AdminStudentsPage'
import { AdminGalleryPage } from '../pages/AdminGalleryPage'
import { AdminInboxPage } from '../pages/AdminInboxPage'
import { AdminSettingsPage } from '../pages/AdminSettingsPage'
import { AdminPostsPage } from '../pages/AdminPostsPage'
import { ConnectedCommunity } from '../features/community/ConnectedCommunity'
import { CommunityPage } from '../pages/CommunityPage'
import { InstitutionalPage } from '../pages/InstitutionalPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { LoginPage } from '../pages/LoginPage'
import { SignupPage } from '../pages/SignupPage'
import { ActivateAccountPage } from '../features/local-access/ActivateAccountPage'
import { StudentArea } from '../features/local-access/StudentArea'
import { GoogleOnboardingPage } from '../features/local-access/GoogleOnboardingPage'
import { RecoveryPage } from '../features/local-access/RecoveryPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<LandingLayout />}>
        <Route index element={<InstitutionalPage />} />
      </Route>
      <Route path="login" element={<LoginPage />} />
      <Route path="registro" element={<SignupPage local />} />
      <Route path="registro-local" element={<Navigate to="/registro" replace />} />
      <Route path="gestion">
        <Route index element={<Navigate to="/admin" replace />} />
        <Route path="solicitudes" element={<Navigate to="/admin/solicitudes" replace />} />
        <Route path="alumnos" element={<Navigate to="/admin/alumnos" replace />} />
        <Route path="publicaciones" element={<Navigate to="/admin/publicaciones" replace />} />
        <Route path="avisos" element={<Navigate to="/admin/mensajes?bandeja=avisos" replace />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route path="activar" element={<ActivateAccountPage />} />
      <Route path="recuperar" element={<ActivateAccountPage recovery />} />
      <Route path="recuperar-acceso" element={<RecoveryPage />} />
      <Route path="mi-inscripcion" element={<StudentArea />} />
      <Route path="alumnos" element={<Navigate to="/mi-inscripcion" replace />} />
      <Route path="alumnos/publicaciones" element={<Navigate to="/community" replace />} />
      <Route path="solicitud-google" element={<GoogleOnboardingPage />} />
      <Route element={<ConnectedCommunity><CommunityLayout /></ConnectedCommunity>}>
        <Route path="community" element={<CommunityPage />} />
      </Route>
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<AdminPage />} />
        <Route path="solicitudes" element={<AdminRequestsPage />} />
        <Route path="publicaciones" element={<AdminPostsPage />} />
        <Route path="alumnos" element={<AdminStudentsPage />} />
        <Route path="configuracion" element={<AdminSettingsPage />} />
        <Route path="mensajes" element={<AdminInboxPage />} />
        <Route path="galeria" element={<AdminGalleryPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
