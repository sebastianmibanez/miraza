import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/dashboard/DashboardLayout'

// Home eager — es lo primero que ve el usuario
import Home from './pages/Home'

// Todo lo demás lazy — no se descarga hasta que se navega ahí
const QuienesSomos   = lazy(() => import('./pages/QuienesSomos'))
const Planes         = lazy(() => import('./pages/Planes'))
const Aranceles      = lazy(() => import('./pages/Aranceles'))
const Apoyo          = lazy(() => import('./pages/Apoyo'))
const Contacto       = lazy(() => import('./pages/Contacto'))
const Testimonios    = lazy(() => import('./pages/Testimonios'))
const Vitrina        = lazy(() => import('./pages/Vitrina'))
const PerfilProfe    = lazy(() => import('./pages/PerfilProfe'))
const Login          = lazy(() => import('./pages/Login'))

const DashboardPaes      = lazy(() => import('./pages/dashboards/DashboardPaes'))
const DashboardNem       = lazy(() => import('./pages/dashboards/DashboardNem'))
const DashboardNivelacion = lazy(() => import('./pages/dashboards/DashboardNivelacion'))
const DashboardEspecial  = lazy(() => import('./pages/dashboards/DashboardEspecial'))
const DashboardDocente   = lazy(() => import('./pages/dashboards/DashboardDocente'))

function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--light)', borderTopColor: 'var(--gold)', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public site */}
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="quienes-somos" element={<QuienesSomos />} />
              <Route path="planes"        element={<Planes />} />
              <Route path="aranceles"     element={<Aranceles />} />
              <Route path="apoyo"         element={<Apoyo />} />
              <Route path="contacto"      element={<Contacto />} />
              <Route path="testimonios"   element={<Testimonios />} />
              <Route path="vitrina"       element={<Vitrina />} />
              <Route path="profes/:id"    element={<PerfilProfe />} />
            </Route>

            {/* Login (sin Layout) */}
            <Route path="/login" element={<Login />} />

            {/* Protected dashboards */}
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard/paes"       element={<DashboardPaes />} />
                <Route path="/dashboard/nem"        element={<DashboardNem />} />
                <Route path="/dashboard/nivelacion" element={<DashboardNivelacion />} />
                <Route path="/dashboard/especial"   element={<DashboardEspecial />} />
                <Route path="/dashboard/docente"    element={<DashboardDocente />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
