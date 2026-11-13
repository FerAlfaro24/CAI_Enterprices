import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router'
const AdminLayout = lazy(() => import('../layouts/AdminLayout').then(module => ({ default: module.AdminLayout })))
const AppLayout = lazy(() => import('../layouts/AppLayout').then(module => ({ default: module.AppLayout })))
const LandingLayout = lazy(() => import('../layouts/LandingLayout').then(module => ({ default: module.LandingLayout })))
const CommunityLayout = lazy(() => import('../layouts/CommunityLayout').then(module => ({ default: module.CommunityLayout })))
const AdminPage = lazy(() => import('../pages/AdminPage').then(module => ({ default: module.AdminPage })))
const AdminRequestsPage = lazy(() => import('../pages/AdminRequestsPage').then(module => ({ default: module.AdminRequestsPage })))
const AdminStudentsPage = lazy(() => import('../pages/AdminStudentsPage').then(module => ({ default: module.AdminStudentsPage })))
const AdminGalleryPage = lazy(() => import('../pages/AdminGalleryPage').then(module => ({ default: module.AdminGalleryPage })))
const AdminChallengesPage = lazy(() => import('../pages/AdminChallengesPage').then(module => ({ default: module.AdminChallengesPage })))
const AdminInboxPage = lazy(() => import('../pages/AdminInboxPage').then(module => ({ default: module.AdminInboxPage })))
const AdminSettingsPage = lazy(() => import('../pages/AdminSettingsPage').then(module => ({ default: module.AdminSettingsPage })))
const AdminPostsPage = lazy(() => import('../pages/AdminPostsPage').then(module => ({ default: module.AdminPostsPage })))
const ConnectedCommunity = lazy(() => import('../features/community/ConnectedCommunity').then(module => ({ default: module.ConnectedCommunity })))
const CommunityPage = lazy(() => import('../pages/CommunityPage').then(module => ({ default: module.CommunityPage })))
const InstitutionalPage = lazy(() => import('../pages/InstitutionalPage').then(module => ({ default: module.InstitutionalPage })))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then(module => ({ default: module.NotFoundPage })))
const LoginPage = lazy(() => import('../pages/LoginPage').then(module => ({ default: module.LoginPage })))
const SignupPage = lazy(() => import('../pages/SignupPage').then(module => ({ default: module.SignupPage })))
const ActivateAccountPage = lazy(() => import('../features/local-access/ActivateAccountPage').then(module => ({ default: module.ActivateAccountPage })))
const StudentArea = lazy(() => import('../features/local-access/StudentArea').then(module => ({ default: module.StudentArea })))
const GoogleOnboardingPage = lazy(() => import('../features/local-access/GoogleOnboardingPage').then(module => ({ default: module.GoogleOnboardingPage })))
const RecoveryPage = lazy(() => import('../features/local-access/RecoveryPage').then(module => ({ default: module.RecoveryPage })))

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
      <Route path="recuperar-acceso-administrativo" element={<RecoveryPage admin />} />
      <Route path="recuperar-administracion" element={<ActivateAccountPage recovery admin />} />
      <Route path="activar-administracion" element={<ActivateAccountPage adminActivation />} />
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
        <Route path="retos" element={<AdminChallengesPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>
      <Route element={<AppLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
